import json

from movement_anomaly import ontology
from movement_anomaly.ontology import (
    evaluate_corridor_hypotheses,
    movement_feature_to_observation,
    normalize_nzta_tms,
    normalize_ticket_detail,
    source_registry,
)


def ticket_row(**overrides):
    row = {
        "TICKET_ID": "T-001",
        "INCIDENT_ADDRESS": "10 Example Street",
        "LOCATION": "Ngauranga",
        "LONGITUDE": 174.81325,
        "LATITUDE": -41.24720,
        "CREATED_AT": "2026-08-06T11:46:00+12:00",
        "TRIAGED_AT": "2026-08-06T11:51:00+12:00",
        "DUE_BY_TIME": "2026-08-06T12:30:00+12:00",
        "CURRENT_STATUS": "open",
        "CLOSED_AT": None,
        "SERVICE_ITEM": "Slips",
        "SERVICE_ITEM_L2": "A landslip in a park",
        "TICKET_DESCRIPTION": "Caller Jane Doe reports rocks beside their house.",
        "PRIORITY": 1,
        "GROUP_NAME": "Roading",
        "REQUESTER_NAME": "Jane Doe",
        "SOURCE_DERIVED": "FIXiT",
        "TICKET_TAGS": ["Slips", "Weather Event"],
    }
    row.update(overrides)
    return row


def test_city_ontology_links_observation_place_time_state_and_potential_impact():
    feature = {
        "type": "Feature",
        "id": "movement:48038:Car:N:2026-08-06T12:00:00",
        "geometry": {
            "type": "LineString",
            "coordinates": [[174.813293, -41.247211], [174.813202, -41.247189]],
        },
        "properties": {
            "countline_id": "48038",
            "viewpoint_id": "7332",
            "name": "Centennial Hwy road Northbound",
            "transport_class": "Car",
            "direction": "N",
            "change_direction": "decrease",
            "observed_count": 502.0,
            "expected_count": 873.5,
            "robust_z": -5.331,
            "observed_at": "2026-08-06T12:00:00",
            "publisher_cadence": "at least monthly",
            "signal_confidence": {
                "level": "high",
                "history_samples": 12,
                "basis": "matched weekday and hour",
            },
        },
    }
    entity = {
        "id": "corridor:centennial-highway",
        "type": "TransportCorridor",
        "label": "Centennial Highway northern access",
        "impact_level": "critical",
        "geometry": feature["geometry"],
        "resolution": {
            "method": "explicit_demo_crosswalk",
            "source_ref": "wcc-countline:48038",
        },
    }
    observation = movement_feature_to_observation(feature, entity["id"])
    evidence_graph = evaluate_corridor_hypotheses(
        entity=entity,
        observations=[observation],
        expected_source_ids=["nzta-road-events"],
    )

    city = ontology.build_city_ontology(
        entity=entity,
        movement_feature=feature,
        movement_observation=observation,
        hypothesis=evidence_graph["hypotheses"][0],
    )

    assert city["schema"] == "wellington-city-ontology/v1"
    nodes = {node["id"]: node for node in city["nodes"]}
    assert {
        "Observation",
        "InfrastructureAsset",
        "Place",
        "TimeWindow",
        "MovementState",
        "PotentialImpact",
        "AccessState",
        "HypothesisAssessment",
    } <= {node["type"] for node in nodes.values()}
    assert nodes["asset:wcc-countline:48038"]["subtype"] == "TransportCountline"
    assert nodes["corridor:centennial-highway"]["resolution"]["method"] == "explicit_demo_crosswalk"

    access = next(node for node in nodes.values() if node["type"] == "AccessState")
    assert access["value"] == "unknown"
    assert access["epistemic_state"] == "inference"
    assert "Unknown is not open" in access["cannot_assert"]

    impact = next(node for node in nodes.values() if node["type"] == "PotentialImpact")
    assert impact["epistemic_state"] == "inference"
    assert impact["status"] == "candidate_for_investigation"
    assert impact["cannot_assert"] == [
        "A cause, closure, evacuation or loss of access is confirmed"
    ]

    node_ids = set(nodes)
    assert all(edge["from"] in node_ids and edge["to"] in node_ids for edge in city["edges"])
    relation_types = {edge["type"] for edge in city["edges"]}
    assert {"measured_by", "located_on", "observed_during", "classified_as", "supports", "may_indicate", "may_affect"} <= relation_types
    assert relation_types <= set(city["allowed_relation_types"])
    assert city["assertion_rules"]["movement_only"] == "investigate_only"
    assert city["assertion_rules"]["confirmation_requires"] == "authorised_human_review"


