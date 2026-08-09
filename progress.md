# Progress — Phase 2 ontology and sources

- 2026-08-09: Read the supplied ontology brief and extracted its epistemic-state, evidence, entity-resolution, and human-confirmation requirements.
- 2026-08-09: Loaded Agent Reach, planning-with-files, and TDD instructions. Created project-local planning files before source research or implementation.
- 2026-08-09: Confirmed the current branch is `codex/movement-anomaly-prototype` at commit `e84d08a`; the worktree was clean before this phase.
- 2026-08-09: Audited the current GeoJSON contract and the supplied live/additional-source catalogue. Shortlisted source roles and rejected mislabelling Wellington Water jobs as drainage telemetry or static hazard layers as incident observations.
- 2026-08-09: Agent Reach/Exa verified official Hilltop, CAP, GWRC rainfall, emergency-hub, and slope-failure interfaces.
- 2026-08-09: Parsed `hackathon_data_format.txt`. Added its NZTA TMS and exact WCC `TICKET_DETAIL` schema to scope, with a hard PII boundary excluding `REQUESTER_NAME` from every output.
- 2026-08-09: Inspected the real CLI, GeoJSON contract, Python integration tests, page, and rendered-worker tests. Chose a backward-compatible `/cop/v2/` ontology surface and real CLI/worker tests as the implementation boundary.
- 2026-08-09: Selected the real Centennial Highway movement anomaly as the ontology replay anchor; recorded its exact IDs, location, observed/expected counts, and truth-label requirements for any supplementary fixture.
- 2026-08-09: TDD RED verified. Five ontology/CLI tests fail for the intended missing behavior: ticket normalization/privacy, enum fail-closed behavior, missing-vs-contradicting evidence, source registry, and `/cop/v2/` artifact generation.
- 2026-08-09: TDD GREEN verified: seven focused Python tests pass for ticket/TMS normalisation, privacy, synthetic-fixture zero weight, missing evidence and v2 build artifacts.
- 2026-08-09: Added the server-rendered case ledger with four epistemic states and Supporting, Contradicting, Missing and Context/Excluded evidence buckets.
- 2026-08-09: Site build and four rendered-output/artifact tests pass. Existing v1 COP endpoints remain linked; v2 observations, graph and registry are published alongside them.
- 2026-08-09: Generated one project-bound ontology replay social card and added it as `site/public/og-ontology-v2.png`.
- 2026-08-09: Full verification passed: 20 Python tests, four rendered-site/artifact tests and ESLint.
- 2026-08-09: Rebuilt the downloadable whole-source ZIP, saved Sites version 2 from commit `238feaa`, and completed an owner-only production deployment at the existing live URL.
