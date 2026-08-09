import json
from pathlib import Path
import subprocess
import sys


def test_cli_builds_v2_and_v3_ontology_artifacts_from_required_ticket_format(tmp_path):
    ticket_path = tmp_path / "tickets.json"
    ticket_path.write_text(
        json.dumps(
            [
                {
                    "TICKET_ID": "T-001",
                    "INCIDENT_ADDRESS": "10 Example Street",
                    "LOCATION": "Ngauranga",
                    "LONGITUDE": 174.81325,
                    "LATITUDE": -41.24720,
                    "CREATED_AT": "2026-08-06T11:46:00+12:00",
                    "TRIAGED_AT": "2026-08-06T11:51:00+12:00",
                    "DUE_BY_TIME": "2026-08-06T12:30:00+12:00",
                    "CURRENT_STATUS": "OPEN",
                    "CLOSED_AT": None,
                    "SERVICE_ITEM": "Slips",
                    "SERVICE_ITEM_L2": "A landslip in a park",
                    "TICKET_DESCRIPTION": "Jane Doe says rocks are near her home.",
                    "PRIORITY": 1,
                    "GROUP_NAME": "Roading",
                    "REQUESTER_NAME": "Jane Doe",
                    "SOURCE_DERIVED": "FIXiT",
                    "TICKET_TAGS": ["Slips", "Weather Event"],
                }
            ]
        ),
        encoding="utf-8",
    )
    movement_path = (
        Path(__file__).resolve().parents[1]
        / "site"
        / "public"
        / "cop"
        / "v1"
        / "movement-signals.geojson"
    )
    output_dir = tmp_path / "v2"
    script = Path(__file__).resolve().parents[1] / "scripts" / "build_ontology_demo.py"

    result = subprocess.run(
        [
            sys.executable,
            str(script),
            "--tickets",
            str(ticket_path),
            "--movement-signals",
            str(movement_path),
            "--output-dir",
            str(output_dir),
            "--corridor-countline-id",
            "48038",
        ],
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    observations = json.loads((output_dir / "observations.geojson").read_text())
    graph = json.loads((output_dir / "evidence-graph.json").read_text())
    registry = json.loads((output_dir / "source-registry.json").read_text())
    city = json.loads((tmp_path / "v3" / "city-ontology.json").read_text())

    assert observations["schema"] == "wellington-observations/v1"
    assert {feature["properties"]["source_id"] for feature in observations["features"]} == {
        "wcc-ticket-detail",
        "wcc-transport-sensors",
    }
    assert graph["entities"][0]["id"] == "corridor:centennial-highway"
    assert graph["hypotheses"][0]["epistemic_state"] == "inference"
    assert registry["schema"] == "wellington-source-registry/v1"
    assert city["schema"] == "wellington-city-ontology/v1"
    assert {node["type"] for node in city["nodes"]} >= {
        "Place",
        "InfrastructureAsset",
        "TimeWindow",
        "MovementState",
        "PotentialImpact",
        "AccessState",
    }
    assert all(edge["type"] in city["allowed_relation_types"] for edge in city["edges"])
    source_ids = {source["id"] for source in registry["sources"]}
    assert len(source_ids) == 24
    assert {
        "geonet-tilde-wlgt",
        "nema-cap-alerts",
        "wcc-road-closures",
        "wcc-event-calendar",
        "wellington-airport-flights",
        "centreport-cruise-schedule",
        "google-routes-api",
        "google-places-api",
    } <= source_ids
    restricted_nema = next(
        source for source in registry["sources"] if source["id"] == "nema-cap-alerts"
    )
    assert restricted_nema["connection_status"] == "restricted_not_ingested"
    assert "endpoint" not in restricted_nema

    public_payload = "\n".join(
        path.read_text(encoding="utf-8") for path in output_dir.iterdir()
    ) + (tmp_path / "v3" / "city-ontology.json").read_text(encoding="utf-8")
    assert "Jane Doe" not in public_payload
    assert "10 Example Street" not in public_payload
    assert "rocks are near her home" not in public_payload
