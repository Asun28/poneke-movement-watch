from __future__ import annotations

from collections.abc import Mapping, Sequence
from copy import deepcopy
from datetime import datetime, timedelta
import re


TICKET_STATUSES = {
    "CLOSED",
    "OPEN",
    "PENDING",
    "ENHANCEMENT",
    "ACTIVE",
    "UNKNOWN",
}
TICKET_CHANNELS = {"Phone", "FIXiT", "Website", "Email"}
TICKET_PRIORITIES = {1, 2, 3, 4}


def _clean_text(value) -> str:
    return "" if value is None else str(value).strip()


def _canonical_status(value) -> str:
    candidate = _clean_text(value).upper()
    return candidate if candidate in TICKET_STATUSES else "UNKNOWN"


def _canonical_channel(value) -> str:
    candidate = _clean_text(value)
    return candidate if candidate in TICKET_CHANNELS else "UNKNOWN"


def _canonical_priority(value):
    try:
        candidate = int(value)
    except (TypeError, ValueError):
        return None
    return candidate if candidate in TICKET_PRIORITIES else None


def _ticket_tags(value) -> list[str]:
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes)):
        return [_clean_text(item) for item in value if _clean_text(item)]
    if isinstance(value, str):
        return [item.strip() for item in re.split(r"[,|;]", value) if item.strip()]
    return []


def _ticket_phenomenon(record: Mapping) -> tuple[str, list[str]]:
    fields = {
        "SERVICE_ITEM": _clean_text(record.get("SERVICE_ITEM")),
        "SERVICE_ITEM_L2": _clean_text(record.get("SERVICE_ITEM_L2")),
    }
    tags = _ticket_tags(record.get("TICKET_TAGS"))
    values = [*fields.values(), *tags]
    lowered = " | ".join(values).lower()

    rules = [
        ("landslide_report", ("slip", "landslip", "rockfall")),
        (
            "flooding_or_drainage_report",
            ("flood", "stormwater", "rainwater", "drain", "sump", "sewer"),
        ),
        (
            "access_obstruction_report",
            ("road condition", "footpath obstruction", "detour", "road crew", "bridge"),
        ),
        ("tree_hazard_report", ("fallen or dangerous tree", "unstable tree")),
        (
            "traffic_control_fault_report",
            ("traffic light outage", "street light out", "traffic signal"),
        ),
    ]
    for phenomenon, needles in rules:
        if any(needle in lowered for needle in needles):
            basis = [
                f"{field}:{value}"
                for field, value in fields.items()
                if value and any(needle in value.lower() for needle in needles)
            ]
            basis.extend(
                f"TICKET_TAGS:{tag}"
                for tag in tags
                if any(needle in tag.lower() for needle in needles)
            )
            return phenomenon, basis
    return "other_or_unclassified_report", []


def _valid_wgs84(longitude, latitude):
    try:
        longitude = float(longitude)
        latitude = float(latitude)
    except (TypeError, ValueError):
        return None
    if not (-180 <= longitude <= 180 and -90 <= latitude <= 90):
        return None
    return longitude, latitude


def normalize_ticket_detail(record: Mapping) -> dict:
    source = deepcopy(dict(record))
    ticket_id = _clean_text(source.get("TICKET_ID")) or "unknown"
    fixture_mode = "synthetic" if ticket_id.upper().startswith("SYNTHETIC-") else None
    status = _canonical_status(source.get("CURRENT_STATUS"))
    channel = _canonical_channel(source.get("SOURCE_DERIVED"))
    priority = _canonical_priority(source.get("PRIORITY"))
    phenomenon, classification_basis = _ticket_phenomenon(source)
    tags = _ticket_tags(source.get("TICKET_TAGS"))
    coordinate = _valid_wgs84(source.get("LONGITUDE"), source.get("LATITUDE"))

    validation_issues = []
    if status == "UNKNOWN" and _clean_text(source.get("CURRENT_STATUS")).upper() != "UNKNOWN":
        validation_issues.append("unknown_status")
    if channel == "UNKNOWN":
        validation_issues.append("unknown_source_channel")
    if priority is None:
        validation_issues.append("invalid_priority")
    if coordinate is None:
        validation_issues.append("invalid_coordinates")

    location = None
    if coordinate is not None:
        location = {
            "type": "Point",
            "coordinates": [coordinate[0], coordinate[1]],
            "label": _clean_text(source.get("LOCATION")) or "Location withheld",
            "resolution": "source_coordinates",
        }

    return {
        "id": f"obs:wcc-ticket:{ticket_id}",
        "type": "Observation",
        "epistemic_state": "observation",
        "phenomenon": phenomenon,
        "classification": {
            "method": "taxonomy_exact/v1",
            "basis": classification_basis,
        },
        "source": {
            "id": "wcc-ticket-detail",
            "record_id": ticket_id,
            "channel": channel,
            "authority": "community_report",
        },
        "reported_at": source.get("CREATED_AT"),
        "source_updated_at": source.get("TRIAGED_AT"),
        "location": location,
        "entity_refs": [],
        "taxonomy": {
            "service_item": _clean_text(source.get("SERVICE_ITEM")),
            "service_item_l2": _clean_text(source.get("SERVICE_ITEM_L2")),
            "tags": tags,
        },
        "workflow": {
            "status": status,
            "priority": priority,
            "triaged_at": source.get("TRIAGED_AT"),
            "due_by": source.get("DUE_BY_TIME"),
            "closed_at": source.get("CLOSED_AT"),
        },
        "quality": {
            "verification_status": "unverified_report",
            "fixture_mode": fixture_mode,
            "temporal_precision": "report_arrival_time",
            "validation_issues": validation_issues,
            "withheld_fields": [
                "personal_identity",
                "street_address",
                "free_text",
                "internal_assignment",
            ],
        },
    }


