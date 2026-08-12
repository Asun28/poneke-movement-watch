from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from movement_anomaly.ontology import (
    build_city_ontology,
    evaluate_corridor_hypotheses,
    movement_feature_to_observation,
    normalize_nzta_tms,
    normalize_ticket_detail,
    source_registry,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the ontology replay artifacts.")
    parser.add_argument("--tickets", type=Path, required=True)
    parser.add_argument("--movement-signals", type=Path, required=True)
    parser.add_argument("--nzta-tms", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--corridor-countline-id", required=True)
    return parser.parse_args()


def _load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _as_geojson(observations: list[dict]) -> dict:
    features = []
    for observation in observations:
        location = observation.get("location")
        geometry = observation.get("geometry")
        if geometry is None and location is not None:
            geometry = {
                "type": location["type"],
                "coordinates": location["coordinates"],
            }
        properties = {
            key: value
            for key, value in observation.items()
            if key not in {"geometry", "location"}
        }
        properties["source_id"] = observation["source"]["id"]
        if location is not None:
            properties["location_label"] = location["label"]
            properties["location_resolution"] = location["resolution"]
        features.append(
            {
                "type": "Feature",
                "id": observation["id"],
                "geometry": geometry,
                "properties": properties,
            }
        )
    return {
        "type": "FeatureCollection",
        "schema": "wellington-observations/v1",
        "features": features,
    }


def main() -> None:
    args = parse_args()
    movement = _load_json(args.movement_signals)
    selected = next(
        feature
        for feature in movement["features"]
        if str(feature["properties"].get("countline_id"))
        == str(args.corridor_countline_id)
    )
    entity = {
        "id": "corridor:centennial-highway",
        "type": "TransportCorridor",
        "label": "Centennial Highway northern access",
        "impact_level": "critical",
        "geometry": selected["geometry"],
        "resolution": {
            "method": "explicit_demo_crosswalk",
            "source_ref": f"wcc-countline:{args.corridor_countline_id}",
        },
    }
    observations = [movement_feature_to_observation(selected, entity["id"])]
    movement_observation = observations[0]

    for record in _load_json(args.tickets):
        observation = normalize_ticket_detail(record)
        observation["entity_refs"] = [entity["id"]]
        observations.append(observation)

    if args.nzta_tms:
        observations.extend(normalize_nzta_tms(record) for record in _load_json(args.nzta_tms))

    graph = evaluate_corridor_hypotheses(
        entity=entity,
        observations=observations,
        expected_source_ids=["nzta-road-events", "gwrc-hilltop", "metservice-cap"],
    )
    graph["mode"] = "ontology_replay"
    graph["truth_boundary"] = {
        "observation": "source fact or report",
        "inference": "review-ranked hypothesis",
        "decision": "authorised human action only",
        "confirmed_fact": "none recorded in this replay",
    }
    city_ontology = build_city_ontology(
        entity=entity,
        movement_feature=selected,
        movement_observation=movement_observation,
        hypothesis=graph["hypotheses"][0],
    )

    args.output_dir.mkdir(parents=True, exist_ok=True)
    payloads = {
        "observations.geojson": _as_geojson(observations),
        "evidence-graph.json": graph,
        "source-registry.json": source_registry(),
    }
    for name, payload in payloads.items():
        (args.output_dir / name).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    city_output_dir = args.output_dir.parent / "v3"
    city_output_dir.mkdir(parents=True, exist_ok=True)
    (city_output_dir / "city-ontology.json").write_text(
        json.dumps(city_ontology, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "mode": "ontology_replay",
                "observations": len(observations),
                "hypotheses": len(graph["hypotheses"]),
                "city_ontology_nodes": len(city_ontology["nodes"]),
                "output_dir": str(args.output_dir),
            }
        )
    )


if __name__ == "__main__":
    main()
