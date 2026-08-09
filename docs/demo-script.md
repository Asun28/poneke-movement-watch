# Four-minute demo

## 0:00–0:25 — The promise

“This is an extra signal for investigation, not an incident detector. We compare
anonymous hourly pedestrian and vehicle counts with the same weekday and hour in
the preceding 12 weeks.”

Point to **Batch replay** and **Data through 6 Aug 2026**. Say that the publisher
refreshes the source at least monthly, so this prototype does not claim to be live.

## 0:25–1:15 — The map

Show the 414 WCC countlines and the 12 changes at Thursday 6 August, 12:00.
Switch between **People** and **Vehicles**. Explain that each line is the actual
sensor countline, not a claim about an entire street or suburb.

## 1:15–2:35 — The evidence trail

Select Centennial Highway: 502 cars versus a matched baseline of 873.5. Then
scroll to the case ledger and read the four states: **Observation, Inference,
Human decision, Confirmed fact**.

Show Supporting, Contradicting and Missing. Say: “No contradictory observation
was received; that is not evidence that the road is clear.” Point out that the
ticket row is a synthetic format fixture and adds zero evidence weight.

## 2:35–3:20 — Accuracy and exclusions

Show the **207 data gaps**. Missing rows are never converted to zero. Mention the
fixed-sensor coverage, possible double counting at nearby countlines, staggered
installation dates and that a vehicle count is not a passenger count.

The chronological benchmark used June for validation and July for testing. The
matched weekday/hour baseline beat Ridge, Linear SVM and XGBoost on test MAE, so
the simpler detector was selected.

NZTA TMS is registered but unresolved because it has no geometry or verified
countline crosswalk. Current Hilltop, road-event and weather feeds are missing
from this past replay window, not counted as counter-evidence. Personal ticket
identity, address and free text are removed at ingestion.

## 3:20–4:00 — Hand-off

Open `/cop/v2/evidence-graph.json` and `/cop/v2/source-registry.json`. The v1
movement feed remains compatible; v2 adds typed observations, provenance,
evidence roles, hypotheses, decision state and exclusions for the shared COP.

Close with: “Council gets another transparent early indication, while the human
operator keeps the decision.”