def normalize_nzta_tms(record: Mapping) -> dict:
    source = deepcopy(dict(record))
    object_id = _clean_text(source.get("OBJECTID")) or "unknown"
    provider_start = source.get("startDate")
    return {
        "id": f"obs:nzta-tms:{object_id}",
        "type": "Observation",
        "epistemic_state": "observation",
        "phenomenon": "reported_traffic_count",
        "source": {
            "id": "nzta-tms",
            "record_id": object_id,
            "site_id": _clean_text(source.get("siteID")),
            "site_ref": _clean_text(source.get("SiteRef")),
            "region": _clean_text(source.get("regionName")),
        },
        "value": {
            "traffic_count": source.get("trafficCount"),
            "class_weight": source.get("classWeight"),
            "lane_number": source.get("laneNumber"),
            "flow_direction": source.get("flowDirection"),
        },
        "geometry": None,
        "entity_refs": [],
        "entity_resolution": {
            "status": "unresolved_without_crosswalk",
            "site_description": _clean_text(source.get("siteDescription")),
        },
        "temporal_alignment": {
            "status": "insufficient",
            "provider_start_date": provider_start,
            "reason": "source does not declare the traffic-count interval",
        },
        "quality": {
            "verification_status": "provider_record",
            "eligible_for_hourly_corroboration": False,
        },
    }


def movement_feature_to_observation(feature: Mapping, entity_id: str) -> dict:
    properties = feature["properties"]
    observed_at = properties.get("observed_at")
    if observed_at and "+" not in observed_at and not observed_at.endswith("Z"):
        observed_at = f"{observed_at}+12:00"
    return {
        "id": f"obs:{feature['id']}",
        "type": "Observation",
        "epistemic_state": "observation",
        "phenomenon": f"movement_{properties.get('change_direction', 'change')}",
        "source": {
            "id": "wcc-transport-sensors",
            "record_id": feature["id"],
            "authority": "direct_measurement",
        },
        "observed_at": observed_at,
        "geometry": deepcopy(feature.get("geometry")),
        "entity_refs": [entity_id],
        "measurement": {
            "transport_class": properties.get("transport_class"),
            "direction": properties.get("direction"),
            "observed_count": properties.get("observed_count"),
            "expected_count": properties.get("expected_count"),
            "robust_z": properties.get("robust_z"),
        },
        "quality": {
            "verification_status": "measured",
            "baseline_strength": properties.get("signal_confidence"),
            "publisher_cadence": properties.get("publisher_cadence"),
        },
    }


def _evidence_units(observation: Mapping) -> int:
    if observation.get("quality", {}).get("fixture_mode") == "synthetic":
        return 0
    verification = observation.get("quality", {}).get("verification_status")
    if verification in {"official_assertion", "official_counter_assertion"}:
        return 3
    if verification == "measured":
        return 2
    if verification == "unverified_report":
        return 1
    return 0


def _access_role(observation: Mapping) -> str:
    phenomenon = observation.get("phenomenon")
    if phenomenon in {
        "movement_decrease",
        "landslide_report",
        "flooding_or_drainage_report",
        "access_obstruction_report",
        "official_road_closed",
    }:
        return "supporting"
    if phenomenon in {"official_road_open", "sensor_fault"}:
        return "contradicting"
    return "neutral"


def evaluate_corridor_hypotheses(*, entity, observations, expected_source_ids):
    entity_id = entity["id"]
    aligned = [
        observation for observation in observations
        if entity_id in observation.get("entity_refs", [])
    ]
    evidence = []
    present_source_ids = set()
    support_units = 0
    contradiction_units = 0
    supporting_families = set()

    for observation in aligned:
        source_id = observation.get("source", {}).get("id", "unknown")
        present_source_ids.add(source_id)
        role = _access_role(observation)
        units = _evidence_units(observation) if role in {"supporting", "contradicting"} else 0
        evidence.append(
            {
                "observation_id": observation["id"],
                "source_id": source_id,
                "role": role,
                "units": units,
                "basis": observation.get("phenomenon"),
            }
        )
        if role == "supporting":
            support_units += units
            supporting_families.add(source_id)
        elif role == "contradicting":
            contradiction_units += units

    for source_id in expected_source_ids:
        if source_id not in present_source_ids:
            evidence.append(
                {
                    "observation_id": None,
                    "source_id": source_id,
                    "role": "missing",
                    "units": 0,
                    "basis": "no time-aligned observation received",
                }
            )

    if contradiction_units:
        evidence_state = "mixed_evidence"
    elif support_units >= 3 and len(supporting_families) >= 2:
        evidence_state = "corroborated_investigate"
    elif support_units:
        evidence_state = "single_source_signal"
    else:
        evidence_state = "insufficient_evidence"

    if support_units >= 5:
        strength = "strong"
    elif support_units >= 2:
        strength = "moderate"
    else:
        strength = "weak"
    review_priority = (
        "high"
        if entity.get("impact_level") == "critical" and strength in {"moderate", "strong"}
        else "medium" if support_units else "low"
    )

    suffix = entity_id.split(":", 1)[-1]
    access = {
        "id": f"hyp:physical-access-disruption:{suffix}",
        "type": "HypothesisAssessment",
        "epistemic_state": "inference",
        "kind": "physical_access_disruption",
        "entity_id": entity_id,
        "evidence": evidence,
        "support_units": support_units,
        "contradiction_units": contradiction_units,
        "evidence_strength": strength,
        "evidence_state": evidence_state,
        "review_priority": review_priority,
        "limitations": [
            "Evidence units are a transparent review rank, not calibrated likelihood.",
            "Missing expected evidence is uncertainty, not counter-evidence.",
        ],
    }
    return {
        "schema": "wellington-evidence-graph/v1",
        "entities": [deepcopy(entity)],
        "observation_refs": [observation["id"] for observation in aligned],
        "hypotheses": [access],
        "decision_state": {
            "epistemic_state": "decision",
            "status": "unreviewed",
            "authority": None,
        },
        "confirmed_facts": [],
    }