def test_ticket_detail_becomes_an_unverified_observation_without_personal_fields():
    observation = normalize_ticket_detail(ticket_row())

    assert observation["id"] == "obs:wcc-ticket:T-001"
    assert observation["type"] == "Observation"
    assert observation["epistemic_state"] == "observation"
    assert observation["phenomenon"] == "landslide_report"
    assert observation["source"] == {
        "id": "wcc-ticket-detail",
        "record_id": "T-001",
        "channel": "FIXiT",
        "authority": "community_report",
    }
    assert observation["workflow"]["status"] == "OPEN"
    assert observation["workflow"]["priority"] == 1
    assert observation["quality"]["verification_status"] == "unverified_report"
    assert observation["location"] == {
        "type": "Point",
        "coordinates": [174.81325, -41.2472],
        "label": "Ngauranga",
        "resolution": "source_coordinates",
    }

    serialized = json.dumps(observation)
    assert "Jane Doe" not in serialized
    assert "10 Example Street" not in serialized
    assert "rocks beside their house" not in serialized
    assert "REQUESTER_NAME" not in serialized


def test_unknown_ticket_enums_fail_closed_without_changing_the_source_row():
    source = ticket_row(
        CURRENT_STATUS="needs-review",
        SOURCE_DERIVED="Chat app",
        PRIORITY=9,
    )

    observation = normalize_ticket_detail(source)

    assert observation["workflow"] == {
        "status": "UNKNOWN",
        "priority": None,
        "triaged_at": "2026-08-06T11:51:00+12:00",
        "due_by": "2026-08-06T12:30:00+12:00",
        "closed_at": None,
    }
    assert observation["source"]["channel"] == "UNKNOWN"
    assert source["CURRENT_STATUS"] == "needs-review"


def test_missing_official_closure_is_not_contradicting_evidence():
    movement = {
        "id": "obs:movement:48038",
        "type": "Observation",
        "epistemic_state": "observation",
        "phenomenon": "movement_decrease",
        "source": {"id": "wcc-transport-sensors"},
        "entity_refs": ["corridor:centennial-highway"],
        "quality": {"verification_status": "measured"},
    }
    ticket = normalize_ticket_detail(ticket_row())
    ticket["entity_refs"] = ["corridor:centennial-highway"]

    graph = evaluate_corridor_hypotheses(
        entity={
            "id": "corridor:centennial-highway",
            "label": "Centennial Highway northern access",
            "impact_level": "critical",
        },
        observations=[movement, ticket],
        expected_source_ids=["nzta-road-events"],
    )

    access = next(
        item for item in graph["hypotheses"]
        if item["kind"] == "physical_access_disruption"
    )
    assert access["epistemic_state"] == "inference"
    assert access["evidence_strength"] == "moderate"
    assert access["review_priority"] == "high"
    assert [item["role"] for item in access["evidence"]] == [
        "supporting",
        "supporting",
        "missing",
    ]
    assert access["evidence"][-1]["source_id"] == "nzta-road-events"
    assert "probability" not in access
    assert graph["decision_state"] == {
        "epistemic_state": "decision",
        "status": "unreviewed",
        "authority": None,
    }


