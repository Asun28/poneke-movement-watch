"use client";

import { useMemo, useState } from "react";

type Contract = {
  source_id: string;
  name: string;
  role: string;
  connector_mode: string;
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

function accessLabel(contract: Contract) {
  if (contract.access.cost === "paid") return "Paid · API key + billing";
  if (contract.access.credentials_required) return "API key required";
  if (contract.access.permission_required) return "Permission / clearance required";
  if (contract.access.cost === "free") return "Public · free";
  return contract.access.status.replaceAll("_", " ");
}

export default function IntegrationRegistry({ contracts }: { contracts: Contract[] }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const filtered = useMemo(() => contracts.filter((contract) => {
    const matchesMode = mode === "all" || contract.connector_mode === mode;
    const haystack = `${contract.name} ${contract.source_id} ${contract.role}`.toLowerCase();
    return matchesMode && haystack.includes(query.toLowerCase());
  }), [contracts, mode, query]);

  return (
    <section className="integration-registry" aria-labelledby="integration-registry-heading">
      <div className="integration-toolbar">
        <div>
          <p className="eyebrow">Provider inventory</p>
          <h2 id="integration-registry-heading">33 source contracts</h2>
          <p>One normalized boundary for Live, Alerts, Replay and future Council modules.</p>
        </div>
        <div className="integration-filters">
          <label>
            <span>Search sources</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, role or ID" />
          </label>
          <label>
            <span>Connector mode</span>
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="all">All modes</option>
              <option value="live">Live</option>
              <option value="mock">Mock / gated</option>
              <option value="batch">Batch</option>
              <option value="context">Context</option>
              <option value="stale">Stale</option>
            </select>
          </label>
          <a className="integration-setup-link" href="/setup">Add or connect</a>
        </div>
      </div>

      <div className="integration-table-wrap">
        <table className="integration-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Ontology role</th>
              <th>Source truth</th>
              <th>Access &amp; cost</th>
              <th>Runtime health</th>
              <th>Provider format</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contract) => (
              <tr key={contract.source_id} data-source-contract={contract.source_id}>
                <td>
                  <strong>{contract.name}</strong>
                  <code>{contract.source_id}</code>
                </td>
                <td>{contract.role.replaceAll("_", " ")}</td>
                <td>
                  <span className={`contract-mode mode-${contract.connector_mode}`}>{connectorLabel(contract)}</span>
                  <small>{contract.truth.data_2026_status.replaceAll("_", " ")}</small>
                </td>
                <td>
                  <strong>{accessLabel(contract)}</strong>
                  <small>{contract.licence === "not_stated" ? "Licence not stated" : contract.licence}</small>
                </td>
                <td>
                  <span className={`runtime-state state-${contract.runtime_default}`}>{contract.runtime_default.replaceAll("_", " ")}</span>
                  <small>{contract.freshness_seconds ? `${contract.freshness_seconds}s freshness target` : "No live freshness target"}</small>
                </td>
                <td>
                  <strong>{contract.raw_format}</strong>
                  <small>{contract.endpoint ? "Official endpoint registered" : "No public endpoint called"}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && <p className="ops-state">No source contracts match these filters.</p>}
    </section>
  );
}
