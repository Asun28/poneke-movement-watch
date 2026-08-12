"use client";

import { useMemo, useState } from "react";
import { CaretDown, Database, MagnifyingGlass, Plus, SlidersHorizontal } from "@phosphor-icons/react";
import { operationsTargetLabel } from "../../lib/sourceOperations.mjs";

type Contract = {
  source_id: string;
  name: string;
  role: string;
  connector_mode: string;
  operations_target: string;
  runtime_default: string;
  access: {
    status: string;
    cost: string;
    credentials_required: boolean;
    permission_required: boolean;
  };
  raw_format: string;
  endpoint: string | null;
  alert_eligible: boolean;
  evidence_weight: number;
  freshness_seconds: number | null;
  licence: string;
  truth: { demo_data_status: string; data_2026_status: string };
  notes: string | null;
};

function connectorLabel(contract: Contract) {
  if (contract.connector_mode === "live") return "Connected live adapter";
  if (contract.connector_mode === "mock") return "Mock · zero evidence weight";
  if (contract.connector_mode === "batch") return "Batch replay only";
  if (contract.connector_mode === "stale") return "Stale · excluded";
  return "Context / registered";
}

function connectorShortLabel(contract: Contract) {
  if (contract.connector_mode === "live") return "LIVE";
  if (contract.connector_mode === "mock") return "MOCK";
  if (contract.connector_mode === "batch") return "REPLAY";
  if (contract.connector_mode === "stale") return "STALE";
  return "REGISTERED";
}

function accessLabel(contract: Contract) {
  if (contract.access.cost === "paid") return "Paid · API key + billing";
  if (contract.access.credentials_required) return "API key required";
  if (contract.access.permission_required) return "Permission / clearance required";
  if (contract.access.cost === "free") return "Public · free";
  return contract.access.status.replaceAll("_", " ");
}

