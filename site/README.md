# Web console

The Next.js operator interface for Pōneke Movement Watch.

[Project overview](../README.md) · [Architecture](../docs/architecture.md) · [Documentation index](../docs/README.md)

## Run

```powershell
npm install
npm test
npm run lint
npm run dev
```

Open `http://localhost:3001`. Set `SITE_URL` for hosted builds so Open Graph URLs are absolute.

## Routes

| Route | Module |
|---|---|
| `/dashboard` | Current picture and source-health attention |
| `/live` | Current evidence map, History handoff and zero-authority Simulation |
| `/alerts` | Situation-first Signal Review and browser-local Case/COP |
| `/replay` | Historical investigation map and evidence playback |
| `/integration` | Source contracts, access and runtime health |
| `/ontology` | Operational chain and Fusion architecture |
| `/setup` | Safe local configuration drafts |

## Replay frontend boundaries

- `MovementCanvas.tsx` orchestrates data projections and focused views.
- `movementReplayUi.ts` owns pure timeline/filter/source/evidence transitions.
- `useReplaySourceWorkspace.ts` owns source selection and local drafts.
- `useMovementReplayMap.ts` owns canvas drawing and map interaction.
- `components/MovementReplay*` contain the command bar, map stage and evidence workspace.

The split preserves existing behavior while making playback-stop rules, transient evidence clearing and source-selection policy directly testable.

## Temporal truth

- **Live** uses the current normalized adapter snapshot; zero candidates is not an all-clear.
- **History** opens saved investigations in Replay Analyzer.
- **Simulation** is a deterministic six-stage browser-local storm/flood exercise.
- WCC Transport Sensor files under `public/cop/v1/` are Batch replay, never live telemetry.
- April similarity is saved-case reference context, not a forecast or incident probability.

Every Simulation record has evidence weight `0`, is alert-ineligible and is excluded from training, calibration, accuracy claims and external writes.

## Security boundary

The application sends CSP, clickjacking, MIME-sniffing, referrer and browser-permission headers. Public GET API reads remain cross-origin. POST is same-origin unless listed in Worker `ALLOWED_POST_ORIGINS`; mutation responses never use wildcard CORS.

The UI can prepare Mock tickets, field tasks, notifications and warning packs. It cannot dispatch, issue, publish or write to WCC systems.
