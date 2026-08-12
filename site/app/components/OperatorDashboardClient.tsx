"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowClockwise,
  ArrowRight,
  CheckCircle,
  Pulse,
  ShieldWarning,
  Tray,
} from "@phosphor-icons/react";
import { buildOperatorDashboardSummary } from "../../lib/operatorDashboard.mjs";
import { REVIEW_STORAGE_KEY } from "../../lib/signalReview.mjs";

type Investigation = { id: string; title: string; data_label: string; truth_label: string; replay_url: string };
type SourceState = { source_id: string; name: string; connector_mode: string; runtime_state: string; record_count: number };
type Candidate = { id: string };
type Snapshot = {
  generated_at: string;
  sources: SourceState[];
  observations: Array<{ id: string }>;
  evidence_inbox?: {
    raw_observation_count: number;
    suppressed_observation_count: number;
    candidates: Candidate[];
    monitoring_groups: Array<{ id: string; label: string; fresh_count: number; record_count: number }>;
  };
};
type ReviewDrafts = Record<string, { status?: string; updatedAt?: string }>;

function readReviewDrafts(): ReviewDrafts {
  try {
    const value = JSON.parse(window.localStorage.getItem(REVIEW_STORAGE_KEY) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export default function OperatorDashboardClient({ investigations }: { investigations: Investigation[] }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<ReviewDrafts>({});
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const refresh = useCallback(async () => {
    setState((current) => current === "ready" ? current : "loading");
    try {
      const response = await fetch("/api/integration/v1/snapshot", { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error("Current operations unavailable");
      setSnapshot(await response.json() as Snapshot);
      setReviewDrafts(readReviewDrafts());
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60_000);
    const syncReview = (event: StorageEvent) => {
      if (event.key === REVIEW_STORAGE_KEY) setReviewDrafts(readReviewDrafts());
    };
    window.addEventListener("storage", syncReview);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.removeEventListener("storage", syncReview);
    };
  }, [refresh]);

  const summary = useMemo(
    () => snapshot ? buildOperatorDashboardSummary(snapshot, reviewDrafts) : null,
    [reviewDrafts, snapshot],
  );
  const attentionClass = summary ? `is-${summary.attention.kind}` : "is-loading";

  return (
    <section className="dashboard-workspace" data-operator-dashboard="current-picture" aria-busy={state === "loading"}>
      <header className="dashboard-command-bar">
        <div>
          <h2>Current picture</h2>
          <span className={`dashboard-sync-state is-${state}`} data-dashboard-sync={state === "error" ? "paused" : "auto"}>
            <i aria-hidden="true" />
            <strong>{state === "error" ? "Sync paused" : "Live"}</strong>
            <span>{state === "error" ? "· Retry required" : "· Auto-syncing"}</span>
          </span>
        </div>
        <div className="dashboard-command-actions">
          <button type="button" onClick={() => void refresh()} disabled={state === "loading"} aria-label="Refresh dashboard">
            <ArrowClockwise aria-hidden="true" size={18} />
            {state === "loading" ? "Checking" : "Refresh"}
          </button>
          <a className="dashboard-secondary-action" href="/alerts"><Tray aria-hidden="true" size={18} />Open Signal Review</a>
        </div>
      </header>

      <dl className="dashboard-metric-strip" aria-label="Current operational totals">
        <div><dt>New</dt><dd>{summary?.review.new ?? "-"}</dd></div>
        <div><dt>Active</dt><dd>{summary?.review.active ?? "-"}</dd></div>
        <div><dt>Held</dt><dd>{summary?.held ?? "-"}</dd></div>
        <div><dt>Records</dt><dd>{summary?.current_records ?? "-"}</dd></div>
        <div><dt>Connected</dt><dd>{summary?.source_health.connected ?? "-"}</dd></div>
        <div
          data-dashboard-metric="issues"
          data-state={state === "ready" ? (summary?.source_health.issues ? "attention" : "clear") : "checking"}
        >
          <dt>Issues</dt>
          <dd>{summary?.source_health.issues ?? "-"}</dd>
          <small>{state === "ready" ? (summary?.source_health.issues ? "Needs attention" : "No issues") : "Checking"}</small>
        </div>
      </dl>

      <div className="dashboard-layout">
        <div className="dashboard-primary-column">
          <section className={`dashboard-attention ${attentionClass}`} aria-labelledby="dashboard-attention-title">
            <header>
              <span className="dashboard-section-icon" aria-hidden="true"><ShieldWarning size={20} /></span>
              <div><h2 id="dashboard-attention-title">Needs attention</h2><span>Next operator action</span></div>
            </header>
            {state === "loading" ? (
              <div className="dashboard-state" role="status"><strong>Checking current operations</strong><span>Not an all-clear.</span></div>
            ) : state === "error" ? (
              <div className="dashboard-state is-error" role="alert">
                <strong>Current operations unavailable</strong>
                <span>Open Live Operations or retry this summary.</span>
                <button type="button" onClick={() => void refresh()}>Retry</button>
              </div>
            ) : (
              <div className="dashboard-attention-body">
                <div className="dashboard-attention-summary">
                  <strong>{summary?.attention.source_label ?? summary?.attention.label}</strong>
                  {summary?.attention.source_label && <span>{summary.attention.label}</span>}
                  <ul aria-label="Current status">
                    {summary?.attention.facts.map((fact) => (
                      <li key={fact.id} data-tone={fact.tone}><span>{fact.label}</span><b>{fact.value}</b></li>
                    ))}
                  </ul>
                </div>
                <a href={summary?.attention.href}>{summary?.attention.action_label} <ArrowRight aria-hidden="true" size={17} /></a>
              </div>
            )}
          </section>

          <section className="dashboard-monitoring" aria-labelledby="dashboard-monitoring-title">
            <header>
              <div><h2 id="dashboard-monitoring-title">Monitoring now</h2><span>Grouped before review</span></div>
              <a href="/live">Open Live map <ArrowRight aria-hidden="true" size={16} /></a>
            </header>
            <div className="dashboard-monitoring-list">
              {state === "loading" && [0, 1, 2, 3].map((item) => <div className="dashboard-skeleton-row" key={item} aria-hidden="true" />)}
              {state === "ready" && summary?.monitoring_groups.length === 0 && <p>No monitoring groups returned. Not an all-clear.</p>}
              {summary?.monitoring_groups.slice(0, 4).map((group) => (
                <div key={group.id} data-monitoring-empty={group.is_empty ? "true" : "false"}>
                  <span><Pulse aria-hidden="true" size={17} /><strong>{group.label}</strong></span>
                  <span><b>{group.fresh_count}</b> fresh</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-investigations" aria-labelledby="dashboard-investigations-title">
            <header><div><h2 id="dashboard-investigations-title">Recent investigations</h2><span>Packaged replay cases</span></div><a href="/replay">Open Replay Analyzer</a></header>
            <div>
              {investigations.map((investigation) => (
                <a key={investigation.id} href={investigation.replay_url}>
                  <CheckCircle aria-hidden="true" size={19} />
                  <span><strong>{investigation.title}</strong><small>{investigation.data_label}</small></span>
                  <b>{investigation.truth_label}</b>
                  <ArrowRight aria-hidden="true" size={17} />
                </a>
              ))}
            </div>
          </section>
        </div>

        <aside className="dashboard-side-rail" aria-label="Dashboard details">
          <section aria-labelledby="dashboard-source-health">
            <header><h2 id="dashboard-source-health">Source health</h2><a href="/integration">View sources</a></header>
            <dl>
              <div data-health-state="connected"><dt><span className="dashboard-health-dot" aria-hidden="true" />Connected</dt><dd>{summary?.source_health.connected ?? "-"}</dd></div>
              <div data-health-state="empty"><dt><span className="dashboard-health-dot" aria-hidden="true" />Empty</dt><dd>{summary?.source_health.empty ?? "-"}</dd></div>
              <div data-health-state="issues"><dt><span className="dashboard-health-dot" aria-hidden="true" />Issues</dt><dd>{summary?.source_health.issues ?? "-"}</dd></div>
            </dl>
            {summary?.issue_sources.slice(0, 3).map((source) => <p key={source.id}><strong>{source.name}</strong><span>{source.state}</span></p>)}
          </section>
          <nav aria-label="Dashboard quick links">
            <h2>Quick links</h2>
            <a href="/live">Live Operations <ArrowRight aria-hidden="true" size={16} /></a>
            <a href="/ontology">City Ontology <ArrowRight aria-hidden="true" size={16} /></a>
            <a href="/integration">Data Integration <ArrowRight aria-hidden="true" size={16} /></a>
            <a href="/setup">Setup <ArrowRight aria-hidden="true" size={16} /></a>
          </nav>
        </aside>
      </div>
    </section>
  );
}
