from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from copy import deepcopy

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
