"use client";

import { useEffect, useState } from "react";

type Candidate = {
  id: string;
  title: string;
  severity: string;
  observed_at: string;
  source_id: string;
  review_state: string;
  rule_id: string;
  epistemic_state: string;
  decision_authority: string;
  evidence: {
    supporting: string[];
    contradicting: string[];
    missing: string[];
    context: string[];
  };
};

const preview = {
  title: "Synthetic northern-access investigation",
  supporting: ["Mock sensor drop at a synthetic countline"],
  contradicting: [],
  missing: ["No current official road-status record", "No independent movement source"],
  context: ["Static reopening plan is context only"],
};

function Bucket({ label, values }: { label: string; values: string[] }) {
  return (
    <section className={`alert-evidence-bucket bucket-${label.toLowerCase()}`}>
      <h3>{label}</h3>
      {values.length ? values.map((value) => <p key={value}>{value}</p>) : <p className="empty">None received</p>}
    </section>
  );
}

export default function AlertCentreClient() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/alerts/v1/candidates", { headers: { accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("Alert candidate service unavailable");
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        const next = payload.candidates ?? [];
        setCandidates(next);
        setSelectedId(next[0]?.id ?? null);
        setState("ready");
      })
      .catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, []);

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? null;

  return (
    <section className="alert-centre-grid">
      <aside className="alert-queue" aria-label="Human review queue">
        <header>
          <p className="eyebrow">Human review queue</p>
          <h2>Candidate alerts</h2>
          <span>{candidates.length} current</span>
        </header>
        {state === "loading" && <p className="ops-state" role="status">Loading deterministic alert candidates…</p>}
        {state === "error" && <p className="ops-state is-error" role="alert">Candidate service unavailable. No alert state has been inferred.</p>}
        {state === "ready" && candidates.length === 0 && (
          <div className="alert-empty-state">
            <strong>No current candidates</strong>
            <p>This means no rule passed the current evidence gates. It is not an all-clear.</p>
          </div>
        )}
        {candidates.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            className={candidate.id === selectedId ? "is-selected" : ""}
            onClick={() => setSelectedId(candidate.id)}
          >
            <span>{candidate.severity}</span>
            <strong>{candidate.title}</strong>
            <small>{candidate.source_id} · {candidate.review_state}</small>
          </button>
        ))}
        <article className="mock-alert-preview">
          <span>Mock workflow preview · zero evidence</span>
          <strong>{preview.title}</strong>
          <p>Demonstrates review layout only. It is not returned by the Alert API.</p>
        </article>
      </aside>

      <div className="alert-review-panel">
        <div className="alert-pipeline" aria-label="Alert decision pipeline">
          <div><span>01</span><strong>Pre-trained sensor monitor</strong><small>Candidate signal only</small></div>
          <b aria-hidden="true">→</b>
          <div><span>02</span><strong>Ontology correlation</strong><small>Typed evidence roles</small></div>
          <b aria-hidden="true">→</b>
          <div><span>03</span><strong>Deterministic policy</strong><small>Severity and gates</small></div>
          <b aria-hidden="true">→</b>
          <div><span>04</span><strong>LLM explanation only</strong><small>No publish authority</small></div>
          <b aria-hidden="true">→</b>
          <div><span>05</span><strong>Human decision</strong><small>Authorised review</small></div>
        </div>

        <article className="alert-case-header">
          {selected ? (
            <>
              <div>
                <span className="truth-chip">Live inference · unreviewed</span>
                <h2>{selected.title}</h2>
                <p>Rule {selected.rule_id}. Decision authority: {selected.decision_authority}.</p>
              </div>
              <dl>
                <div><dt>Severity basis</dt><dd>{selected.severity}</dd></div>
                <div><dt>Epistemic state</dt><dd>{selected.epistemic_state}</dd></div>
                <div><dt>Source</dt><dd>{selected.source_id}</dd></div>
              </dl>
            </>
          ) : (
            <>
              <div>
                <span className="mock-chip">Mock · not a live alert</span>
                <h2>{preview.title}</h2>
                <p>Visible only to demonstrate the review workflow when live sources are quiet.</p>
              </div>
              <dl>
                <div><dt>Severity basis</dt><dd>Not computed</dd></div>
                <div><dt>Epistemic state</dt><dd>Synthetic preview</dd></div>
                <div><dt>Evidence weight</dt><dd>0</dd></div>
              </dl>
            </>
          )}
        </article>

        <div className="alert-evidence-grid">
          <Bucket label="Supporting" values={selected?.evidence.supporting ?? preview.supporting} />
          <Bucket label="Contradicting" values={selected?.evidence.contradicting ?? preview.contradicting} />
          <Bucket label="Missing" values={selected?.evidence.missing ?? preview.missing} />
          <Bucket label="Context" values={selected?.evidence.context ?? preview.context} />
        </div>

        <section className="mock-llm-explanation" aria-label="Mock LLM explanation preview">
          <div>
            <span>Mock LLM explanation · zero authority</span>
            <strong>Why this would be shown to an operator</strong>
          </div>
          <p>
            A synthetic movement drop may indicate lost access, but the current
            evidence has no official closure record and no independent movement
            source. Investigate the source health and road status before acting.
          </p>
          <ul>
            <li>Is the sensor current and complete?</li>
            <li>Does an official access event overlap this place and time?</li>
          </ul>
        </section>

        <div className="alert-authority-note">
          <strong>Mock data cannot create an alert candidate.</strong>
          <p>The LLM may summarise evidence and suggest questions. It cannot confirm, publish, dispatch, change severity or override source access.</p>
        </div>
      </div>
    </section>
  );
}
