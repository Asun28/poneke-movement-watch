# Pōneke Movement Watch web console

The deployable operator interface for the evidence-first WCC Emergency Management
prototype. It contains Dashboard, Live Operations, Signal Review, Replay Analyzer,
Data Integration, City Ontology and Easy setup.

## Run

```powershell
npm install
npm test
npm run lint
npm run dev
```

Set `SITE_URL` when building for a hosted origin so Open Graph and social-card
URLs are absolute.

The application sends a restrictive Content Security Policy plus clickjacking,
MIME-sniffing, referrer and browser-permission headers. Public `GET` API reads
remain cross-origin. Mutation requests never receive wildcard CORS: browser
`POST` is same-origin unless an origin is explicitly listed in the Worker
`ALLOWED_POST_ORIGINS` comma-separated environment variable.

## Live temporal modes

Live Operations uses one compact command deck for source health, operational
review, refresh controls and three modes:

- **Live** — current normalized adapter snapshot. Zero candidates is not an all-clear.
- **History** — entry point to saved investigations; full review occurs in Replay Analyzer.
- **Simulation** — deterministic six-stage browser-local storm/flood exercise.

Simulation varies rainfall, surface water, vehicle/pedestrian movement, transit
delay and mock reports on the same map. Its source ID is
`mock-wellington-storm-flood-simulator`. Every record is Mock, evidence weight
`0`, alert-ineligible, excluded from training/calibration and never written to an
external system.

The April Storm percentage is missing-aware pattern similarity against a saved
reference profile. It is not a forecast, incident probability, causal claim or
automatic alert. Operators can open the packaged April investigation in Replay.

## Historical movement truth

The files in `public/cop/v1/` remain a WCC Transport Sensors **Batch replay**:

- `movement-signals.geojson`
- `movement-health.json`
- `countline-coverage.geojson`
- `movement-replay.json`

WCC publishes the source Transport Sensors data at least monthly, so these files
must never be presented as live emergency telemetry. Simulation does not change,
relabel or train on them.

## Safety boundary

The console supports investigation and human decision-making. It does not
automatically confirm incidents, dispatch responders, write WCC tickets or issue
public warnings. Mock and retrospective records never gain authority through UI
placement, ontology links or similarity scores.
