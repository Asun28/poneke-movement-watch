"""Cutoff-safe robust anomaly candidates for hydro-weather replay investigations."""

from __future__ import annotations

from datetime import datetime, timedelta
from math import isfinite
from statistics import median
from typing import Iterable

from movement_anomaly.hilltop_replay import WELLINGTON


def _time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=WELLINGTON)
    return parsed.astimezone(WELLINGTON)


def _quantile(values: list[float], probability: float) -> float:
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    position = (len(ordered) - 1) * probability
    lower = int(position)
    upper = min(len(ordered) - 1, lower + 1)
    fraction = position - lower
    return ordered[lower] + (ordered[upper] - ordered[lower]) * fraction


def _resolution(values: list[float]) -> float:
    unique = sorted(set(values))
    gaps = [right - left for left, right in zip(unique, unique[1:], strict=False) if right > left]
    return min(gaps) if gaps else max(abs(unique[0]) * 0.01, 0.001)


def _domain(measurement: str) -> str:
    return "rainfall" if "rain" in measurement.lower() else "river_flow"


def _episodes(candidates: list[dict], cadence_minutes: int, series: dict) -> list[dict]:
    if not candidates:
        return []
    groups: list[list[dict]] = [[candidates[0]]]
    maximum_gap = timedelta(minutes=max(1, cadence_minutes) * 2)
    for candidate in candidates[1:]:
        if _time(candidate["available_at"]) - _time(groups[-1][-1]["available_at"]) <= maximum_gap:
            groups[-1].append(candidate)
        else:
            groups.append([candidate])

    episodes = []
    for index, group in enumerate(groups, start=1):
        peak = max(group, key=lambda item: item["value"])
        episodes.append({
            "id": f"hydro-episode:{series['series_id']}:{index}",
            "series_id": series["series_id"],
            "site": series["site"],
            "measurement": series["measurement"],
            "unit": series["unit"],
            "domain": _domain(series["measurement"]),
            "geometry": series.get("geometry"),
            "starts_at": group[0]["available_at"],
            "ends_at": group[-1]["available_at"],
            "evidence_count": len(group),
            "peak_value": peak["value"],
            "peak_observed_at": peak["observed_at"],
            "threshold": peak["threshold"],
            "decision_role": "investigation_only",
            "incident_created": False,
        })
    return episodes


def build_hydro_detector_pack(
    series: Iterable[dict],
    *,
    training_cutoff: datetime,
    replay_end: datetime,
    retrieved_at: datetime,
) -> dict:
    """Build uncalibrated candidates without using event or post-event rows for fitting."""

    cutoff = training_cutoff.astimezone(WELLINGTON)
    end_at = replay_end.astimezone(WELLINGTON)
    results = []
    all_candidates = []
    all_episodes = []

    for item in series:
        observations = [
            observation for observation in item.get("observations", [])
            if isfinite(float(observation.get("value", float("nan"))))
        ]
        baseline = [observation for observation in observations if _time(observation["available_at"]) < cutoff]
        evaluation = [
            observation for observation in observations
            if _time(observation["observed_at"]) >= cutoff
            and _time(observation["available_at"]) <= end_at
        ]
        values = [float(observation["value"]) for observation in baseline]
        if values:
            center = median(values)
            mad = median(abs(value - center) for value in values)
            resolution = _resolution(values)
            robust_scale = max(1.4826 * mad, resolution)
            p99 = _quantile(values, 0.99)
            threshold = max(p99, center + 4.5 * robust_scale)
        else:
            center = mad = robust_scale = p99 = threshold = None

        candidates = []
        if threshold is not None and len(values) >= 24:
            for observation in evaluation:
                value = float(observation["value"])
                if value <= threshold:
                    continue
                candidates.append({
                    "id": f"hydro-candidate:{item['series_id']}:{observation['available_at']}",
                    "series_id": item["series_id"],
                    "site": item["site"],
                    "measurement": item["measurement"],
                    "unit": item["unit"],
                    "domain": _domain(item["measurement"]),
                    "geometry": item.get("geometry"),
                    "observed_at": observation["observed_at"],
                    "available_at": observation["available_at"],
                    "value": value,
                    "threshold": threshold,
                    "robust_excess": (value - threshold) / robust_scale if robust_scale else None,
                    "decision_role": "investigation_only",
                    "incident_created": False,
                })

        episodes = _episodes(candidates, int(item.get("cadence_minutes") or 5), item)
        result = {
            "series_id": item["series_id"],
            "site": item["site"],
            "measurement": item["measurement"],
            "unit": item["unit"],
            "domain": _domain(item["measurement"]),
            "geometry": item.get("geometry"),
            "baseline": {
                "available_before": cutoff.isoformat(),
                "record_count": len(values),
                "median": center,
                "mad": mad,
                "p99": p99,
                "robust_scale": robust_scale,
                "threshold": threshold,
            },
            "evaluation_record_count": len(evaluation),
            "candidate_count": len(candidates),
            "episode_count": len(episodes),
            "episodes": episodes,
        }
        results.append(result)
        all_candidates.extend(candidates)
        all_episodes.extend(episodes)

    return {
        "schema": "wellington-hydro-anomaly-candidates/v1",
        "source_id": "gwrc-hilltop",
        "retrieved_at": retrieved_at.astimezone(WELLINGTON).isoformat(),
        "model": {
            "id": "hydro-robust-v1",
            "type": "robust_univariate_detector",
            "calibration_status": "uncalibrated_case_study",
            "input_domains": ["rainfall", "river_flow"],
            "threshold": "max(baseline p99, median + 4.5 × max(1.4826 × MAD, measurement resolution))",
        },
        "training_policy": {
            "available_before": cutoff.isoformat(),
            "movement_model_reused": False,
            "mock_excluded": True,
            "post_event_ground_truth_excluded": True,
            "event_rows_excluded_from_fit": True,
        },
        "series_count": len(results),
        "candidate_count": len(all_candidates),
        "episode_count": len(all_episodes),
        "series": results,
        "episodes": all_episodes,
        "decision_policy": {
            "role": "investigation_only",
            "automatic_incident": False,
            "automatic_warning": False,
            "human_review_required": True,
        },
    }