CITY_RELATION_TYPES = (
    "measured_by",
    "located_on",
    "observed_during",
    "classified_as",
    "supports",
    "may_indicate",
    "may_affect",
    "applies_to",
    "concerns",
    "sourced_from",
    "describes",
)


DATA_2026_BY_SOURCE = {
    "wcc-transport-sensors": ("real_records", True, "real_august_2026_replay"),
    "wcc-ticket-detail": ("input_required", False, "no_council_extract_supplied"),
    "nzta-tms": ("available_context", True, "wellington_rows_through_2026_08_05_non_spatial"),
    "gwrc-hilltop": ("available_not_ingested", True, "live_series_contract_verified"),
    "nzta-road-events": ("available_not_ingested", True, "current_feed_not_bound_to_replay"),
    "metservice-cap": ("available_not_ingested", True, "cap_feed_contract_verified"),
    "geonet-quakes": ("available_not_ingested", True, "current_event_feed_contract_verified"),
    "wremo-hubs": ("static_context", True, "126_hubs_static_context"),
    "wcc-emergency-routes": ("static_context", True, "post_event_reopening_plan"),
    "metlink-realtime": ("credentials_required", False, "not_fetched_without_key"),
    "geonet-tilde-wlgt": ("available_not_ingested", True, "live_15_second_series_contract_verified"),
    "geonet-shaking-layers": ("available_not_ingested", True, "event_version_feed_contract_verified"),
    "nema-cap-alerts": ("restricted_not_ingested", False, "restricted_polygon_feed_not_fetched"),
    "wcc-road-closures": ("available_not_ingested", True, "2026_records_available_not_bound_to_replay"),
    "wellington-water-jobs": ("terms_review", False, "public_jobs_not_republished"),
    "nema-electricity-outages": ("terms_review", False, "public_feed_not_republished"),
    "nema-cdem-boundaries": ("static_context", True, "authority_boundaries_context"),
    "metlink-static-gtfs": ("available_context", True, "2026_schedule_and_network_context"),
    "wcc-emergency-water-tanks": ("static_context", True, "45_tanks_static_context"),
    "wcc-event-calendar": ("terms_review", False, "eventfinda_backed_html_not_republished"),
    "wellington-airport-flights": ("terms_review", False, "flight_board_not_republished"),
    "centreport-cruise-schedule": ("terms_review", False, "2026_27_schedule_not_republished"),
    "google-routes-api": ("paid_mock_only", False, "no_credentials_or_google_response"),
    "google-places-api": ("paid_mock_only", False, "no_credentials_or_google_response"),
    "eventfinda-events": ("credentials_required", False, "not_fetched_without_application_key"),
    "wcc-planned-works": ("available_context", True, "510_planned_records"),
    "wcc-emergency-assistance-centres": ("empty_activation", True, "zero_current_records"),
    "gwrc-incident-areas": ("stale_excluded", False, "one_2019_record_rejected_by_freshness_gate"),
    "nzta-traffic-cameras": ("available_context", True, "319_national_26_region_at_verification"),
    "nema-public-ema-cap": ("available_not_ingested", True, "public_cap_message_feed_available"),
    "gwrc-parks-notices": ("available_context", True, "official_notice_api_available"),
    "fenz-incident-reports": ("available_context", True, "official_seven_day_reports_incomplete"),
    "kiwirail-wellington-works": ("planned_context", True, "significant_works_only"),
}


def _source_data_2026(source_id: str) -> dict:
    try:
        status, active, record_state = DATA_2026_BY_SOURCE[source_id]
    except KeyError as exc:
        raise ValueError(f"source registry entry lacks a 2026 data contract: {source_id}") from exc
    return {
        "status": status,
        "active": active,
        "record_state": record_state,
        "verified_at": "2026-08-10",
    }


