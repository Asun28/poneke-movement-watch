# Documentation

This index is the canonical route through Pōneke Movement Watch documentation. The root [README](../README.md) is the concise product entry point; detailed policies live here and are not repeated across multiple files.

## Start here

1. [Architecture and operating workflow](architecture.md) — system boundaries, Situation-first investigation flow, frontend modules and APIs.
2. [Product design system](product-design.md) — information hierarchy, visual tokens, maps, responsive behavior and accessibility.
3. [Evidence ontology and exclusions](ontology-and-exclusions.md) — truth states, source labels, privacy and hard exclusions.
4. [Movement anomaly model card](model-card.md) — detector choice, chronological benchmark and limitations.
5. [Four-minute demo](demo-script.md) — the operator story from Live to Replay and Signal Review.

## Build and operate

| Document | Owns |
|---|---|
| [Web console](../site/README.md) | Local web commands, security headers and temporal-mode safety |
| [Data reproduction](data-reproduction.md) | Offline sample and full public WCC artifact builds |
| [Security policy](../SECURITY.md) | Supported versions, reporting and disclosure boundary |
| [Changelog](../CHANGELOG.md) | Repository release history and safety boundary |
| [Remaining source inventory](remaining-data-sources.md) | Verified candidates, terms, access and integration priority |

## Decisions

The [decision index](decisions/README.md) contains the durable choices that should not be inferred from UI code:

- robust seasonal baseline before learned classifiers;
- NZTA TMS remains spatially unresolved;
- v1 `available_at` is not claimed as verified publisher time;
- operational Simulation is deterministic and has zero authority.
- Signal Review groups raw Signals into non-causal Situations before investigation.

## Current product views

| View | Screenshot |
|---|---|
| Dashboard | [dashboard.png](images/dashboard.png) |
| Live Operations | [live-operations.png](images/live-operations.png) |
| Signal Review | [signal-review.png](images/signal-review.png) |
| Replay Analyzer | [replay-analyzer.png](images/replay-analyzer.png) |
| City Ontology | [city-ontology.png](images/city-ontology.png) |

Screenshots contain public demo data only and were captured on 13 August 2026. Current source-health counts may change.

## Documentation ownership

- Product purpose, tour and quick start belong in the root README.
- System structure, workflows, APIs and code boundaries belong in `architecture.md`.
- Interaction, visual, responsive, accessibility and content rules belong in `product-design.md`.
- Truth, access, evidence, privacy and exclusion policy belong in `ontology-and-exclusions.md`.
- Model choice and metrics belong in `model-card.md`.
- Reproduction commands and source-file checks belong in `data-reproduction.md`.
- Durable trade-offs belong in ADRs under `decisions/`.

This ownership rule keeps source counts, authority claims and model limits consistent when the prototype changes.