export default function IntegrationRegistry({ contracts }: { contracts: Contract[] }) {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState("all");
  const [selectedId, setSelectedId] = useState(contracts[0]?.source_id ?? "");
  const filtered = useMemo(() => contracts.filter((contract) => {
    const matchesTarget = target === "all" || contract.operations_target === target;
    const haystack = `${contract.name} ${contract.source_id} ${contract.role} ${operationsTargetLabel(contract.operations_target)}`.toLowerCase();
    return matchesTarget && haystack.includes(query.toLowerCase());
  }), [contracts, target, query]);
  const selected = filtered.find((contract) => contract.source_id === selectedId) ?? filtered[0] ?? null;
  const summary = useMemo(() => ({
    total: contracts.length,
    live: contracts.filter((contract) => contract.connector_mode === "live").length,
    replay: contracts.filter((contract) => contract.connector_mode === "batch").length,
    mock: contracts.filter((contract) => contract.connector_mode === "mock").length,
    registered: contracts.filter((contract) => ["registered", "context"].includes(contract.connector_mode)).length,
    stale: contracts.filter((contract) => contract.connector_mode === "stale").length,
  }), [contracts]);
  const summaryItems = [
    ["live", "Live", summary.live],
    ["replay", "Replay", summary.replay],
    ["mock", "Mock", summary.mock],
    ["registered", "Registered", summary.registered],
    ["stale", "Stale", summary.stale],
  ] as const;

  return (
    <section
      className="integration-registry"
      aria-labelledby="integration-registry-heading"
      data-operator-workflow="source-master-detail"
    >
      <div className="integration-toolbar">
        <div className="integration-heading">
          <Database size={20} weight="duotone" aria-hidden="true" />
          <h2 id="integration-registry-heading">{`${summary.total} source contracts`}</h2>
          <dl
            className="integration-summary"
            aria-label={`Source contract summary: ${summary.total} total`}
            data-source-summary-total={summary.total}
          >
            {summaryItems.map(([kind, label, count]) => (
              <div key={kind} data-source-summary-kind={kind}><dt>{label}</dt><dd>{count}</dd></div>
            ))}
          </dl>
        </div>
        <div className="integration-filters">
          <label>
            <span><MagnifyingGlass size={14} aria-hidden="true" /> Search</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, role or ID" />
          </label>
          <label>
            <span>Used in</span>
            <select
              aria-label="Filter by operator module"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            >
              <option value="all">All sources</option>
              <option value="live_operations">Live Operations</option>
              <option value="replay_analyzer">Replay Analyzer</option>
              <option value="integration_only">Integration only</option>
            </select>
          </label>
          <a className="integration-setup-link" href="/setup"><Plus size={16} aria-hidden="true" /> Add source</a>
        </div>
      </div>

      <div className="integration-master-detail">
        <aside className="integration-source-list" aria-label="Source list">
          <header><strong>{filtered.length} sources</strong><span>{target === "all" ? "All modules" : operationsTargetLabel(target)}</span></header>
          <div>
            {filtered.map((contract) => (
              <button
                type="button"
                key={contract.source_id}
                data-source-list-item={contract.source_id}
                data-source-contract={contract.source_id}
                aria-pressed={selected?.source_id === contract.source_id}
                onClick={() => setSelectedId(contract.source_id)}
              >
                <span
                  className={`source-mode-dot state-${contract.runtime_default}`}
                  data-runtime-state={contract.runtime_default}
                  aria-label={`Runtime default: ${contract.runtime_default.replaceAll("_", " ")}`}
                />
                <span className="integration-source-name">
                  <strong>{contract.name}</strong>
                  <small>{contract.source_id} · {contract.operations_target === "integration_only" ? operationsTargetLabel(contract.operations_target) : `${operationsTargetLabel(contract.operations_target)} source`}</small>
                </span>
                <span
                  className={`contract-mode mode-${contract.connector_mode}`}
                  data-connector-kind={contract.connector_mode}
                  title={connectorLabel(contract)}
                  aria-label={`Connector: ${connectorLabel(contract)}`}
                >
                  {connectorShortLabel(contract)}
                </span>
              </button>
            ))}
          </div>
          {!filtered.length && <p className="ops-state">No matching sources.</p>}
        </aside>

        <article className="integration-source-detail" aria-label="Selected source details" aria-live="polite">
          {selected ? (
            <>
              <header>
                <div><span>Source contract</span><h3>{selected.name}</h3><code>{selected.source_id}</code></div>
                <div className="integration-detail-actions">
                  <div className="integration-detail-status">
                    <span className={`contract-mode mode-${selected.connector_mode}`}>{connectorLabel(selected)}</span>
                    <span className={`runtime-state state-${selected.runtime_default}`}>{selected.runtime_default.replaceAll("_", " ")}</span>
                  </div>
                  <a className="integration-configure-source" data-detail-action="configure-source" href="/setup">
                    <SlidersHorizontal size={15} aria-hidden="true" />
                    Configure source
                  </a>
                </div>
              </header>
              <dl className="integration-detail-grid">
                <div data-detail-label="Used in"><dt>Used in</dt><dd>{selected.operations_target === "integration_only" ? operationsTargetLabel(selected.operations_target) : `${operationsTargetLabel(selected.operations_target)} source`}</dd></div>
                <div data-detail-label="Ontology role"><dt>Ontology role</dt><dd>{selected.role.replaceAll("_", " ")}</dd></div>
                <div data-detail-label="Source truth"><dt>Source truth</dt><dd><strong>{selected.truth.data_2026_status.replaceAll("_", " ")}</strong><span>Evidence weight {selected.evidence_weight}</span></dd></div>
                <div data-detail-label="Access &amp; cost"><dt>Access &amp; cost</dt><dd><strong>{accessLabel(selected)}</strong><span>{selected.licence === "not_stated" ? "Licence not stated" : selected.licence}</span></dd></div>
                <div data-detail-label="Runtime health"><dt>Runtime health</dt><dd><strong data-runtime-value={selected.runtime_default} className={`runtime-value state-${selected.runtime_default}`}>{selected.runtime_default.replaceAll("_", " ")}</strong><span>{selected.freshness_seconds ? `${selected.freshness_seconds}s freshness target` : "No live freshness target"}</span></dd></div>
                <div data-detail-label="Provider format"><dt>Provider format</dt><dd><strong>{selected.raw_format}</strong><span>{selected.endpoint ? "Official endpoint registered" : "No public endpoint called"}</span></dd></div>
              </dl>
              {(selected.notes || selected.endpoint) && (
                <details className="integration-technical-detail">
                  <summary>
                    <span>Technical details</span>
                    <CaretDown size={16} data-disclosure-caret="technical-details" aria-hidden="true" />
                  </summary>
                  {selected.notes && <p>{selected.notes}</p>}
                  {selected.endpoint && <code>{selected.endpoint}</code>}
                </details>
              )}
              <footer>
                <span>{selected.alert_eligible ? "Eligible for human review" : "Not alert eligible"}</span>
              </footer>
            </>
          ) : <div className="integration-empty-detail"><strong>No source selected</strong><span>Change the filters to view a contract.</span></div>}
        </article>
      </div>
    </section>
  );
}
