"use client";

import { FormEvent, useEffect, useState } from "react";
import { WORKFLOW_ADAPTERS } from "../../lib/workflowAdapters.mjs";

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

type ReviewStatus = "open" | "investigating" | "needs_action" | "closed";
type ReviewDraft = {
  status: ReviewStatus;
  assignee: string;
  note: string;
  updatedAt: string;
};
type WorkflowResult = {
  adapter_id: string;
  adapter_name: string;
  status: string;
  dispatched: boolean;
  provider_payload: Record<string, unknown>;
};

const STORAGE_KEY = "poneke-alert-review-drafts-v1";
const MOCK_ID = "mock-preview";
const EMPTY_DRAFT: ReviewDraft = { status: "open", assignee: "", note: "", updatedAt: "" };

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
      <header><h3>{label}</h3><span>{values.length}</span></header>
      {values.length ? <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul> : <p className="empty">None received</p>}
    </section>
  );
}

export default function AlertCentreClient() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [notice, setNotice] = useState("");
  const [workflowAdapterId, setWorkflowAdapterId] = useState(WORKFLOW_ADAPTERS[0].id);
  const [workflowState, setWorkflowState] = useState<"idle" | "preparing" | "ready" | "error">("idle");
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);

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

    const loadDrafts = window.setTimeout(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
        if (active && stored && typeof stored === "object" && !Array.isArray(stored)) {
          setDrafts(stored);
        }
      } catch {
        // An unreadable local draft should never block the review queue.
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadDrafts);
    };
  }, []);

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? null;
  const selectedKey = selected?.id ?? MOCK_ID;
  const activeDraft = drafts[selectedKey] ?? EMPTY_DRAFT;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCandidates = candidates.filter((candidate) => {
    const reviewStatus = drafts[candidate.id]?.status ?? "open";
    const matchesStatus = statusFilter === "all" || reviewStatus === statusFilter;
    const matchesQuery = !normalizedQuery || [candidate.id, candidate.title, candidate.source_id]
      .some((value) => value.toLowerCase().includes(normalizedQuery));
    return matchesStatus && matchesQuery;
  });
  const observedLabel = selected
    ? new Intl.DateTimeFormat("en-NZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Pacific/Auckland" })
      .format(new Date(selected.observed_at))
    : "No observation";

  function changeDraft(change: Partial<ReviewDraft>) {
    setNotice("");
    setDrafts((current) => ({
      ...current,
      [selectedKey]: { ...(current[selectedKey] ?? EMPTY_DRAFT), ...change },
    }));
  }

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextDraft = { ...activeDraft, updatedAt: new Date().toISOString() };
    const nextDrafts = { ...drafts, [selectedKey]: nextDraft };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDrafts));
      setDrafts(nextDrafts);
      setNotice("Saved locally");
    } catch {
      setNotice("Could not save on this browser");
    }
  }

  async function prepareWorkflow() {
    setWorkflowState("preparing");
    setWorkflowResult(null);
    try {
      const response = await fetch("/api/integration/v1/workflow-adapters", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          adapter_id: workflowAdapterId,
          case: {
            case_id: selected?.id ?? "mock-preview",
            title: selected?.title ?? preview.title,
            severity: selected?.severity ?? "unassigned",
            source_id: selected?.source_id ?? "synthetic-fixture",
            observed_at: selected?.observed_at ?? null,
            affected_area: selected ? "Wellington impact area" : "Synthetic Wellington area",
          },
        }),
      });
      if (!response.ok) throw new Error("Mock adapter unavailable");
      setWorkflowResult(await response.json() as WorkflowResult);
      setWorkflowState("ready");
    } catch {
      setWorkflowState("error");
    }
  }

  return (
    <section className="alert-centre-grid">
      <aside className="alert-queue" aria-label="Alert ticket queue">
        <header className="alert-queue-header">
          <div><p className="eyebrow">Human review queue</p><h2>Review queue</h2></div>
          <output>{filteredCandidates.length}</output>
        </header>

        <div className="alert-queue-tools">
          <label>
            <span>Search tickets</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, source, title" />
          </label>
          <label>
            <span>Filter by review status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | ReviewStatus)}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="needs_action">Needs action</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>

        <div className="alert-ticket-list">
          {state === "loading" && <p className="ops-state" role="status">Loading…</p>}
          {state === "error" && <p className="ops-state is-error" role="alert">Alert service unavailable.</p>}
          {state === "ready" && candidates.length === 0 && (
            <div className="alert-empty-state"><strong>No current candidates</strong><p>Not an all-clear</p></div>
          )}
          {state === "ready" && candidates.length > 0 && filteredCandidates.length === 0 && (
            <div className="alert-empty-state"><strong>No matching tickets</strong><p>Clear search or choose another status.</p></div>
          )}
          {filteredCandidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className={`alert-ticket-row ${candidate.id === selectedId ? "is-selected" : ""}`}
              aria-pressed={candidate.id === selectedId}
              onClick={() => { setSelectedId(candidate.id); setNotice(""); }}
            >
              <span className="alert-ticket-row-meta"><b>{candidate.severity}</b><i>{drafts[candidate.id]?.status ?? "open"}</i></span>
              <strong>{candidate.title}</strong>
              <small>{candidate.id} · {candidate.source_id}</small>
            </button>
          ))}
          <button
            type="button"
            className={`alert-ticket-row is-mock ${selected ? "" : "is-selected"}`}
            aria-pressed={!selected}
            onClick={() => { setSelectedId(null); setNotice(""); }}
          >
            <span className="alert-ticket-row-meta"><b>Mock · zero evidence</b><i>{drafts[MOCK_ID]?.status ?? "open"}</i></span>
            <strong>{preview.title}</strong>
            <small>mock-preview · synthetic fixture</small>
          </button>
        </div>
      </aside>

      <article className="alert-review-panel" aria-labelledby="alert-ticket-title">
        <header className="alert-ticket-header">
          <div className="alert-ticket-identity">
            <span className={selected ? "truth-chip" : "mock-chip"}>{selected ? "Live inference · unreviewed" : "Mock · not a live alert"}</span>
            <code>{selected?.id ?? "mock-preview"}</code>
          </div>
          <h2 id="alert-ticket-title">{selected?.title ?? preview.title}</h2>
          <span className="case-rule">{selected?.rule_id ?? "synthetic-preview"}</span>
        </header>

        <dl className="alert-ticket-facts" aria-label="System fields">
          <div><dt>System severity</dt><dd>{selected?.severity ?? "Not computed"}</dd></div>
          <div><dt>Source</dt><dd>{selected?.source_id ?? "Synthetic fixture"}</dd></div>
          <div><dt>Observed</dt><dd>{observedLabel}</dd></div>
          <div><dt>Evidence state</dt><dd>{selected?.epistemic_state ?? "Zero weight"}</dd></div>
        </dl>

        <form className="alert-review-form" onSubmit={saveDraft}>
          <fieldset>
            <legend>Review fields</legend>
            <label>
              <span>Review status</span>
              <select name="review-status" value={activeDraft.status} onChange={(event) => changeDraft({ status: event.target.value as ReviewStatus })}>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="needs_action">Needs action</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label>
              <span>Assigned to</span>
              <input name="assignee" value={activeDraft.assignee} onChange={(event) => changeDraft({ assignee: event.target.value })} placeholder="Name or team" />
            </label>
            <label className="alert-note-field">
              <span>Review note</span>
              <textarea name="review-note" value={activeDraft.note} onChange={(event) => changeDraft({ note: event.target.value })} rows={2} placeholder="Decision, check or next action" />
            </label>
          </fieldset>
          <div className="alert-review-actions">
            <button type="submit">Save local draft</button>
            <span aria-live="polite">{notice || (activeDraft.updatedAt ? "Saved on this browser" : "This browser only")}</span>
          </div>
        </form>

        <section className="alert-workflow-section" aria-labelledby="alert-workflow-title">
          <header>
            <h2 id="alert-workflow-title">Workflow actions</h2>
            <span>Mock only · nothing is sent</span>
          </header>
          <div className="alert-workflow-controls">
            <label>
              <span>Adapter</span>
              <select
                aria-label="Choose workflow mock adapter"
                value={workflowAdapterId}
                onChange={(event) => { setWorkflowAdapterId(event.target.value); setWorkflowResult(null); setWorkflowState("idle"); }}
              >
                {WORKFLOW_ADAPTERS.map((adapter) => (
                  <option key={adapter.id} value={adapter.id}>{adapter.name}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => void prepareWorkflow()} disabled={workflowState === "preparing"}>
              {workflowState === "preparing" ? "Preparing…" : "Prepare mock"}
            </button>
          </div>
          <div className="alert-workflow-result" aria-live="polite">
            {workflowState === "error" ? <strong>Mock adapter unavailable</strong> : null}
            {workflowResult ? (
              <>
                <div>
                  <strong>{workflowResult.adapter_name} prepared</strong>
                  <span>Not sent · zero evidence weight</span>
                </div>
                {workflowResult.adapter_id === "replay-case-handoff" && typeof workflowResult.provider_payload.replay_url === "string" ? (
                  <a href={workflowResult.provider_payload.replay_url}>Open case in Replay</a>
                ) : null}
                <details>
                  <summary>View mock payload</summary>
                  <pre>{JSON.stringify(workflowResult.provider_payload, null, 2)}</pre>
                </details>
              </>
            ) : null}
          </div>
        </section>

        <section className="alert-evidence-section" aria-labelledby="alert-evidence-title">
          <header><h2 id="alert-evidence-title">Evidence</h2><span>Read-only</span></header>
          <div className="alert-evidence-grid">
            <Bucket label="Supporting" values={selected?.evidence.supporting ?? preview.supporting} />
            <Bucket label="Contradicting" values={selected?.evidence.contradicting ?? preview.contradicting} />
            <Bucket label="Missing" values={selected?.evidence.missing ?? preview.missing} />
            <Bucket label="Context" values={selected?.evidence.context ?? preview.context} />
          </div>
        </section>

        <div className="alert-authority-note">
          <strong>Human review required</strong>
          <span>{selected ? "Review draft does not confirm an incident" : "Mock data cannot create alerts"}</span>
        </div>
      </article>
    </section>
  );
}
