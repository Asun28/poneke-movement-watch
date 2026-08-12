"""Download official GWRC hydro series and build the April 2026 replay packs."""

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
    slice_hilltop_series,
)
from movement_anomaly.hydro_detector import build_hydro_detector_pack

BASE_URL = "https://hilltop.gw.govt.nz/Data.hts"
BASELINE_START = "2026-04-01"
EVENT_START = "2026-04-18"
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
        series_id="te-papa-hourly-rainfall",
        site="Wellington at Te Papa",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.29029822,
        longitude=174.78132410,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="karori-reservoir-hourly-rainfall",
        site="Kaiwharawhara Stream at Karori Reservoir",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.29089198,
        longitude=174.75321612,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="seton-nossiter-hourly-rainfall",
        site="Porirua Stream at Seton Nossiter Park",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.20957672,
        longitude=174.81638169,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="birch-lane-hourly-rainfall",
        site="Hutt River at Birch Lane",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.21260048,
        longitude=174.92087073,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="savage-park-hourly-rainfall",
        site="Hutt River at Savage Park",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.12154048,
        longitude=175.07035545,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="pinehaven-reservoir-hourly-rainfall",
        site="Pinehaven Stream at Pinehaven Reservoir",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.15776221,
        longitude=175.00861682,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="wainui-reservoir-hourly-rainfall",
        site="Wainuiomata River at Wainui Reservoir",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.26829647,
        longitude=174.99004810,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="maymorn-hourly-rainfall",
        site="Mangaroa River at Maymorn Pump Station",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.10811976,
        longitude=175.13157346,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="lake-kohangatera-hourly-rainfall",
        site="Lake Kohangatera",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.37428665,
        longitude=174.86451878,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="kaitoke-headworks-hourly-rainfall",
        site="Hutt River at Kaitoke Headworks",
        measurement="Rainfall Running Hourly Totals",
        latitude=-41.05844383,
        longitude=175.18640867,
        cadence_minutes=60,
    ),
    HilltopSeriesSpec(
        series_id="hutt-river-birchville-flow",
        site="Hutt River at Birchville",
        measurement="Flow",
        latitude=-41.10017595,
        longitude=175.09076014,
        cadence_minutes=5,
    ),
    HilltopSeriesSpec(
        series_id="hutt-river-kaitoke-flow",
        site="Hutt River at Kaitoke",
        measurement="Flow",
        latitude=-41.05101129,
        longitude=175.19123118,
        cadence_minutes=5,
    ),
    HilltopSeriesSpec(
        series_id="porirua-town-centre-flow",
        site="Porirua Stream at Town Centre",
        measurement="Flow",
        latitude=-41.14093271,
        longitude=174.84296268,
        cadence_minutes=5,
    ),
    HilltopSeriesSpec(
        series_id="wainuiomata-leonard-wood-flow",
        site="Wainuiomata River at Leonard Wood Park",
        measurement="Flow",
        latitude=-41.28400515,
        longitude=174.94738309,
        cadence_minutes=5,
    ),
    HilltopSeriesSpec(
        series_id="wainuiomata-manuka-track-flow",
        site="Wainuiomata River at Manuka Track",
        measurement="Flow",
        latitude=-41.25677265,
        longitude=175.00892684,
        cadence_minutes=5,
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
        ("From", BASELINE_START),
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
    parser.add_argument(
        "--detector-output",
        type=Path,
        default=Path("site/public/cop/v4/april-storm-hydro-detector.json"),
    )
    parser.add_argument("--retrieved-at", required=True)
    args = parser.parse_args()

    normalized = []
    for spec in SERIES:
        with urlopen(hilltop_url(spec), timeout=60) as response:
            normalized.append(parse_hilltop_series(response.read(), spec))

    event_start = datetime.fromisoformat("2026-04-18T00:00:00+12:00")
    event_end = datetime.fromisoformat("2026-04-23T00:00:00+12:00")
    replay_end = datetime.fromisoformat("2026-04-22T23:59:59+12:00")
    retrieved_at = datetime.fromisoformat(args.retrieved_at)
    event_series = [slice_hilltop_series(item, event_start, event_end) for item in normalized]
    pack = build_hilltop_replay_pack(
        event_series,
        retrieved_at=retrieved_at,
    )
    detector_pack = build_hydro_detector_pack(
        normalized,
        training_cutoff=event_start,
        replay_end=replay_end,
        retrieved_at=retrieved_at,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.detector_output.parent.mkdir(parents=True, exist_ok=True)
    args.detector_output.write_text(
        json.dumps(detector_pack, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
