# Four-minute demo

## 0:00–0:25 — The operating picture

Open **Dashboard**. Say:

> “This is an extra signal for investigation, not an incident detector. It brings
> source health, movement change, weather and reports into one evidence workflow,
> while people retain every operational decision.”

Point out that infrastructure issues and operational candidates are separate.
Zero review candidates is explicitly not an all-clear.

## 0:25–1:30 — Live and Simulation

Open **Live Operations**. Show the compact command deck: source health, review
state, refresh and `Live / History / Simulation` share one bounded control.

Select **Simulation** and say:

> “WCC movement counts are a monthly batch, not a live API. For this demo we use
> a browser-local exercise instead of pretending those counts are live.”

Play the six stages. Show rain rising while people/vehicle movement falls, transit
delay and mock reports appear, and mapped values change with the timeline. Point
to `Mock scenario · weight 0 · no alert · no training`.

State that the scenario performs no external write and cannot create an alert,
incident, ticket or training label.

## 1:30–2:20 — Compare with the April Storm

At a later simulated stage, show the **April Storm 2026** comparison and its
coverage count. Say:

> “This is missing-aware pattern similarity, not a forecast or probability. It
> helps an operator find a relevant saved investigation; it does not decide that
> the same event is happening.”

Open the saved investigation. Replay is bounded to 18–22 April and uses 10,098
official historical GWRC Hilltop observations. Move the playhead and show rainfall,
river and map records changing by selected time. Historical WCC movement outcomes
remain retrospective, off by default and zero event-time evidence weight.

## 2:20–3:05 — Return to the movement task

Switch to **August movement review**. Show the 414 WCC countlines and the published
hourly pedestrian/vehicle replay. Select a movement record and compare observed,
expected, signed change, robust score and matched-hour history.

Explain:

- the baseline matches `countline × class × direction × weekday × hour`;
- missing rows are data gaps, never zero;
- a countline change is an investigation candidate, not a cause or incident;
- the monthly publisher cadence means this is retrospective batch evidence.

## 3:05–3:40 — Investigation workflow

Open **Signal Review**. One queue card represents a Situation; raw Signals expand
under it. Show supporting, contradicting, missing and context evidence, then the
human-controlled investigation/COP fields.

The WCC ticket path is a supplied-shape simulator only: prepared, never sent, no
WCC connection. Mock feedback cannot enter model training or accuracy metrics.

## 3:40–4:00 — Hand-off

Open **City Ontology** or the COP feeds. Close with:

> “Council gets one quieter, auditable Situation instead of a thousand raw
> signals. Ontology aligns time, place, source and evidence; models propose;
> authorised staff investigate and decide.”
