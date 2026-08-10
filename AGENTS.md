# Pōneke Movement Watch — agent rules

These rules apply to this repository. Preserve the evidence, time, source-truth and
human-authority boundaries when changing code, data, models or documentation.

## Ontology-aware fusion architecture

Use ontology-aware late fusion, not one monolithic model over all raw records:

```text
domain experts
  ↓
time · place · entity · provenance alignment
  ↓
ontology entities · relations · evidence rules
  ↓
eligible expert outputs + deterministic official rules
  ↓
calibrated late-fusion candidate
  ↓
human investigation and authorised response
```

### Ontology is not a trainable model

- The ontology is a versioned semantic contract for entity resolution, source mappings,
  place/asset relationships, provenance, evidence buckets and deterministic eligibility rules.
- Ontology classes, relations, mappings and evidence policies have no learned weights. Do not
  train, fine-tune or silently change them from operational data.
- Mapping changes require a version, provenance note and human review. Never overwrite
  `source_claimed_time`, `normalized_event_time`, source truth or confirmed facts.

### Domain policy

| Domain | Recommended processing | Training policy |
|---|---|---|
| Rain, river and water | Station baseline, rate, accumulation and extreme thresholds | Train a domain expert |
| Pedestrian and vehicle | Weekday × hour × direction × type seasonal anomaly | Train a domain expert |
| Road closure, CAP, outage, Metlink alert | Official time, place and status rules | Usually no model |
| WCC ticket and event text | Classification, entity extraction and human review | Train only after verified labels |
| Events, flights, cruise and planned works | Demand/disruption context | Not incident evidence |
| News and post-event reports | Evaluation labels and explanation | Not early-warning input |
| LLM | Summaries, contradictions and draft questions | Score weight always `0` |

Each trained base model stays inside one declared domain. It may use permitted domain records,
deterministic shared time/place identifiers and approved static covariates. It must not consume
another expert prediction, an LLM output, a reviewer decision or a post-event label as a feature.

Every expert output must declare `model_id`, `model_version`, `source_domain`, `observed_at`,
`available_at`, coverage/data-quality state, calibration status and uncertainty. It is an
observation or inference, never an incident decision.

### Training, labels and late fusion

- Use chronological, event-blocked splits. Never randomly split correlated 5/15-minute rows from
  the same event.
- Replay and training may use only records available at that step: `available_at <= as_of`.
- A learned fusion/meta-model may use only out-of-fold base-model predictions from multiple
  independent events and normal-control windows.
- Calibrate on an independent later time block. Do not tune thresholds, weights or calibration on
  the final event/test window.
- One event, including the April 2026 storm, is a backtest case study, not an accuracy claim.
- Do not add XGBoost, SVM, learned global weights or trained fusion until sufficient independent,
  human-reviewed event labels exist.

### Hard exclusions

- Mock, synthetic, provider-shape, exercise, stale, unlicensed, unknown-time and `undetermined`
  records are excluded from training, calibration, scoring, thresholds and fusion weights.
- Browser-local drafts, cases, tickets, warnings and adapter outputs are not training labels. A
  separate governed label-release process is required.
- LLM output has weight `0`. It must not set a score, label, threshold, ontology relation, incident
  state, ticket state, warning state or publication state.
- Post-event news, reports, damage and retrospective classifications are ground truth only unless
  their historical publication time and eligibility are explicitly proven.

### Human authority and release gates

- Models and ontology may propose; authorised people decide.
- No model, LLM or fusion score may confirm an incident, dispatch staff, create an external ticket,
  publish a warning or send a message.
- Model/data releases require human review of source eligibility, time leakage, held-out metrics,
  calibration, mock exclusion and model-card updates.
- Tests must protect mock exclusion, `available_at` enforcement, event-blocked splitting,
  out-of-fold-only fusion, LLM weight `0` and no automatic external action.

## Agent execution

- Bounded independent audits and verification may run in parallel when useful.
- Coordinate shared-file edits through the primary agent and preserve user changes.
- Do not train an intermediate or production model merely because parallel compute is available;
  the data, label, split, governance and acceptance rules above still apply.
- Do not push the GitHub origin or change remote `main` unless the user explicitly requests it.

