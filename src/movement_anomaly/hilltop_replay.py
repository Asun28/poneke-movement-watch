"""Parse official GWRC Hilltop observations into a replay-safe event pack."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from math import isfinite
from typing import Iterable
from xml.etree import ElementTree
from zoneinfo import ZoneInfo

WELLINGTON = ZoneInfo("Pacific/Auckland")


@dataclass(frozen=True)
class HilltopSeriesSpec:
    series_id: str
    site: str
    measurement: str
    latitude: float
    longitude: float
    cadence_minutes: int


def _local_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.strip())
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=WELLINGTON)
    return parsed.astimezone(WELLINGTON)


def _text(element: ElementTree.Element, name: str) -> str | None:
    child = element.find(f".//{{*}}{name}")
    if child is None:
        child = element.find(f".//{name}")
    return child.text.strip() if child is not None and child.text else None


def parse_hilltop_series(xml: str | bytes, spec: HilltopSeriesSpec) -> dict:
    """Return one normalized series while preserving the provider's values."""

    root = ElementTree.fromstring(xml)
    item_infos = root.findall(".//{*}ItemInfo") or root.findall(".//ItemInfo")
    item_number = "1"
    unit = "unknown"
    for item in item_infos:
        name = _text(item, "ItemName")
        if name == spec.measurement or len(item_infos) == 1:
            item_number = item.attrib.get("ItemNumber", "1")
            unit = _text(item, "Units") or "unknown"
            if name == spec.measurement:
                break

    value_tag = f"I{item_number}"
    rows = root.findall(".//{*}E") or root.findall(".//E")
    observations = []
    for row in rows:
        observed_text = _text(row, "T")
        value_text = _text(row, value_tag)
        if observed_text is None or value_text is None:
            continue
        try:
            value = float(value_text)
        except ValueError:
            continue
        if not isfinite(value):
            continue
        observed_at = _local_time(observed_text)
        available_at = observed_at + timedelta(minutes=spec.cadence_minutes)
        observations.append({
            "observed_at": observed_at.isoformat(),
            "available_at": available_at.isoformat(),
            "available_at_quality": "derived_cadence_bound",
            "value": value,
        })

    observations.sort(key=lambda row: row["observed_at"])
    peak_row = max(observations, key=lambda row: row["value"]) if observations else None
    return {
        "series_id": spec.series_id,
        "site": spec.site,
        "measurement": spec.measurement,
        "unit": unit,
        "cadence_minutes": spec.cadence_minutes,
        "geometry": {
            "type": "Point",
            "coordinates": [spec.longitude, spec.latitude],
        },
        "record_count": len(observations),
        "peak": ({
            "observed_at": peak_row["observed_at"],
            "value": peak_row["value"],
        } if peak_row else None),
        "observations": observations,
    }


def build_hilltop_replay_pack(series: Iterable[dict], retrieved_at: datetime) -> dict:
    normalized_series = list(series)
    return {
        "schema": "wellington-hilltop-replay-observations/v1",
        "source_id": "gwrc-hilltop",
        "source_authority": "Greater Wellington Regional Council",
        "truth": "official_historical_observations",
        "retrieved_at": retrieved_at.astimezone(WELLINGTON).isoformat(),
        "record_count": sum(item["record_count"] for item in normalized_series),
        "series_count": len(normalized_series),
        "series": normalized_series,
        "availability_policy": {
            "input_time_field": "available_at",
            "provider_publication_time_observed": False,
            "method": "observed_at plus declared series cadence",
            "quality": "derived_cadence_bound",
        },
        "training_policy": {
            "mock_excluded": True,
            "post_event_ground_truth_excluded": True,
            "event_time_cutoff_required": True,
        },
    }


def slice_hilltop_series(series: dict, start_at: datetime, end_at: datetime) -> dict:
    """Return a provider-faithful series slice using observed time bounds."""

    start = start_at.astimezone(WELLINGTON)
    end = end_at.astimezone(WELLINGTON)
    observations = [
        observation for observation in series.get("observations", [])
        if start <= _local_time(observation["observed_at"]) <= end
    ]
    peak_row = max(observations, key=lambda row: row["value"]) if observations else None
    return {
        **series,
        "record_count": len(observations),
        "peak": ({
            "observed_at": peak_row["observed_at"],
            "value": peak_row["value"],
        } if peak_row else None),
        "observations": observations,
    }
