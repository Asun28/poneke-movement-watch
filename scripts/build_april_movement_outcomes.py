"""Build retrospective April movement outcomes with the selected movement detector."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from movement_anomaly.contract import to_replay_collection
from movement_anomaly.detector import DetectorConfig
from movement_anomaly.io import load_metadata, load_parquet_shards
from movement_anomaly.pipeline import analyze_replay

START_AT = "2026-04-18T00:00:00+12:00"
END_AT = "2026-04-22T23:00:00+12:00"
LOOKBACK_WEEKS = 12


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("artifacts/local/transport-sensors"),
    )
    parser.add_argument(
        "--metadata",
        type=Path,
        default=Path("artifacts/local/transport-sensors/countline_meta_info.csv"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("site/public/cop/v4/april-storm-movement-outcomes.json"),
    )
    parser.add_argument("--retrieved-at", required=True)
    args = parser.parse_args()

    files = sorted(args.data_dir.glob("*.parquet"))
    mobility = load_parquet_shards(
        files,
        start_date=(pd.Timestamp(START_AT) - pd.Timedelta(weeks=LOOKBACK_WEEKS)).date().isoformat(),
        end_date=pd.Timestamp(END_AT).date().isoformat(),
    )
    metadata = load_metadata(args.metadata)
    replay = analyze_replay(
        mobility,
        start_at=START_AT,
        end_at=END_AT,
        lookback_weeks=LOOKBACK_WEEKS,
        config=DetectorConfig(),
    )
    pack = to_replay_collection(
        replay,
        metadata,
        "2026-08-06T23:00:00+12:00",
        "2026-04-20T12:00:00+12:00",
    )
    event_dates = pd.to_datetime(mobility["date"])
    event_rows = mobility[
        (event_dates >= pd.Timestamp("2026-04-18"))
        & (event_dates <= pd.Timestamp("2026-04-22"))
    ]
    pack.update({
        "retrieved_at": pd.Timestamp(args.retrieved_at).isoformat(),
        "event_id": "wellington-april-storm-2026",
        "model": {
            "id": "movement-seasonal-mad-v1",
            "type": "matched_weekday_hour_median_mad",
            "lookback_weeks": LOOKBACK_WEEKS,
            "selected_test_mae": 7.372,
            "benchmark_scope": "10 highest-volume countlines",
        },
        "window_record_count": int(len(event_rows)),
        "availability_role": "retrospective_outcome_only",
        "event_time_evidence": False,
        "reason": "The publisher cadence is at least monthly; April rows were not available as a verified live feed during the event.",
        "automatic_incident": False,
        "automatic_warning": False,
        "training_policy": {
            "matched_history_before_each_slot": True,
            "mock_excluded": True,
            "hydro_model_input": False,
            "post_event_ground_truth_excluded": True,
        },
        "time_policy": {
            "timezone": "Pacific/Auckland",
            "repeated_hour": "NZ standard-time occurrence (+12:00)",
            "nonexistent_hour": "shift forward",
            "reason": "Publisher rows contain local date and hour without an offset.",
        },
    })
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
