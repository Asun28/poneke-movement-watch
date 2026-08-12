import pandas as pd

import movement_anomaly.pipeline as pipeline
from movement_anomaly.detector import DetectorConfig


def test_replay_uses_only_prior_matched_hours_and_keeps_empty_candidate_slots():
    rows = []
    for hour, historic_count, current_count in [(8, 100.0, 20.0), (9, 40.0, 40.0)]:
        for observed_date in pd.date_range("2026-05-14", periods=12, freq="7D"):
            rows.append(
                {
                    "countline_id": "47847",
                    "date": observed_date,
                    "hour": hour,
                    "count": historic_count,
                    "transport_class": "Pedestrian",
                    "direction": "SW",
                }
            )
        rows.append(
            {
                "countline_id": "47847",
                "date": pd.Timestamp("2026-08-06"),
                "hour": hour,
                "count": current_count,
                "transport_class": "Pedestrian",
                "direction": "SW",
            }
        )
    rows.append(
        {
            "countline_id": "47847",
            "date": pd.Timestamp("2026-08-13"),
            "hour": 8,
            "count": 999.0,
            "transport_class": "Pedestrian",
            "direction": "SW",
        }
    )

    replay = pipeline.analyze_replay(
        pd.DataFrame(rows),
        start_at="2026-08-06T08:00:00+12:00",
        end_at="2026-08-06T09:00:00+12:00",
        lookback_weeks=12,
        config=DetectorConfig(),
    )

    assert replay["available_from"] == "2026-08-06T08:00:00+12:00"
    assert replay["available_to"] == "2026-08-06T09:00:00+12:00"
    assert [slot["candidate_count"] for slot in replay["slots"]] == [1, 0]
    signal = replay["slots"][0]["signals"][0]
    assert signal["expected_count"] == 100.0
    assert signal["observed_count"] == 20.0
    assert len(signal["matched_history"]) == 12
    assert {point["observed_count"] for point in signal["matched_history"]} == {100.0}
    assert max(point["observed_at"] for point in signal["matched_history"]) < signal["observed_at"]
    assert all(point["observed_count"] != 999.0 for point in signal["matched_history"])


def test_replay_handles_the_repeated_hour_when_new_zealand_daylight_saving_ends():
    rows = [
        {
            "countline_id": "47847",
            "date": observed_date,
            "hour": 2,
            "count": 100.0,
            "transport_class": "Pedestrian",
            "direction": "SW",
        }
        for observed_date in pd.date_range("2026-01-25", periods=12, freq="7D")
    ]
    rows.append({
        "countline_id": "47847",
        "date": pd.Timestamp("2026-04-19"),
        "hour": 2,
        "count": 20.0,
        "transport_class": "Pedestrian",
        "direction": "SW",
    })

    replay = pipeline.analyze_replay(
        pd.DataFrame(rows),
        start_at="2026-04-19T02:00:00+12:00",
        end_at="2026-04-19T02:00:00+12:00",
        lookback_weeks=12,
        config=DetectorConfig(),
    )

    repeated_hour = next(
        point for point in replay["slots"][0]["signals"][0]["matched_history"]
        if point["observed_at"].startswith("2026-04-05T02:00:00")
    )
    assert repeated_hour["observed_at"].endswith("+12:00")