def build_city_ontology(*, entity, movement_feature, movement_observation, hypothesis):
    properties = movement_feature["properties"]
    countline_id = _clean_text(properties.get("countline_id"))
    if not countline_id:
        raise ValueError("movement feature requires countline_id")

    observed_at = _clean_text(movement_observation.get("observed_at"))
    try:
        window_start = datetime.fromisoformat(observed_at)
    except ValueError as exc:
        raise ValueError("movement observation requires ISO-8601 observed_at") from exc
    window_end = window_start + timedelta(hours=1)

    observation_id = movement_observation["id"]
    asset_id = f"asset:wcc-countline:{countline_id}"
    place_id = entity["id"]
    time_id = f"time-window:{observed_at}"
    state_id = f"movement-state:{observation_id.removeprefix('obs:')}"
    entity_suffix = place_id.split(":", 1)[-1]
    impact_id = f"impact:potential-access-change:{entity_suffix}"
    access_id = f"access-state:{entity_suffix}:{observed_at}"
    hypothesis_id = hypothesis["id"]

    direction = _clean_text(properties.get("change_direction")) or "change"
    transport_class = _clean_text(properties.get("transport_class")) or "Movement"
    nodes = [
        {
            "id": observation_id,
            "type": "Observation",
            "label": f"{transport_class} movement {direction}",
            "epistemic_state": "observation",
            "source": deepcopy(movement_observation.get("source")),
            "measurement": deepcopy(movement_observation.get("measurement")),
            "provenance": {
                "observed_at": observed_at,
                "publisher_cadence": movement_observation.get("quality", {}).get(
                    "publisher_cadence"
                ),
            },
            "can_support": ["A movement change occurred at this sensor and hour"],
            "cannot_assert": ["Why movement changed"],
        },
        {
            "id": asset_id,
            "type": "InfrastructureAsset",
            "subtype": "TransportCountline",
            "label": _clean_text(properties.get("name")) or f"WCC countline {countline_id}",
            "identifiers": {
                "countline_id": countline_id,
                "viewpoint_id": _clean_text(properties.get("viewpoint_id")),
            },
            "geometry": deepcopy(movement_feature.get("geometry")),
            "can_support": ["Where this fixed count was measured"],
            "cannot_assert": ["All movement on the corridor"],
        },
        {
            "id": place_id,
            "type": "Place",
            "subtype": entity.get("type", "TransportCorridor"),
            "label": entity.get("label"),
            "impact_level": entity.get("impact_level"),
            "geometry": deepcopy(entity.get("geometry")),
            "resolution": deepcopy(entity.get("resolution")),
            "can_support": ["The maintained place link for this demo case"],
            "cannot_assert": ["Nearby unnamed assets are the same entity"],
        },
        {
            "id": time_id,
            "type": "TimeWindow",
            "label": "Selected hourly replay window",
            "start": window_start.isoformat(),
            "end_exclusive": window_end.isoformat(),
            "timezone": "Pacific/Auckland",
            "can_support": ["Which records may be compared for temporal alignment"],
            "cannot_assert": ["A record outside this window corroborates the case"],
        },
        {
            "id": state_id,
            "type": "MovementState",
            "label": f"Measured {direction}",
            "value": direction,
            "epistemic_state": "observation",
            "transport_class": transport_class,
            "direction": _clean_text(properties.get("direction")),
            "can_support": ["The detector classified an unusual movement direction"],
            "cannot_assert": ["Unsafe conditions or evacuation caused the change"],
        },
        {
            "id": impact_id,
            "type": "PotentialImpact",
            "label": "Potential access change",
            "status": "candidate_for_investigation",
            "epistemic_state": "inference",
            "can_support": ["An operator should investigate possible access effects"],
            "cannot_assert": [
                "A cause, closure, evacuation or loss of access is confirmed"
            ],
        },
        {
            "id": access_id,
            "type": "AccessState",
            "label": "Corridor access is unknown",
            "value": "unknown",
            "epistemic_state": "inference",
            "evidence_requirement": "time-aligned authoritative access observation",
            "can_support": ["The current evidence does not establish access status"],
            "cannot_assert": ["Unknown is not open"],
        },
        {
            "id": hypothesis_id,
            "type": "HypothesisAssessment",
            "label": "Physical access disruption",
            "epistemic_state": "inference",
            "review_priority": hypothesis.get("review_priority"),
            "evidence_state": hypothesis.get("evidence_state"),
            "can_support": ["A transparent investigation rank"],
            "cannot_assert": ["A calibrated probability or confirmed incident"],
        },
    ]

    domain_id = "domain:wellington-movement-and-access"
    nodes.append(
        {
            "id": domain_id,
            "type": "OntologyDomain",
            "label": "Wellington movement and access",
            "can_support": ["Which source layers may describe movement, access or context"],
            "cannot_assert": ["That an available layer contains incident evidence"],
        }
    )
    registry_sources = source_registry()["sources"]
    for source in registry_sources:
        preview = source.get("capability_preview", {})
        evidence_weight = (
            preview.get("evidence_weight", 0)
            if source["id"] == "wcc-transport-sensors"
            else 0
        )
        nodes.append(
            {
                "id": f"data-layer:{source['id']}",
                "type": "DataLayer",
                "label": source["name"],
                "source_id": source["id"],
                "ontology_role": source["role"],
                "source_reality": source["source_reality"],
                "demo_data_status": source["demo_data_status"],
                "access_status": source["access_status"],
                "data_2026": deepcopy(source["data_2026"]),
                "evidence_weight": evidence_weight,
                "can_support": ["The declared source role and 2026 availability state"],
                "cannot_assert": [
                    "An incident, cause or access state without a time-aligned resolved record"
                ],
            }
        )

    edge_specs = [
        (observation_id, "measured_by", asset_id),
        (asset_id, "located_on", place_id),
        (observation_id, "observed_during", time_id),
        (observation_id, "classified_as", state_id),
        (observation_id, "supports", hypothesis_id),
        (state_id, "may_indicate", impact_id),
        (impact_id, "may_affect", place_id),
        (access_id, "applies_to", place_id),
        (hypothesis_id, "concerns", impact_id),
        (observation_id, "sourced_from", "data-layer:wcc-transport-sensors"),
    ]
    edge_specs.extend(
        (f"data-layer:{source['id']}", "describes", domain_id)
        for source in registry_sources
    )
    edges = [
        {
            "id": f"edge:{index}:{relation}",
            "type": relation,
            "from": source,
            "to": target,
        }
        for index, (source, relation, target) in enumerate(edge_specs, start=1)
    ]

    return {
        "schema": "wellington-city-ontology/v1",
        "mode": "ontology_replay",
        "title": "Wellington City Ontology — movement and access review",
        "nodes": nodes,
        "edges": edges,
        "allowed_relation_types": list(CITY_RELATION_TYPES),
        "assertion_rules": {
            "movement_only": "investigate_only",
            "unknown_access": "must_not_be_rendered_as_open",
            "potential_impact": "inference_only",
            "confirmation_requires": "authorised_human_review",
            "data_layer_availability": "zero_evidence_until_record_is_time_aligned_and_resolved",
            "credentials_required": "publish_contract_not_records",
        },
        "data_layer_summary": {
            "total": len(registry_sources),
            "active_2026": sum(source["data_2026"]["active"] for source in registry_sources),
            "real_record_layers": sum(
                source["data_2026"]["status"] == "real_records"
                for source in registry_sources
            ),
            "zero_weight_layers": len(registry_sources) - 1,
        },
        "confirmed_facts": [],
    }


