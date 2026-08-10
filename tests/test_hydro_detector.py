from datetime import datetime, timedelta

from movement_anomaly.hydro_detector import build_hydro_detector_pack


def _observation(observed_at, available_at, value):
    return {
        "observed_at": observed_at,
        "available_at": available_at,
        "available_at_quality": "derived_cadence_bound",
        "value": value,
    }


def test_hydro_detector_trains_only_on_records_available_before_the_event_cutoff():
    baseline_start = datetime.fromisoformat("2026-04-01T00:00:00+13:00")
    baseline = [
        _observation(
            (baseline_start + timedelta(hours=index)).isoformat(),
            (baseline_start + timedelta(hours=index + 1)).isoformat(),
            0.0 if index % 2 == 0 else 0.2,
        )
        for index in range(24)
    ]
    series = [{
        "series_id": "test-rain",
        "site": "Test gauge",
        "measurement": "Rainfall Running Hourly Totals",
        "unit": "mm",
        "cadence_minutes": 60,
        "geometry": {"type": "Point", "coordinates": [174.77, -41.29]},
        "observations": [
            *baseline,
            _observation("2026-04-17T23:30:00+12:00", "2026-04-18T00:30:00+12:00", 40.0),
            _observation("2026-04-20T04:00:00+12:00", "2026-04-20T05:00:00+12:00", 50.0),
        ],
    }]

    pack = build_hydro_detector_pack(
        series,
        training_cutoff=datetime.fromisoformat("2026-04-18T00:00:00+12:00"),
        replay_end=datetime.fromisoformat("2026-04-22T23:59:59+12:00"),
        retrieved_at=datetime.fromisoformat("2026-08-11T12:00:00+12:00"),
    )

    result = pack["series"][0]
    assert result["baseline"]["record_count"] == 24
    assert result["baseline"]["available_before"] == "2026-04-18T00:00:00+12:00"
    assert result["candidate_count"] == 1
    assert result["episode_count"] == 1
    assert result["episodes"][0]["peak_observed_at"] == "2026-04-20T04:00:00+12:00"


def test_hydro_detector_declares_prototype_and_governance_boundaries():
    series = [{
        "series_id": "test-flow",
        "site": "Test river",
        "measurement": "Flow",
        "unit": "m³/sec",
        "cadence_minutes": 5,
        "geometry": {"type": "Point", "coordinates": [174.98, -41.15]},
        "observations": [
            _observation("2026-04-01T00:00:00+13:00", "2026-04-01T00:05:00+13:00", 2.0),
            _observation("2026-04-02T00:00:00+13:00", "2026-04-02T00:05:00+13:00", 2.1),
            _observation("2026-04-20T20:00:00+12:00", "2026-04-20T20:05:00+12:00", 40.0),
        ],
    }]

    pack = build_hydro_detector_pack(
        series,
        training_cutoff=datetime.fromisoformat("2026-04-18T00:00:00+12:00"),
        replay_end=datetime.fromisoformat("2026-04-22T23:59:59+12:00"),
        retrieved_at=datetime.fromisoformat("2026-08-11T12:00:00+12:00"),
    )

    assert pack["schema"] == "wellington-hydro-anomaly-candidates/v1"
    assert pack["model"]["type"] == "robust_univariate_detector"
    assert pack["model"]["calibration_status"] == "uncalibrated_case_study"
    assert pack["model"]["input_domains"] == ["rainfall", "river_flow"]
    assert pack["training_policy"]["movement_model_reused"] is False
    assert pack["training_policy"]["mock_excluded"] is True
    assert pack["training_policy"]["post_event_ground_truth_excluded"] is True
    assert all(item["decision_role"] == "investigation_only" for item in pack["episodes"])
    assert all(item["incident_created"] is False for item in pack["episodes"])