def test_source_registry_declares_role_access_and_temporal_limitations():
    registry = source_registry()
    sources = {source["id"]: source for source in registry["sources"]}

    assert registry["schema"] == "wellington-source-registry/v1"
    assert sources["wcc-ticket-detail"]["input_contract"] == "TICKET_DETAIL"
    assert sources["wcc-ticket-detail"]["privacy"] == {
        "requester_name": "drop_at_ingest",
        "incident_address": "withhold_from_public_output",
        "description": "withhold_from_public_output",
    }
    assert sources["nzta-tms"]["entity_resolution"] == "unresolved_without_crosswalk"
    assert sources["gwrc-hilltop"]["role"] == "hazard_observation"
    assert sources["wremo-hubs"]["role"] == "impact_context"
    assert sources["metlink-realtime"]["availability"] == "requires_key"
    assert len(sources) == 24
    assert {
        "geonet-tilde-wlgt",
        "geonet-shaking-layers",
        "nema-cap-alerts",
        "wcc-road-closures",
        "wellington-water-jobs",
        "nema-electricity-outages",
        "nema-cdem-boundaries",
        "metlink-static-gtfs",
        "wcc-emergency-water-tanks",
        "wcc-event-calendar",
        "wellington-airport-flights",
        "centreport-cruise-schedule",
        "google-routes-api",
        "google-places-api",
    } <= sources.keys()

    assert all(source["source_reality"] == "official_source" for source in sources.values())
    assert {source["demo_data_status"] for source in sources.values()} <= {
        "real_replay",
        "mock_preview",
        "registered_only",
    }

    assert sources["geonet-tilde-wlgt"]["connection_status"] == "ready_for_adapter"
    assert sources["geonet-tilde-wlgt"]["licence"] == "CC BY 3.0 NZ"
    assert sources["geonet-shaking-layers"]["entity_resolution"] == "exact_geonet_public_id"
    assert sources["nema-cap-alerts"]["connection_status"] == "restricted_not_ingested"
    assert sources["nema-cap-alerts"]["public_release"] == "prohibited_without_nema_permission"
    assert "endpoint" not in sources["nema-cap-alerts"]
    assert sources["nema-cap-alerts"]["demo_data_status"] == "mock_preview"
    assert sources["nema-cap-alerts"]["access_status"] == "permission_required"
    assert sources["nema-cap-alerts"]["capability_preview"]["evidence_weight"] == 0
    assert sources["wcc-road-closures"]["evidence_policy"] == "approved_and_time_overlapping_only"
    assert sources["wellington-water-jobs"]["privacy"] == {
        "address": "generalise_or_drop_from_public_output",
        "description": "drop_from_public_output",
    }
    assert sources["nema-electricity-outages"]["connection_status"] == "registry_only_pending_licence"
    assert sources["nema-electricity-outages"]["deduplication_key"] == "distributor+distributoroutageid"
    assert sources["nema-cdem-boundaries"]["evidence_policy"] == "context_only"
    assert sources["metlink-static-gtfs"]["evidence_policy"] == "schedule_and_entity_context_only"
    assert sources["wcc-emergency-water-tanks"]["evidence_policy"] == "context_only"
    assert sources["wcc-event-calendar"]["role"] == "planned_demand_context"
    assert sources["wellington-airport-flights"]["role"] == "transport_status_observation"
    assert sources["centreport-cruise-schedule"]["role"] == "planned_demand_context"
    assert sources["google-routes-api"]["demo_data_status"] == "mock_preview"
    assert sources["google-routes-api"]["access_status"] == "paid_key_required"
    assert sources["google-routes-api"]["capability_preview"]["evidence_weight"] == 0
    assert sources["google-places-api"]["role"] == "place_accessibility_context"
    assert sources["google-places-api"]["access_status"] == "paid_key_required"
    assert sources["google-places-api"]["capability_preview"]["evidence_weight"] == 0

    assert "wellington-electricity-outages" not in sources


def test_nzta_tms_remains_non_spatial_and_time_insufficient_without_crosswalk():
    observation = normalize_nzta_tms(
        {
            "OBJECTID": 91,
            "startDate": 1785974400000,
            "siteID": "48038",
            "regionName": "09 - Wellington",
            "SiteRef": "00900123",
            "classWeight": "Light",
            "siteDescription": "Centennial Highway",
            "laneNumber": 1,
            "flowDirection": "N",
            "trafficCount": 502,
        }
    )

    assert observation["id"] == "obs:nzta-tms:91"
    assert observation["phenomenon"] == "reported_traffic_count"
    assert observation["geometry"] is None
    assert observation["entity_refs"] == []
    assert observation["entity_resolution"] == {
        "status": "unresolved_without_crosswalk",
        "site_description": "Centennial Highway",
    }
    assert observation["temporal_alignment"] == {
        "status": "insufficient",
        "provider_start_date": 1785974400000,
        "reason": "source does not declare the traffic-count interval",
    }
    assert "countline_id" not in json.dumps(observation).lower()


def test_synthetic_ticket_fixture_is_visible_but_cannot_add_evidence_weight():
    movement = {
        "id": "obs:movement:48038",
        "type": "Observation",
        "epistemic_state": "observation",
        "phenomenon": "movement_decrease",
        "source": {"id": "wcc-transport-sensors"},
        "entity_refs": ["corridor:centennial-highway"],
        "quality": {"verification_status": "measured"},
    }
    ticket = normalize_ticket_detail(ticket_row(TICKET_ID="SYNTHETIC-ONTOLOGY-001"))
    ticket["entity_refs"] = ["corridor:centennial-highway"]

    graph = evaluate_corridor_hypotheses(
        entity={
            "id": "corridor:centennial-highway",
            "label": "Centennial Highway northern access",
            "impact_level": "critical",
        },
        observations=[movement, ticket],
        expected_source_ids=[],
    )

    assert ticket["quality"]["fixture_mode"] == "synthetic"
    ticket_evidence = graph["hypotheses"][0]["evidence"][1]
    assert ticket_evidence["role"] == "supporting"
    assert ticket_evidence["units"] == 0
    assert graph["hypotheses"][0]["support_units"] == 2
    assert graph["hypotheses"][0]["evidence_state"] == "single_source_signal"
