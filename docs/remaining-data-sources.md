# Remaining data-source inventory

Verified 10 August 2026 for Pōneke Movement Watch.

## Scope

This is a systematic pass over official Wellington, regional and New Zealand
sources relevant to movement, access, hazards, lifelines, planned demand and
exposure. It excludes the 24 contracts already present in
`/cop/v2/source-registry.json` and classifies 53 remaining source groups.

`Connect next` does not mean that a record proves an incident. Every adapter must
retain publisher, observed/published time, geometry, freshness, access terms and
an ontology role. Static layers and schedules remain context; images require
human review; empty activation feeds are a valid state.

## Summary

| Class | Count | Recommendation |
|---|---:|---|
| Connect next | 8 | Add adapters or registry contracts with strict freshness and truth labels. |
| Permission, key or terms review | 11 | Demonstrate as mock/contract-only until access is cleared. |
| Context only | 17 | Use for entity resolution, exposure or expected patterns; never as live evidence. |
| Extend an existing contract | 6 | Add measurements/fields without inflating the source count. |
| Optional non-government corroboration | 4 | Lower priority than the official source for the same fact. |
| Exclude | 7 | Do not ingest or publish. |

## A. Connect next

| # | Source | Interface and verified state | Ontology use and hard limit |
|---:|---|---|---|
| 1 | [WCC Planned Works](https://gis.wcc.govt.nz/arcgis/rest/services/Transportation/PlannedWorks/MapServer) | Keyless ArcGIS polygons; 510 surfacing jobs with proposed dates from 2025-07-01 to 2027-07-01 and expected completion through 2028-06-30. | `planned_access_context`; only work overlapping the selected replay time is relevant. A planned job is not a closure. |
| 2 | [WCC Emergency Assistance Centres](https://services1.arcgis.com/CPYspmTk3abe6d7i/arcgis/rest/services/WCC_Emergency_Assistance_Centres_(EACs)_VIEW/FeatureServer/0) | Public point FeatureServer; zero rows at verification, by design. Fields include facility, suburb and wheelchair accessibility. | `response_capability_observation`; an empty feed means no published activation, not no emergency. Suppress street address in public views. |
| 3 | [GWRC Incident Areas](https://services2.arcgis.com/RS7BXJAO6ksvblJm/arcgis/rest/services/GWRC_EM_Incident_Areas_Layer_View/FeatureServer/0) | Public polygon FeatureServer intended for activations. The only row at verification was an ICP record dated 2019, so it fails a current freshness gate. | `official_incident_area`; register now, but display only time-valid activation records and never silently treat the stale row as current. |
| 4 | [NEMA public EMA CAP feeds](https://www.civildefence.govt.nz/guidance-training/guidelines/technical-standards/common-alerting-protocol) | Official RSS and Atom feeds; NEMA explicitly encourages developers to redistribute unmodified, attributed messages. The RSS endpoint responded with current XML and no-cache headers. | `authoritative_alert_observation`; this is the public message feed, distinct from the restricted ArcGIS broadcast polygons. Preserve identifier, sender, sent/effective/expires and update/cancel semantics. |
| 5 | [NZTA traffic cameras](https://www.journeys.nzta.govt.nz/highway-conditions) | Keyless GeoJSON plus public low-resolution still images. Verification found 319 cameras nationally, 26 in a broad Wellington-region box and one regional camera flagged offline. | `visual_access_observation`; show offline/maintenance state and fetch time. A human or validated image model must interpret an image; never infer traffic volume from image availability alone. |
| 6 | [GWRC parks notices API](https://www.gw.govt.nz/your-council/open-data/) | Official documented JSON API at `/api/v1/parks/{park-url}` with park name, location, activities and notices. | `planned_or_current_access_notice`; relevant to regional trail/park access, lower priority for central-city roads. Keep notice text and publisher time separate from inferred impact. |
| 7 | [FENZ seven-day incident reports](https://www.fireandemergency.nz/incidents-and-news/incident-reports/) | Official current HTML report by command region and day. FENZ warns that the ICAD extract is incomplete and unsuitable for statistical analysis. | `emergency_response_observation`; useful for corroboration and demand awareness. Do not train a baseline from it or fabricate precise coordinates from vague locations. |
| 8 | [KiwiRail Wellington works](https://www.kiwirail.co.nz/our-network/our-regions/wellington/where-we-are-working/) | Official HTML listing of significant upcoming work and disruption. It explicitly omits many short-notice maintenance jobs and directs passenger status to Metlink. | `planned_rail_access_context`; date and corridor entity resolution only. Metlink service alerts remain the authority for passenger operations. |

## B. Permission, key or terms review

| # | Source | Access state | Recommendation |
|---:|---|---|---|
| 9 | [2degrees outages](https://api.2degrees.nz/outages/publishedOutages) | Keyless JSON with planned/unplanned state, time, location and coordinates. Nine national records and no Wellington record were present at verification; no open reuse licence was found. | Register as `terms_review`; mock the capability publicly until redistribution is cleared. |
| 10 | One NZ outage service | The public site exposes configuration, while outage records require a GraphQL POST. No stable open-data/reuse contract was found. | Permission/terms review; do not scrape as a production dependency. |
| 11 | Public Safety Network Cellular Network Visibility Service | Official cross-carrier live outage/planned-work capability for emergency services and coordination centres, not a public feed. | `permission_required`; a strong WCC private integration candidate, mock-only on the public demo. |
| 12 | [Transpower Wellington GZ8 load](https://www.transpower.co.nz/system-operator/live-system-and-market-data/live-load-data) | Public page embeds approximately five-minute MW/MVAR/power-factor series and supports downloads. Publisher labels the information indicative/best-effort; no dedicated open API contract was found. | Aggregate lifeline corroboration only, never proof of a local outage. Confirm automated reuse terms. |
| 13 | [CentrePort harbour weather](https://www.centreport.co.nz/) | Public real-time wind, tide and wave dashboards; the underlying Grafana calls are technically accessible but no redistribution licence was found. | High-value harbour hazard context after terms clearance; otherwise link or mock. |
| 14 | [Interislander](https://www.interislander.co.nz/plan/arrivals-and-departures) and [Bluebridge](https://www.bluebridge.co.nz/service-alerts/) | Interislander exposes a GraphQL disruption path and page data; Bluebridge is HTML-only. Both are public operational pages without a verified open-data contract. | `ferry_status_observation` after permission; do not equate a schedule with an actual sailing. |
| 15 | [FENZ active-fire/fire-danger service](https://www.checkitsalright.nz/) | Public site backend exposes 28 ArcGIS layers for active fires, permits and fire-zone status plus a point-to-station fire-danger API. The operational reuse licence is not explicit. | Terms review. Active-fire records may corroborate a case; permits and danger ratings are context, not incidents. |
| 16 | FENZ FireMapper | Responder-facing near-live CAD, appliance and coordinate data. | `permission_required`; never reproduce responder-only locations in the public demo. |
| 17 | [WCC three-waters network](https://gis.wcc.govt.nz/arcgis/rest/services/WaterServices/WCC_3_Waters_Underground_Services_Backup/MapServer) | Keyless ArcGIS asset layers, but water/drainage data is not covered as safely as ordinary WCC open GIS data. | Request WCC permission. Use only as infrastructure dependency context and never expose sensitive asset detail unnecessarily. |
| 18 | [NIWA developer APIs](https://developer.niwa.co.nz/) | Free signup/key for tide and fire-weather products. | Add only after obtaining a project key and recording licence, quota, cache and attribution requirements. |
| 19 | NationalMap Emergency Management Basemap | Monthly national facilities context; API and redistribution conditions need confirmation. | Registry-only until terms are verified; prefer the authoritative component layers where available. |

## C. Context only

| # | Source | Verified state | Correct use |
|---:|---|---|---|
| 20 | [WCC Street Light Outages](https://gis.wcc.govt.nz/arcgis/rest/services/Transportation/StreetLightOutages/MapServer/0) | 452 point records. Parsed dates cover 2024-04-26 to 2025-06-13; 451 have restoration dates. It is stale as of this review. | Historical access-safety context only until the publisher restores a fresh contract. It is not a road closure or electricity-outage feed. |
| 21 | [Wellington Regional Transport Status V2](https://services2.arcgis.com/RS7BXJAO6ksvblJm/arcgis/rest/services/Wellington_Regional_Transport_Status_V2_VIEW/FeatureServer) | 19,599 roads, 66 rail segments and 3 airport polygons, all sampled as open. Road record edits sampled to 2021; rail/airport to 2024. | Network/status template, not live operations. Never use `open` as current contradicting evidence without fresh edits. |
| 22 | [NZTA Emergency Management Carriageway Status](https://services.arcgis.com/CXBb7LAjgIIdcsPt/ArcGIS/rest/services/EmergencyManagement_CarriagewayStatus/FeatureServer/0) | 1,015 state-highway segments with lanes, traffic estimates and status fields; service edit metadata is from 2023. | Road entity/capacity context; current incidents must come from Journey Planner/TREIS. |
| 23 | [GWRC/WREMO emergency facilities](https://mapping.gw.govt.nz/arcgis/rest/services/GW/Emergencies_P/MapServer) | 5 ambulance stations, 126 hubs, 32 fire stations, 13 hospitals, 61 medical centres and 11 police stations. Service-specific licence is restrictive and metadata may be dated. | Response-capability entities only; not current availability. Obtain clearance before productising. |
| 24 | [GWRC pedestrian network and constraints](https://services2.arcgis.com/RS7BXJAO6ksvblJm/arcgis/rest/services/Pedestrian_network_and_constraints/FeatureServer) | 21 mapped barriers and 424 shared paths; 2020/2023 planning data. | Resolve pedestrian corridors and known structural constraints; not a current obstruction feed. |
| 25 | GWRC regional cycle network/cycleways | Static route and facility geometry from the regional ArcGIS catalogue. | Resolve cycle entities and expected routes; not current cyclist counts or closures. |
| 26 | GWRC strategic freight, access points and corridor resilience | Static strategic-network and planning layers; the freight service contains 332 line features. | Consequence and criticality context after an observation, never independent support for an incident. |
| 27 | [GWRC traffic volumes](https://services2.arcgis.com/RS7BXJAO6ksvblJm/arcgis/rest/services/Traffic_volumes_on_state_highway_and_local_roads/FeatureServer) and route speeds | Historical AADT and free-flow/congested planning layers; verified metadata is from 2023. | Long-run expected-pattern context only. Do not compare it directly with hourly WCC counts as if sensors or time windows matched. |
| 28 | [LINZ resilience suite](https://www.linz.govt.nz/products-services/data/types-linz-data/resilience-and-climate-change/key-datasets-resilience-and-climate-change) | CC-licensed buildings, addresses, suburbs/localities, property boundaries, road centreline, imagery and elevation; machine services may need a free key. | Entity resolution, exposure and routing geometry. Building presence is not occupancy or damage. |
| 29 | [Stats NZ 250 m estimated resident population grid](https://datafinder.stats.govt.nz/layer/119709) | Annual population estimate grid, CC BY 4.0, free account/key for API access. | Exposure denominator only. It does not represent people present at the selected replay hour. |
| 30 | [EHINZ Social Vulnerability Indicators](https://www.ehinz.ac.nz/indicators/population-vulnerability/social-vulnerability-indicators/) | Periodic SA2-level dataset across vulnerability dimensions. | Preparedness/equity context; never rank individual people or infer present vulnerability. |
| 31 | NZ Index of Deprivation 2023 | SA1/SA2 polygons; the public service licence is not explicit. | Area-level equity context after licence review, not individual risk or live evidence. |
| 32 | [Ministry of Education school directory](https://catalogue.data.govt.nz/dataset/directory-of-new-zealand-schools) | Daily regenerated national directory with location and school roll. | Facility and daytime exposure context; roll is not real-time attendance. |
| 33 | GWRC GPs, supermarkets and schools | Public ArcGIS facility layers with fixed locations. | Access-to-essential-services entity graph; availability must come from a time-stamped operational observation. |
| 34 | [OpenStreetMap emergency/lifeline POIs](https://www.openstreetmap.org/copyright) | ODbL community data for hydrants, shelters, toilets, drinking water, AEDs, pharmacies, supermarkets, fuel and EV charging. | Fill entity gaps with visible attribution and caching; prefer an official asset owner where one exists. |
| 35 | [GNS active-fault/EILD services](https://gis.gns.cri.nz/server/rest/services) | Fault avoidance zones, earthquake-induced landslide probability rasters and landslide-dam records. | Hazard susceptibility/impact context. Scenario probability is not an observed landslide. |
| 36 | [LINZ tide predictions](https://www.linz.govt.nz/products-services/tides-and-currents/tide-predictions) and [LAWA downloads](https://www.lawa.org.nz/download-data) | Predicted tide and periodic environmental baselines. | Expected-state/baseline inputs only; pair with observed gauges and retain dataset date. |

## D. Extend existing contracts instead of adding new sources

| # | Existing contract | Extension | Why it is not a new source |
|---:|---|---|---|
| 37 | GWRC Hilltop | Baring Head wave buoy, tide, soil moisture/temperature, air quality, groundwater, lakes/wetlands and water quality. | Same publisher and Hilltop store; each series needs a last-observation freshness check. |
| 38 | GeoNet Tilde | DART deep-ocean water level and Wellington GNSS displacement. | Same Tilde provenance; DART sensor codes rotate and normal mode may deliver batches only every six hours. |
| 39 | GeoNet earthquake | CAP, measured/reported intensity, processed strong motion, volcano alerts and news. | Same GeoNet authority; link every derived product to the event public ID and revision state. |
| 40 | Metlink | Static route/stop graph plus keyed GTFS-RT trip updates, vehicles and service alerts. | Already registered. Realtime requires a free key and covers public transport, not general road movement. |
| 41 | NZTA road events | Journey Planner/TREIS delays and closure updates. | Already registered; deduplicate incident IDs and revisions instead of counting each endpoint as separate evidence. |
| 42 | WCC works/events | ForwardWorksViewer aggregation surface. | It repeats component planned-work/closure records and must not add a second evidence unit. |

## E. Optional non-government corroboration

| # | Source | Boundary |
|---:|---|---|
| 43 | [Open-Meteo forecast/marine/flood APIs](https://open-meteo.com/) | Useful model context, but prefer MetService warnings and local gauges for official observations. |
| 44 | [OpenSky Network](https://opensky-network.org/) | Anonymous aircraft-state data can suggest reduced aviation activity, but coverage and absence are not proof of airport closure. |
| 45 | [Copernicus Data Space](https://dataspace.copernicus.eu/) and [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/) | Satellite change/fire corroboration; signup/key, revisit, cloud and latency make them unsuitable as early city signals. |
| 46 | [AISstream](https://aisstream.io/) | Keyed volunteer-receiver vessel stream; verify Wellington coverage and licence before relying on it. |

## F. Exclude

| # | Source or proposal | Reason |
|---:|---|---|
| 47 | NEMA ArcGIS EMA broadcast polygons | Official item says restricted data for permitted responding agencies. Keep the public demo mock-only even though the endpoint is technically reachable. |
| 48 | Wellington Electricity direct outage JSON | Publisher geographic-information terms prohibit redistribution/repurposing without express permission. Use NEMA electricity data or obtain written permission. |
| 49 | MetService local observation/forecast JSON | Payloads carry a restricted-use notice. Keep the licensed CAP warnings already registered. |
| 50 | National rapid building assessments | LINZ states that no national dataset is currently available. Do not invent one. |
| 51 | “Live landslide feed” | No independent open Wellington live landslide incident feed was found. Static susceptibility layers cannot be relabelled as incidents. |
| 52 | Property-title owner details | Unnecessary personal data with no role in movement anomaly detection. Use parcels/buildings without owners. |
| 53 | General social-media scraping | No stable, consented, representative official contract. WCC tickets and official event/alert feeds are safer. |

## Recommended integration order

1. Add `WCC Planned Works`, `WCC EAC`, public `NEMA CAP` and `NZTA Cameras` to
   the source registry, with zero evidence by default.
2. Add adapters for time overlap, freshness, geometry and source-specific status;
   require human review for camera evidence.
3. Add GWRC Incident Areas only with a strict age gate that rejects the 2019 row.
4. Add planned KiwiRail work and FENZ reports as text/context adapters, not
   automated incident truth.
5. Seek WCC/private permission for PSN, FENZ FireMapper, three-waters and other
   operational integrations before enabling them outside a mock preview.

## Selection rules

- `observation != inference != decision != confirmed fact`.
- Missing or empty feeds are `no current record received`, not contradictory
  evidence.
- Static population, buildings, facilities and networks estimate exposure or
  consequence; they do not confirm disruption.
- Schedules and planned works explain expected movement but do not prove actual
  attendance, closure or delay.
- Duplicate publisher surfaces share one correlation group and one maximum
  evidence contribution.
- Public output must strip requester names, precise household addresses,
  responder-only locations and unnecessary infrastructure detail.

