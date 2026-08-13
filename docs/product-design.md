# Product design system

[Documentation index](README.md) · [Architecture](architecture.md) · [Current screenshots](README.md#current-product-views)

## Design intent

Pōneke Movement Watch is an emergency-operations workspace, not a marketing dashboard. The interface optimizes for rapid scanning, explicit uncertainty, map visibility and safe human hand-off.

The visual language is deliberately calm and dense: familiar public-sector forms, Atlassian/Fluent-style hierarchy, limited motion, compact status labels and strong progressive disclosure. Decorative explanation stays out of daily-use screens; truth, source, freshness, access and authority labels remain visible.

## Core principles

1. **Situation first, raw records second.** A queue row represents one `SituationCluster`; raw Signals expand below it.
2. **Map first where geography matters.** Search, filters, layers and selected evidence share one map workspace instead of competing dashboards.
3. **Truth before polish.** Live, Batch replay, Mock, registered-only, stale and context states must never look interchangeable.
4. **One primary action per task.** Filters use neutral/selected states; blue is reserved for the active view or primary action.
5. **Progressive disclosure.** Advanced source contracts, raw payloads, evidence, ontology paths and local configuration open only when requested.
6. **Human authority is visible.** Candidate, Situation, Case, Incident and Warning remain separate states. Human-only decisions never appear as model output.
7. **No silent empty state.** “No candidates” means monitoring continues; feed issues and held observations remain visible.

## Information architecture

| Module | Operator job | Default hierarchy |
|---|---|---|
| Dashboard | Notice what requires attention | actionable status → monitored domains → source health → investigations |
| Live Operations | Inspect current evidence geographically | compact health/mode deck → search and domain filters → map → collapsible evidence |
| Signal Review | Decide whether a Situation warrants investigation | queue → Situation summary → typed evidence → Case/COP → prepared actions |
| Replay Analyzer | Reconstruct a bounded historical window | investigation/time/playback → filters → map → layers/evidence drawers |
| Data Integration | Understand and configure source contracts | searchable source list → runtime/access details → local configuration action |
| City Ontology | Trace why evidence maps or does not map | six-stage chain → selected stage → source paths/inspector |
| Easy setup | Prepare an integration safely | task checklist → focused form → local draft status |

The left navigation stays stable across every module. On narrow screens it collapses to the established icon rail/bottom navigation behavior; core actions do not move into an off-screen horizontal strip.

## Visual foundation

### Colour roles

| Token/role | Use |
|---|---|
| Civic ink / navy | navigation, primary text and structural chrome |
| Movement blue | active navigation, primary action and selected map/filter state |
| Corroboration teal | connected, supporting or completed state |
| Signal amber | attention, Mock, context requiring review or degraded state |
| Uncertainty coral | contradiction, exclusion, stale/error or decrease state |
| White/harbour paper | content surfaces and quiet map-adjacent panels |
| Hairline grey | grouping and field boundaries, not primary hierarchy |

Colour never carries meaning alone. Status text, icons, signs or patterns accompany it. Increase/decrease uses sign, colour and direction; source health uses label plus indicator.

### Typography

- `Segoe UI`, `Helvetica Neue` and Arial are the operator UI stack.
- Condensed display faces are limited to established headings and high-level metrics.
- Consolas/monospace is reserved for timestamps, identifiers, evidence values, source states and machine-readable labels.
- Functional operator labels target a 13 px floor. Smaller type is limited to map attribution, axes or nonessential technical micro-labels.
- Sentence case is the default. Uppercase is reserved for short state badges and identifiers.

### Shape, spacing and motion

- Controls use the established 44 px minimum touch target.
- Panels use compact 6–10 px radii, one-pixel boundaries and restrained shadows.
- Spacing follows a compact 4/8/12/16/24 rhythm; whitespace groups tasks rather than creating presentation emptiness.
- Motion is functional and brief (`120–180 ms`). Reduced-motion preferences disable nonessential transitions and transforms.

## State language

| Term | Meaning | Never imply |
|---|---|---|
| Live | Current permitted adapter snapshot with freshness/health | complete coverage or all-clear |
| Batch replay | Publisher records inspected retrospectively | live emergency telemetry |
| Mock | Provider-shaped or exercise data with weight `0` | provider connection or operational receipt |
| Registered | Contract exists but no eligible record is used | connection or map evidence |
| Candidate | Detector/rule output worth review | confirmed incident or cause |
| Situation | Grouped signals for one review unit | causal relationship |
| Case | Human-owned investigation | incident confirmation |
| Prepared · not sent | Validated local payload | dispatch, publication or external write |
| Human only | Action requires an authorised role | automated approval |

Avoid “all-clear” when any source is empty, stale, paused or failing. Prefer short statements such as `0 candidates · monitoring continues` and separate operational candidates from infrastructure health.

## Map interaction

- Use the light street basemap only as geographic context; keep OpenStreetMap/CARTO attribution visible in the lower-right control area.
- People and vehicles use distinct recognizable icons plus travel direction.
- Increase/decrease is shown with signed values, colour and directional marks; sensor coverage stays visually lighter than active evidence.
- Domain and source filters update one normalized record set. Selected state uses colour/background, not extra “picked” copy.
- Grouping is delayed until broad regional zoom and remains adjustable. Selecting a cluster reveals an adaptive evidence summary for the active case and source types.
- Standard `+`/`−`, reset and full-screen controls remain available alongside wheel, trackpad, pinch, drag and keyboard navigation.
- Hover provides concise evidence on pointer devices. Tap opens a bottom sheet/drawer on mobile; hover-only content must have a selectable list alternative.
- Replay markers, layer counts, evidence values and the playhead all bind to the same selected time.

## Responsive behavior

### Desktop

- Preserve the map as the largest surface.
- Use compact command bars and master/detail layouts.
- Drawers overlay or occupy bounded side columns; they do not permanently shrink the map without a user action.

### Tablet and small laptop

- Allow command groups to wrap into two intentional rows.
- Keep Layers and Evidence reachable without horizontal scrolling.
- Stack Signal Review detail content before fields become narrow enough to wrap character-by-character.

### Phone

- Combine status and controls into compact rows.
- Collapse search filters and secondary panels by default.
- Use full-width bottom sheets for selected map evidence.
- Keep primary controls within the first viewport and away from the bottom navigation hit area.
- Hide only redundant visual detail; preserve complete accessible names and state meaning.

## Component patterns

- **Page title bar:** module name, one short mode badge and global time. No explanatory paragraph.
- **Metrics ribbon:** separate candidate state from source/infrastructure state; actionable nonzero values receive semantic emphasis.
- **Filter chip:** outline/neutral when inactive, filled/coloured when selected; `All` and subfilters must not express contradictory selection.
- **Queue row:** Situation ID/title, gate, status, source/time summary and unread/new state. Raw Signal count is secondary.
- **Typed evidence:** supporting, contradicting, missing and context buckets; empty buckets reduce visual weight without disappearing from the audit.
- **Staff fields:** visually grouped editable fields, distinct from read-only source facts.
- **Timeline:** visible activity density, clear playhead, dim future region and an 8 px or larger scrub target.
- **Layer control:** source icon, name, truth/access badge and selected state; zero-record sources remain selectable for contract inspection but cannot invent markers.
- **Adaptive evidence:** fields depend on selected case and data type; unknown values stay unknown rather than being filled with defaults.

## Accessibility and operational QA

- Keyboard focus must remain visible on every button, link, form control, map tool and disclosure.
- Use semantic buttons, labels, headings, tables and disclosure elements before ARIA repair.
- Touch targets are at least 44 px for primary controls.
- Functional text and state contrast target WCAG AA; outdoor/low-quality-monitor use is part of the design context.
- Respect `prefers-reduced-motion`.
- No page-level horizontal overflow at supported desktop and phone viewports.
- Map actions have list/form alternatives; icons have accessible names.
- Loading, empty, partial, stale, Mock and error states are individually testable.

## Content rules

- Lead with the operator fact or action, not a feature explanation.
- Use one consistent name: **Dashboard**, **Live Operations**, **Signal Review**, **Replay Analyzer**, **Data Integration**, **City Ontology**, **Easy setup**.
- Use `Signal → Situation → Investigation Case → Decision/COP` for workflow language.
- Show IDs where records move between systems: `SIG-…`, `SIT-…`, `CASE-…`, `WCC-EM-…`.
- Never write “connected”, “sent”, “published”, “confirmed” or “live” unless a verified contract and receipt support that claim.
- Put detailed coaching in documentation, not routine screens.

## Screenshot and demo standard

- Documentation screenshots use public demo data only, no browser chrome or private information.
- Use `1280×720` PNGs under `docs/images/` with stable descriptive names and alt text.
- Prefer one task-complete view over stitched pages.
- Captions must state when source health or current counts can change.
- The demo follows Dashboard → Live/Simulation → saved April Replay → August movement Replay → Situation Review → Ontology/COP.

## Design-change checklist

Before merging a UI change, confirm:

- truth/access/authority labels are still accurate;
- one primary task remains obvious;
- map visibility has not been needlessly reduced;
- filter and queue states are logically consistent;
- keyboard, touch, reduced-motion and small-screen behavior remain usable;
- no explanatory copy was added where progressive disclosure would work;
- existing visual tokens and icons were reused;
- rendered behavior tests and desktop/phone browser QA pass.

The current screenshots in the [documentation index](README.md#current-product-views) are the visual baseline, not pixel-perfect golden files. Behavior, truth and accessibility take precedence over exact pixels.
