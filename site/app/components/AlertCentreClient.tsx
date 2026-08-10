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
        {state === "loading" && <p className="ops-state" role="status">Loading…</p>}
        {state === "error" && <p className="ops-state is-error" role="alert">Alert service unavailable.</p>}
        {state === "ready" && candidates.length === 0 && (
          <div className="alert-empty-state">
            <strong>No current candidates</strong>
            <p>No rule passed · not all-clear</p>
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
          <span>Mock · zero evidence</span>
          <strong>{preview.title}</strong>
        </article>
      </aside>

      <div className="alert-review-panel">
        <article className="alert-case-header">
          {selected ? (
            <>
              <div>
                <span className="truth-chip">Live inference · unreviewed</span>
                <h2>{selected.title}</h2>
                <span className="case-rule">{selected.rule_id}</span>
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

        <div className="alert-authority-note">
          <strong>Human review required</strong>
          <span>Mock data cannot create alerts</span>
        </div>
      </div>
    </section>
  );
}
