# Movement anomaly model card

[Documentation index](README.md) · [Architecture](architecture.md)

## Decision

Use a 12-week, matched weekday/hour median and median absolute deviation (MAD)
baseline for each `countline × transport class × direction` series.

A row is an investigation candidate only when all three gates pass:

- absolute robust score ≥ 4.5;
- absolute count change ≥ 10;
- relative change ≥ 35%.

Rows without at least eight matching historical hours are marked
`insufficient_baseline`. Expected rows missing from the current batch are
`data_gap`, never zero.

## Why this model won

The source has counts but no verified emergency/disruption labels. A Logistic
Regression or classification SVM would therefore require invented labels and
would only learn our own labelling rule. Manifold learning can visualise patterns
but cannot provide a calibrated incident decision from these data.

We compared count forecasting approaches with chronological splits to avoid
future leakage. The matched seasonal median had the lowest held-out error:

| Model | July 2026 test MAE |
|---|---:|
| Matched weekday/hour median | **7.372** |
| XGBoost regressor | 23.814 |
| Linear SVM regressor | 32.859 |
| Ridge regression | 42.024 |

Benchmark scope: ten highest-volume countlines; 864,424 training observations,
83,374 validation observations in June, and 85,984 test observations in July.
The split is time ordered, not a random 7,000/1,000/2,000 split.

## Precision safeguards

- model each class and direction separately;
- compare only like weekday/hour periods;
- require robust, absolute and relative change together;
- preserve explicit observed zeroes but distinguish missing rows;
- expose sample size, baseline strength, publisher cadence and data age;
- never infer an incident cause or aggregate nearby sensors as unique people.

## LLM boundary

An LLM may turn the structured evidence into a short operator explanation. It
must not change the numerical score, create labels, declare an emergency or
override `normal`, `candidate`, `data_gap` and `insufficient_baseline` states.

## Simulation boundary

Live Operations includes a deterministic browser-local storm/flood exercise so
operators can see map layers change and open a relevant saved investigation when
live movement telemetry is unavailable. Its rain, movement, transit and report
values are authored scenario fixtures, not observations or labels.

Every Simulation record and its April reference-similarity output has evidence
weight `0`. They are excluded from this detector's fit, benchmark, thresholds,
calibration and accuracy claims. Similarity is computed only over available
scenario domains and is not a forecast, incident probability or classifier score.

## Ontology boundary

The detector produces an observation. A deterministic evidence layer may rank a
hypothesis using visible review units, but it cannot create a human decision or
confirmed fact. The supplied synthetic ticket-format fixture is visible and has
zero weight. The Live exercise and its saved-case comparison have the same
zero-authority boundary. No additional classifier is trained because verified
disruption labels are not available.

Situation clustering happens after candidate generation. It reduces operator
queue noise but does not change the detector score, create a causal relationship
or increase evidence weight. Human Case/COP outcomes and browser-local feedback
remain excluded from training until a governed label-release process exists.

## Known limits

This is a transparent signal detector, not a causal or predictive emergency
classifier. Accuracy is constrained by fixed-sensor coverage, sensor errors,
gaps, different commissioning dates and publisher batch cadence.
