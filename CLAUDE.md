# Pōneke Movement Watch — Claude Code context

Pōneke Movement Watch began as Wellington City Council Emergency Management Impact Lab Problem 05 and is now a seven-module decision-support prototype.

Canonical repository: `https://github.com/Asun28/poneke-movement-watch.git`.

## Problem

> How might we identify and map sudden changes in pedestrian or vehicle movement that could indicate disruption, unsafe conditions, evacuation or loss of access?

The desired outcome is another early indication for Council investigation, not an automated incident, dispatch or warning system.

## Current system

- **Dashboard** separates operational candidates from source-health issues.
- **Live Operations** provides Live, History and deterministic zero-authority Simulation modes.
- **Signal Review** groups raw Signals into non-causal `SituationCluster` queue items, then supports browser-local typed evidence, Field Tasks, Decisions and versioned COP records.
- **Replay Analyzer** inspects bounded April Storm and August movement investigations.
- **Data Integration** exposes 33 source contracts with access, cost, truth and runtime state.
- **City Ontology** shows the operational chain and ontology-aware fusion design.
- **Easy setup** prepares local source/API/MCP/A2A drafts without activation.

WCC Transport Sensor data is Batch replay, not live telemetry. Simulation is Mock, evidence weight `0`, alert-ineligible, excluded from training/calibration and incapable of external writes. April similarity is retrieval context, not a forecast, incident probability or causal claim.

WCC Ticket is a supplied-shape simulator. It does not connect to or write into WCC. Every prepared action is labelled Mock or `Prepared · not sent`.

## Required reading

1. [Agent rules](AGENTS.md)
2. [Architecture](docs/architecture.md)
3. [Product design](docs/product-design.md)
4. [Evidence ontology and exclusions](docs/ontology-and-exclusions.md)
5. [Model card](docs/model-card.md)

## Data boundaries

- Public Wellington GIS and telemetry sources retain publisher terms and attribution.
- ArcGIS geometry is commonly NZTM2000; request/project to WGS84 for web maps.
- Page capped FeatureServer queries and verify `exceededTransferLimit`.
- Do not invent coordinates, identifier joins, incident labels or publication times.
- Keep private emergency, 111, identity, exact household address, responder-only and unrestricted ticket text out of the public repository.
- Empty, stale, Mock, registered-only and context records do not become contrary or supporting incident evidence by UI placement.

The original public data catalogue remains a research input, not this repository's Git remote:

- `https://github.com/claudecommunity-nz/wcc-emergency-gis-data`
- `https://claudecommunity-nz.github.io/wcc-emergency-gis-data/`

Do not add, fetch from or push to the former team repository. Keep `origin` on Asun28.

## Development

```powershell
uv sync --group dev --extra test
uv run pytest -q
uv run ruff check .

Set-Location site
npm install
npm test
npm run lint
```

For interface changes, preserve the design system and run desktop/phone browser QA in addition to automated tests. For documentation changes, update the owning source of truth and verify local Markdown links.
