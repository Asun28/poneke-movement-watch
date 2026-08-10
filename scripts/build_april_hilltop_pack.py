"""Download the official GWRC Hilltop series used by the April 2026 replay."""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen

from movement_anomaly.hilltop_replay import (
    HilltopSeriesSpec,
    build_hilltop_replay_pack,
    parse_hilltop_series,
)


BASE_URL = "https://hilltop.gw.govt.nz/Data.hts"
WINDOW_START = "2026-04-18"
WINDOW_END = "2026-04-23"
SERIES = (
    HilltopSeriesSpec(
        series_id="berhampore-hourly-rainfall",
        site="Berhampore at Nursery",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.32322479,
        longitude=174.77164659,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="newtown-hourly-rainfall",
        site="Newtown at Carmichael Reservoir",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.31589434,
        longitude=174.78786302,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="hutt-river-taita-flow",
        site="Hutt River at Taita Gorge",
        measurement="Flow",
        latitude=-41.15660826,
        longitude=174.984782,
        cadence_minutes=5,
    ),
)


def hilltop_url(spec: HilltopSeriesSpec) -> str:
    pairs = (
        ("Service", "Hilltop"),
        ("Request", "GetData"),
        ("Site", spec.site),
        ("Measurement", spec.measurement),
        ("From", WINDOW_START),
        ("To", WINDOW_END),
    )
    return BASE_URL + "?" + "&".join(f"{key}={quote(value, safe='')}" for key, value in pairs)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("site/public/cop/v4/april-storm-hilltop-observations.json"),
    )
    parser.add_argument("--retrieved-at", required=True)
    args = parser.parse_args()

    normalized = []
    for spec in SERIES:
        with urlopen(hilltop_url(spec), timeout=60) as response:
            normalized.append(parse_hilltop_series(response.read(), spec))

    pack = build_hilltop_replay_pack(
        normalized,
        retrieved_at=datetime.fromisoformat(args.retrieved_at),
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
