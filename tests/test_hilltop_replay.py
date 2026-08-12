from datetime import datetime

from movement_anomaly.hilltop_replay import (
    HilltopSeriesSpec,
    build_hilltop_replay_pack,
    parse_hilltop_series,
)

SAMPLE_XML = """<?xml version="1.0"?>
<Hilltop>
  <MeasurementData>
    <ItemInfo ItemNumber="1"><ItemName>Flow</ItemName><Units>m³/sec</Units></ItemInfo>
    <Data>
      <E><T>2026-04-20T22:25:00</T><I1>470.5</I1></E>
      <E><T>2026-04-20T22:30:00</T><I1>474.664</I1></E>
    </Data>
  </MeasurementData>
</Hilltop>"""


def test_parses_hilltop_rows_with_units_geometry_and_conservative_availability():
    spec = HilltopSeriesSpec(
        series_id="hutt-flow",
        site="Hutt River at Taita Gorge",
        measurement="Flow",
        latitude=-41.15660826,
        longitude=174.984782,
        cadence_minutes=5,
    )

    series = parse_hilltop_series(SAMPLE_XML.encode(), spec)

    assert series["record_count"] == 2
    assert series["unit"] == "m³/sec"
    assert series["geometry"] == {"type": "Point", "coordinates": [174.984782, -41.15660826]}
    assert series["peak"] == {"observed_at": "2026-04-20T22:30:00+12:00", "value": 474.664}
    assert series["observations"][0]["available_at"] == "2026-04-20T22:30:00+12:00"
    assert series["observations"][0]["available_at_quality"] == "derived_cadence_bound"


def test_builds_a_real_replay_pack_without_claiming_provider_publication_times():
    spec = HilltopSeriesSpec(
        series_id="hutt-flow",
        site="Hutt River at Taita Gorge",
        measurement="Flow",
        latitude=-41.15660826,
        longitude=174.984782,
        cadence_minutes=5,
    )
    series = parse_hilltop_series(SAMPLE_XML, spec)

    pack = build_hilltop_replay_pack(
        [series],
        retrieved_at=datetime.fromisoformat("2026-08-10T22:45:00+12:00"),
    )

    assert pack["schema"] == "wellington-hilltop-replay-observations/v1"
    assert pack["source_id"] == "gwrc-hilltop"
    assert pack["record_count"] == 2
    assert pack["truth"] == "official_historical_observations"
    assert pack["availability_policy"]["provider_publication_time_observed"] is False
    assert pack["training_policy"]["mock_excluded"] is True