def source_registry():
    def source(
        *,
        demo_data_status,
        access_status,
        source_reality="official_source",
        **fields,
    ):
        return {
            **fields,
            "source_reality": source_reality,
            "demo_data_status": demo_data_status,
            "access_status": access_status,
        }

    def mock_preview(label, summary):
        return {
            "label": label,
            "summary": summary,
            "is_synthetic": True,
            "evidence_weight": 0,
        }

    registry = {
        "schema": "wellington-source-registry/v1",
        "verified_at": "2026-08-10",
        "demo_status_legend": {
            "real_replay": "Official source records used in this replay",
            "mock_preview": "Synthetic capability preview with zero evidence weight",
            "registered_only": "Official source registered; no records used in this replay",
        },
        "data_2026_status_legend": {
            "real_records": "Permitted 2026 source records are present in this replay",
            "available_not_ingested": "A 2026 feed exists but no record is bound to this replay",
            "available_context": "A 2026 layer is available for schedule, network or visual context",
            "planned_context": "A 2026 planned activity may explain expected demand",
            "static_context": "The layer supports entity or exposure context only",
            "empty_activation": "The official activation feed is connected and currently empty",
            "credentials_required": "The official contract exists but this app has no key",
            "input_required": "A council-provided input is required",
            "terms_review": "Automated redistribution is not cleared",
            "restricted_not_ingested": "Authorised access is required and no records are fetched",
            "paid_mock_only": "No paid provider response is used",
            "stale_excluded": "The available record is pre-2026 and fails freshness",
        },
        "sources": [
            source(
                id="wcc-transport-sensors",
                name="WCC Transport Sensors",
                role="movement_observation",
                availability="batch_replay",
                demo_data_status="real_replay",
                access_status="public_free",
                temporal_alignment="hourly source; publisher refresh at least monthly",
                capability_preview={
                    "label": "Measured movement change",
                    "summary": "502 cars measured against an 873.5 matched baseline.",
                    "is_synthetic": False,
                    "evidence_weight": 2,
                },
            ),
            source(
                id="wcc-ticket-detail",
                name="WCC TICKET_DETAIL extract",
                role="public_report_observation",
                availability="provided_input_required",
                demo_data_status="mock_preview",
                access_status="council_input_required",
                input_contract="TICKET_DETAIL",
                privacy={
                    "requester_name": "drop_at_ingest",
                    "incident_address": "withhold_from_public_output",
                    "description": "withhold_from_public_output",
                },
                capability_preview=mock_preview(
                    "Council report adapter",
                    "A synthetic slips report demonstrates taxonomy and privacy removal.",
                ),
            ),
            source(
                id="nzta-tms",
                name="NZTA TMS Telemetry Sites",
                role="movement_context",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://services.arcgis.com/CXBb7LAjgIIdcsPt/ArcGIS/rest/services/TMS_Telemetry_Sites/FeatureServer/0/query",
                entity_resolution="unresolved_without_crosswalk",
                temporal_alignment="insufficient count-window semantics",
            ),
            source(
                id="gwrc-hilltop",
                name="Greater Wellington Hilltop",
                role="hazard_observation",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://hilltop.gw.govt.nz/Telemetry.hts",
                spatial_endpoint="https://mapping.gw.govt.nz/arcgis/rest/services/Rainfall/MapServer/1/query",
                licence="CC BY 4.0",
                entity_resolution="site_id_and_source_coordinates",
                temporal_alignment="LatestTime must be fresh and overlap the case window",
            ),
            source(
                id="nzta-road-events",
                name="NZTA road events",
                role="official_event_observation",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://www.journeys.nzta.govt.nz/assets/map-data-cache/delays.json",
                temporal_alignment="current feed; not evidence for a past replay",
            ),
            source(
                id="metservice-cap",
                name="MetService CAP warnings",
                role="hazard_alert_observation",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://alerts.metservice.com/cap/rss",
                temporal_alignment="warning validity must overlap the case window",
            ),
            source(
                id="geonet-quakes",
                name="GeoNet earthquakes",
                role="hazard_observation",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://api.geonet.org.nz/quake?MMI=3",
                licence="CC BY 3.0 NZ",
                temporal_alignment="event time must overlap the case window",
            ),
            source(
                id="wremo-hubs",
                name="WREMO Community Emergency Hubs",
                role="impact_context",
                availability="public_with_licence_restriction",
                demo_data_status="registered_only",
                access_status="permission_required",
                evidence_policy="context_only",
                temporal_alignment="static context only",
            ),
            source(
                id="wcc-emergency-routes",
                name="WCC emergency routes",
                role="impact_context",
                availability="consult_wcc_before_use",
                demo_data_status="registered_only",
                access_status="permission_required",
                evidence_policy="context_only",
                temporal_alignment="static context only",
            ),
            source(
                id="metlink-realtime",
                name="Metlink bus delays & disruptions",
                role="public_transport_observation",
                availability="requires_key",
                demo_data_status="registered_only",
                access_status="key_required",
                developer_portal="https://opendata.metlink.org.nz/",
                authentication="x-api-key",
                bus_route_types=[3, 712],
                endpoints={
                    "service_alerts": "https://api.opendata.metlink.org.nz/v1/gtfs-rt/servicealerts",
                    "trip_updates": "https://api.opendata.metlink.org.nz/v1/gtfs-rt/tripupdates",
                    "vehicle_positions": "https://api.opendata.metlink.org.nz/v1/gtfs-rt/vehiclepositions",
                    "stop_predictions": "https://api.opendata.metlink.org.nz/v1/stop-predictions",
                },
                entity_resolution="route_id_trip_id_stop_id_and_vehicle_id",
                temporal_alignment="GTFS-RT header and entity timestamps must overlap the selected time",
                evidence_policy="alerts_and_trip_updates_are_observations_not_movement_counts",
            ),
            source(
                id="geonet-tilde-wlgt",
                name="GeoNet Tilde WLGT detided sea level",
                role="hazard_measurement_observation",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://tilde.geonet.org.nz/v4/data/coastal/WLGT/water-height-detided/40/15s/nil/latest/6h",
                connection_status="ready_for_adapter",
                licence="CC BY 3.0 NZ",
                entity_resolution="exact_station_and_series",
                temporal_alignment="sample time must overlap the case window; reject stale or QC-failed rows",
                evidence_policy="measurement_only_until_baseline_and_quality_gates_pass",
            ),
            source(
                id="geonet-shaking-layers",
                name="GeoNet Shaking Layers",
                role="hazard_footprint_observation",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://shakinglayers.geonet.org.nz/api",
                connection_status="ready_for_adapter",
                licence="CC BY 3.0 NZ",
                entity_resolution="exact_geonet_public_id",
                temporal_alignment="match event publicID and retain published version and issue time",
                evidence_policy="published_version_only; modelled_shaking_is_not_damage_confirmation",
            ),
            source(
                id="nema-cap-alerts",
                name="NEMA Emergency Mobile Alert polygons",
                publisher="NEMA",
                role="official_alert_observation",
                availability="requires_authorised_agency_access",
                demo_data_status="mock_preview",
                access_status="permission_required",
                connection_status="restricted_not_ingested",
                public_release="prohibited_without_nema_permission",
                entity_resolution="authorised_polygon_intersection",
                temporal_alignment="effective and expiry times must overlap the case window",
                evidence_policy="disabled_in_public_demo",
                capability_preview=mock_preview(
                    "NEMA Emergency Mobile Alert",
                    "Mock polygon overlap shows how an authorised alert could corroborate a corridor case.",
                ),
            ),
            source(
                id="wcc-road-closures",
                name="WCC Street Events and Road Closures",
                role="official_access_event_observation",
                availability="public_keyless",
                demo_data_status="mock_preview",
                access_status="public_free",
                endpoint="https://gis.wcc.govt.nz/arcgis/rest/services/Transportation/StreetEventsAndRoadClosures/MapServer/1/query",
                connection_status="ready_for_adapter",
                licence="CC BY 3.0 NZ",
                entity_resolution="provider_polyline_overlap_or_maintained_road_id",
                temporal_alignment="Start_Date and End_Date must overlap the case window",
                evidence_policy="approved_and_time_overlapping_only",
                capability_preview=mock_preview(
                    "Road access event",
                    "Mock approved closure intersects the affected corridor during the review window.",
                ),
            ),
            source(
                id="wellington-water-jobs",
                name="Wellington Water public jobs",
                role="lifeline_work_observation",
                availability="public_keyless",
                demo_data_status="mock_preview",
                access_status="publisher_clearance_required",
                endpoint="https://services7.arcgis.com/2ECs938g489DMWjt/arcgis/rest/services/Job_Status_Public_View/FeatureServer/5/query",
                connection_status="registry_only_pending_licence",
                licence_status="publisher_terms_review_required",
                entity_resolution="provider_geometry_requested_with_outSR_4326",
                temporal_alignment="reported and work times must overlap the case window",
                evidence_policy="workflow_observation_not_confirmed_service_loss",
                privacy={
                    "address": "generalise_or_drop_from_public_output",
                    "description": "drop_from_public_output",
                },
                capability_preview=mock_preview(
                    "Water fault work order",
                    "Mock high-priority job near the corridor adds lifeline context, not proof of closure.",
                ),
            ),
            source(
                id="nema-electricity-outages",
                name="NEMA electricity outages",
                role="lifeline_impact_observation",
                availability="public_keyless",
                demo_data_status="mock_preview",
                access_status="publisher_clearance_required",
                endpoint="https://services5.arcgis.com/cJn6oR1QqErYBL5d/arcgis/rest/services/electricity_outages_read_only/FeatureServer/0/query",
                connection_status="registry_only_pending_licence",
                licence_status="publisher_terms_review_required",
                deduplication_key="distributor+distributoroutageid",
                temporal_alignment="active row times must overlap the case window",
                evidence_policy="active_time_aligned_provider_row_only",
                capability_preview=mock_preview(
                    "Electricity outage impact",
                    "Mock provider outage shows affected-customer context without inventing an outage area.",
                ),
            ),
            source(
                id="nema-cdem-boundaries",
                name="NEMA CDEM Group boundaries",
                role="response_authority_context",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="publisher_clearance_required",
                endpoint="https://services5.arcgis.com/cJn6oR1QqErYBL5d/arcgis/rest/services/CDEM_Group_Boundaries/FeatureServer/0",
                connection_status="registry_only_pending_licence",
                entity_resolution="point_in_polygon",
                evidence_policy="context_only",
                temporal_alignment="static response-authority context",
            ),
            source(
                id="metlink-static-gtfs",
                name="Metlink static GTFS",
                role="transport_network_context",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://static.opendata.metlink.org.nz/v1/gtfs/full.zip",
                connection_status="ready_for_entity_graph",
                entity_resolution="stop_id_route_id_and_shape_id",
                temporal_alignment="schedule and calendar only; not actual movement",
                evidence_policy="schedule_and_entity_context_only",
            ),
            source(
                id="wcc-emergency-water-tanks",
                name="WCC emergency water tanks",
                role="lifeline_capability_context",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://services1.arcgis.com/CPYspmTk3abe6d7i/arcgis/rest/services/Emergency_Water_Tank_Location/FeatureServer/0",
                connection_status="registry_only",
                licence="CC BY 3.0 NZ",
                entity_resolution="provider_asset_id_and_geometry",
                evidence_policy="context_only",
                temporal_alignment="static capability context",
            ),
            source(
                id="wcc-event-calendar",
                name="WCC city event calendar",
                role="planned_demand_context",
                availability="public_html",
                demo_data_status="mock_preview",
                access_status="publisher_clearance_required",
                endpoint="https://wellington.govt.nz/news-and-events/event-calendar",
                connection_status="registry_only_pending_licence",
                entity_resolution="venue_or_city_level_only",
                temporal_alignment="scheduled event window only",
                evidence_policy="schedule_only_not_attendance_or_disruption",
                capability_preview=mock_preview(
                    "City event demand",
                    "Mock waterfront event window shows a plausible planned pedestrian-demand explanation.",
                ),
            ),
            source(
                id="eventfinda-events",
                name="Eventfinda events",
                publisher="Eventfinda",
                source_reality="authoritative_commercial_source",
                role="planned_demand_context",
                availability="requires_application_api_key",
                demo_data_status="registered_only",
                access_status="key_required",
                endpoint="https://api.eventfinda.co.nz/v2/events.json",
                developer_portal="https://www.eventfinda.co.nz/api/v2/index",
                authentication="http_basic",
                connection_status="not_configured",
                entity_resolution="event_id_location_id_and_optional_point",
                temporal_alignment="local event start/end and session window must overlap the selected time",
                evidence_policy="schedule_only_not_attendance_or_disruption",
                display_terms="content may be displayed only in the application named in the key request",
            ),
            source(
                id="wcc-planned-works",
                name="WCC Planned Works",
                role="planned_access_context",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://gis.wcc.govt.nz/arcgis/rest/services/Transportation/PlannedWorks/MapServer/1/query",
                licence="CC BY 3.0 NZ",
                entity_resolution="provider_polygon_and_job_id",
                temporal_alignment="proposed and expected work dates must overlap the selected time",
                evidence_policy="planned_work_is_not_a_closure",
            ),
            source(
                id="wcc-emergency-assistance-centres",
                name="WCC Emergency Assistance Centres",
                role="response_capability_observation",
                availability="public_keyless_activation_feed",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://services1.arcgis.com/CPYspmTk3abe6d7i/arcgis/rest/services/WCC_Emergency_Assistance_Centres_(EACs)_VIEW/FeatureServer/0/query",
                entity_resolution="provider_facility_point",
                temporal_alignment="current activation state only",
                evidence_policy="empty_feed_is_not_counter_evidence",
                privacy={"address": "drop_from_public_output"},
            ),
            source(
                id="gwrc-incident-areas",
                name="GWRC Incident Areas",
                role="official_incident_area_observation",
                availability="public_keyless_but_stale",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://services2.arcgis.com/RS7BXJAO6ksvblJm/arcgis/rest/services/GWRC_EM_Incident_Areas_Layer_View/FeatureServer/0/query",
                licence="CC BY 4.0 unless service-specific terms state otherwise",
                entity_resolution="provider_polygon",
                temporal_alignment="reject the 2019 row; require a fresh activation timestamp",
                evidence_policy="stale_record_excluded",
            ),
            source(
                id="nzta-traffic-cameras",
                name="NZTA traffic cameras",
                role="visual_access_context",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://www.journeys.nzta.govt.nz/assets/map-data-cache/cameras.json",
                entity_resolution="camera_id_and_provider_point",
                temporal_alignment="camera feed lastUpdated and fetch time must be current",
                evidence_policy="human_review_required",
                privacy="public_low_resolution_still_only",
            ),
            source(
                id="nema-public-ema-cap",
                name="NEMA public Emergency Mobile Alert CAP",
                role="official_alert_observation",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://alerthub.civildefence.govt.nz/rss/pwp",
                atom_endpoint="https://alerthub.civildefence.govt.nz/atom/pwp",
                entity_resolution="CAP area and geocode when published",
                temporal_alignment="sent, effective and expires must overlap the selected time",
                evidence_policy="message_must_remain_attributed_and_unmodified",
                deduplication_key="cap_identifier",
            ),
            source(
                id="gwrc-parks-notices",
                name="GWRC park access notices",
                role="official_access_notice_context",
                availability="public_keyless",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://www.gw.govt.nz/api/v1/parks/",
                licence="CC BY 4.0 unless stated otherwise",
                entity_resolution="park_url_and_named_location",
                temporal_alignment="notice publication and stated validity must overlap the selected time",
                evidence_policy="park_notice_does_not_establish_road_access",
            ),
            source(
                id="fenz-incident-reports",
                name="FENZ seven-day incident reports",
                role="emergency_response_context",
                availability="public_html",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://www.fireandemergency.nz/incidents-and-news/incident-reports/",
                entity_resolution="command_region_day_and_reported_location_only",
                temporal_alignment="reported incident time must overlap the selected time",
                evidence_policy="incomplete_icad_extract_not_for_statistical_training",
            ),
            source(
                id="kiwirail-wellington-works",
                name="KiwiRail Wellington planned works",
                role="planned_rail_access_context",
                availability="public_html",
                demo_data_status="registered_only",
                access_status="public_free",
                endpoint="https://www.kiwirail.co.nz/our-network/our-regions/wellington/where-we-are-working/",
                entity_resolution="named_corridor_and_place_only",
                temporal_alignment="published work window must overlap the selected time",
                evidence_policy="significant_planned_work_only_not_live_service_status",
            ),
            source(
                id="wellington-airport-flights",
                name="Wellington Airport flight board",
                role="transport_status_observation",
                availability="public_keyless",
                demo_data_status="mock_preview",
                access_status="publisher_clearance_required",
                endpoint="https://www.wellingtonairport.co.nz/api/flights/",
                connection_status="registry_only_pending_licence",
                entity_resolution="fixed_airport_WLG_and_flight_number",
                temporal_alignment="scheduled, estimated and status times must match the case window",
                evidence_policy="schedule_is_context; status_changes_require_terms_clearance",
                capability_preview=mock_preview(
                    "Airport flow change",
                    "Mock delayed-arrival cluster shows how airport status could explain road-demand changes.",
                ),
            ),
            source(
                id="centreport-cruise-schedule",
                name="CentrePort cruise schedule",
                role="planned_demand_context",
                availability="public_html",
                demo_data_status="mock_preview",
                access_status="publisher_clearance_required",
                endpoint="https://www.centreport.co.nz/what-we-do/cruise-ships/cruise-schedule",
                connection_status="registry_only_requires_centreport_clearance",
                entity_resolution="fixed_port_CentrePort_Wellington",
                temporal_alignment="scheduled arrival and departure window only",
                evidence_policy="schedule_only_not_actual_arrival_or_disruption",
                capability_preview=mock_preview(
                    "Cruise arrival demand",
                    "Mock 2,900-passenger call shows a potential planned CBD movement surge.",
                ),
            ),
            source(
                id="google-routes-api",
                name="Google Routes API",
                role="commercial_route_context",
                availability="requires_key_and_billing",
                demo_data_status="mock_preview",
                access_status="paid_key_required",
                reference_page="https://developers.google.com/maps/documentation/routes",
                connection_status="mock_only_no_credentials",
                billing_status="usage_based_billing_account_required",
                pricing_note="Traffic-aware Compute Routes is a higher billing tier; current Pro cap is 5,000 monthly events, then usage pricing; verify before activation",
                display_policy="Routes results displayed on a map must use a Google Map with required attribution",
                storage_policy="ephemeral_only; most Routes API content cannot be cached; place_id is the durable exception",
                entity_resolution="origin_destination_and_provider_route_token",
                temporal_alignment="traffic-aware request time must overlap the case window",
                evidence_policy="provider_estimate_is_context_not_observed_ground_truth",
                capability_preview=mock_preview(
                    "Google traffic-aware route",
                    "Mock route duration at 2.1× typical shows a commercial corroboration option.",
                ),
            ),
            source(
                id="google-places-api",
                name="Google Places API (New)",
                role="place_accessibility_context",
                availability="requires_key_and_billing",
                demo_data_status="mock_preview",
                access_status="paid_key_required",
                reference_page="https://developers.google.com/maps/documentation/places/web-service",
                connection_status="mock_only_no_credentials",
                billing_status="field_mask_based_usage_billing_account_required",
                pricing_note="Accessibility fields use a Pro SKU; current Place Details Pro cap is 5,000 monthly events, then usage pricing; verify before activation",
                display_policy="Google map and attribution rules apply when Places content is map-displayed",
                storage_policy="ephemeral_only; place_id is the durable exception and should be refreshed",
                entity_resolution="provider_place_id",
                temporal_alignment="place metadata is context and not a live accessibility observation",
                evidence_policy="zero_weight_context_not_operational_status",
                capability_preview=mock_preview(
                    "Google place accessibility",
                    "Mock accessible-entry metadata shows planning context, not current venue access.",
                ),
            ),
        ],
    }
    for registry_source in registry["sources"]:
        registry_source["data_2026"] = _source_data_2026(registry_source["id"])
    return registry
