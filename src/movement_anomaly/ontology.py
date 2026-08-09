from __future__ import annotations

from collections.abc import Mapping, Sequence
from copy import deepcopy
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


def source_registry():
    def source(*, demo_data_status, access_status, **fields):
        return {
            **fields,
            "source_reality": "official_source",
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

    return {
        "schema": "wellington-source-registry/v1",
        "verified_at": "2026-08-09",
        "demo_status_legend": {
            "real_replay": "Official source records used in this replay",
            "mock_preview": "Synthetic capability preview with zero evidence weight",
            "registered_only": "Official source registered; no records used in this replay",
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
                name="Metlink realtime",
                role="public_transport_observation",
                availability="requires_key",
                demo_data_status="registered_only",
                access_status="key_required",
                temporal_alignment="not connected in this demo",
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
