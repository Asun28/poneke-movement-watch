function live(rawFormat, options = {}) {
  return {
    connector_mode: "live",
    raw_format: rawFormat,
    freshness_seconds: options.freshness_seconds ?? 600,
    alert_eligible: options.alert_eligible ?? false,
    evidence_weight: options.evidence_weight ?? 1,
    geometry_type: options.geometry_type ?? "provider_defined",
    spatial_scope: options.spatial_scope ?? "Wellington region",
    endpoint: options.endpoint,
    notes: options.notes,
  };
}

function mock(rawFormat, notes) {
  return { connector_mode: "mock", raw_format: rawFormat, alert_eligible: false, notes };
}

function context(rawFormat, notes) {
  return { connector_mode: "context", raw_format: rawFormat, alert_eligible: false, notes };
}

export const SOURCE_MANIFEST = {
  "wcc-transport-sensors": {
    connector_mode: "batch",
    raw_format: "WCC hourly Parquet rows plus countline metadata CSV",
    alert_eligible: false,
    geometry_type: "LineString",
    notes: "Hourly observations published at least monthly; Replay Analyzer only.",
  },
  "wcc-ticket-detail": mock(
    "WCC TICKET_DETAIL JSON array",
    "Council input required; identity, address and free text are removed before publication.",
  ),
  "nzta-tms": context(
    "ArcGIS FeatureSet JSON without geometry",
    "Daily/non-spatial movement context; no trustworthy crosswalk to WCC countlines.",
  ),
  "gwrc-hilltop": live("ArcGIS FeatureCollection JSON backed by Hilltop telemetry", {
    endpoint: "https://mapping.gw.govt.nz/arcgis/rest/services/Rainfall/MapServer/1/query?where=1%3D1&outFields=SiteID%2CLatestRainfall%2CRainTot6Hrs%2CLatestTime&returnGeometry=true&outSR=4326&f=geojson",
    freshness_seconds: 7200,
    alert_eligible: true,
    evidence_weight: 1,
    geometry_type: "Point",
    notes: "LatestTime is authoritative; stale rows are retained as stale, never current.",
  }),
  "nzta-road-events": live("NZTA Journey Planner GeoJSON FeatureCollection", {
    freshness_seconds: 300,
    alert_eligible: true,
    evidence_weight: 2,
    geometry_type: "Point",
  }),
  "metservice-cap": live("RSS 2.0 containing CAP 1.2 warning links/items", {
    freshness_seconds: 3600,
    alert_eligible: true,
    evidence_weight: 2,
    geometry_type: "Polygon or provider area text",
  }),
  "geonet-quakes": live("GeoNet GeoJSON FeatureCollection", {
    freshness_seconds: 1800,
    alert_eligible: true,
    evidence_weight: 2,
    geometry_type: "Point",
  }),
  "wremo-hubs": mock("ArcGIS FeatureSet JSON", "Permission required; static context only."),
  "wcc-emergency-routes": mock("ArcGIS FeatureSet JSON", "Consult WCC before use; static reopening plan."),
  "metlink-realtime": mock("GTFS-Realtime FeedMessage", "Metlink x-api-key required."),
  "geonet-tilde-wlgt": live("GeoNet Tilde JSON series array", {
    freshness_seconds: 120,
    alert_eligible: true,
    evidence_weight: 1,
    geometry_type: "Point",
  }),
  "geonet-shaking-layers": context(
    "GeoNet Shaking Layers event/version JSON plus published GeoJSON products",
    "Event-version resolver registered; no automatic browser-side fan-out.",
  ),
  "nema-cap-alerts": mock(
    "Synthetic CAP 1.2 Alert envelope",
    "Authorised-agency product; no restricted record or endpoint is fetched.",
  ),
  "wcc-road-closures": live("ArcGIS FeatureSet JSON", {
    endpoint: "https://gis.wcc.govt.nz/arcgis/rest/services/Transportation/StreetEventsAndRoadClosures/MapServer/1/query?where=1%3D1&outFields=OBJECTID%2CEvent_Name%2CStart_Date%2CEnd_Date%2CEventType%2CApproved%2CSymbology&returnGeometry=true&outSR=4326&f=geojson",
    freshness_seconds: 3600,
    alert_eligible: true,
    evidence_weight: 2,
    geometry_type: "LineString",
  }),
  "wellington-water-jobs": mock(
    "ArcGIS FeatureSet JSON",
    "Publisher clearance required; address and description excluded from public output.",
  ),
  "nema-electricity-outages": mock(
    "ArcGIS FeatureSet JSON",
    "Publisher licence review required; distributor event IDs are deduplicated.",
  ),
  "nema-cdem-boundaries": mock(
    "ArcGIS FeatureSet JSON",
    "Terms review required; authority-resolution context only.",
  ),
  "metlink-static-gtfs": context("GTFS ZIP/CSV tables", "Schedule and entity context, not actual movement."),
  "wcc-emergency-water-tanks": context("ArcGIS FeatureSet JSON", "Static capability context; not current availability."),
  "wcc-event-calendar": mock("HTML parser output envelope", "Eventfinda-backed content requires terms review."),
  "eventfinda-events": mock("Eventfinda v2 events collection JSON", "Application API key and attribution terms required."),
  "wcc-planned-works": context("ArcGIS FeatureSet JSON", "Planned work is not a current road closure."),
  "wcc-emergency-assistance-centres": live("ArcGIS FeatureSet JSON", {
    freshness_seconds: 300,
    alert_eligible: true,
    evidence_weight: 2,
    geometry_type: "Point",
    notes: "A connected empty features array means no current records, not all clear.",
  }),
  "gwrc-incident-areas": {
    connector_mode: "stale",
    raw_format: "ArcGIS FeatureSet JSON",
    alert_eligible: false,
    notes: "The available record is from 2019 and is excluded from Live Operations.",
  },
  "nzta-traffic-cameras": live("NZTA Journey Planner camera GeoJSON", {
    freshness_seconds: 300,
    alert_eligible: false,
    evidence_weight: 0,
    geometry_type: "Point",
    notes: "Camera metadata is visual context only; images need human review and terms clearance.",
  }),
  "nema-public-ema-cap": live("RSS/Atom with embedded CAP 1.2 Alert", {
    freshness_seconds: 900,
    alert_eligible: true,
    evidence_weight: 2,
    geometry_type: "Polygon or geocode",
  }),
  "gwrc-parks-notices": live("GWRC parks JSON array", {
    freshness_seconds: 86400,
    alert_eligible: false,
    evidence_weight: 0,
    geometry_type: "Named place",
    notes: "Notices without an explicit date retain unknown freshness.",
  }),
  "fenz-incident-reports": context(
    "Official HTML parser output envelope",
    "Seven-day response context is incomplete and has text locations only.",
  ),
  "kiwirail-wellington-works": context("Official HTML parser output envelope", "Planned rail-work context only."),
  "wellington-airport-flights": mock("Wellington Airport flight-board JSON", "Automated redistribution terms review required."),
  "centreport-cruise-schedule": mock("CentrePort HTML table parser envelope", "Schedule is irregular and redistribution clearance is required."),
  "google-routes-api": mock("Google Routes v2 ComputeRoutes JSON", "API key, billing and Google display/caching terms required."),
  "google-places-api": mock("Google Places API (New) Place JSON", "API key, billing, field mask and Google attribution terms required."),
};
