"use client";

import { useMemo, useState } from "react";
import { operationsTargetLabel } from "../../lib/sourceOperations.mjs";

type OntologyConcept = {
  id: string;
  label: string;
  description: string;
  role_count: number;
  source_count: number;
};

type OntologyPath = {
  source_id: string;
  source_name: string;
  concept_id: string;
  concept_label: string;
  ontology_role: string;
  operations_target: string;
  alert_eligible: boolean;
  connector_mode: string;
  runtime_default: string;
  demo_data_status: string;
  data_2026_status: string;
  access_status: string;
  cost: string;
  ontology_evidence_weight: number;
};

type OntologyDashboardModel = {
  summary: {
    sources: number;
    ontology_roles: number;
    concepts: number;
    operator_modules: number;
    real_record_layers: number;
    zero_weight_layers: number;
  };
  concepts: OntologyConcept[];
  guardrails: Record<string, string>;
  paths: OntologyPath[];
};

function readable(value: string) {
  return value.replaceAll("_", " ");
}

function truthLabel(path: OntologyPath) {
  if (path.demo_data_status === "real_replay") return "Real replay";
  if (path.demo_data_status === "mock_preview") return "Mock · zero weight";
  if (path.data_2026_status === "stale_excluded") return "Stale · excluded";
  if (path.data_2026_status === "available_not_ingested") return "Available · not ingested";
  if (path.data_2026_status === "empty_activation") return "Empty activation";
  return "Context / registered";
}

function accessLabel(path: OntologyPath) {
  if (path.cost === "paid") return "Paid API";
  if ([
    "permission_required",
    "publisher_clearance_required",
    "council_input_required",
  ].includes(path.access_status)) return "Permission required";
  if (path.access_status === "key_required") return "API key required";
  if (path.access_status === "public_free") return "Public · free";
  return readable(path.access_status);
}

export default function OntologyDashboard({ model }: { model: OntologyDashboardModel }) {
  const [query, setQuery] = useState("");
  const [concept, setConcept] = useState("all");
  const [target, setTarget] = useState("all");

  const filtered = useMemo(() => model.paths.filter((path) => {
    const matchesConcept = concept === "all" || path.concept_id === concept;
    const matchesTarget = target === "all"
      || path.operations_target === target
      || (target === "alert_centre" && path.alert_eligible);
    const haystack = `${path.source_name} ${path.source_id} ${path.ontology_role} ${path.concept_label}`.toLowerCase();
    return matchesConcept && matchesTarget && haystack.includes(query.trim().toLowerCase());
  }), [concept, model.paths, query, target]);

  return (
    <section className="ontology-dashboard" aria-labelledby="ontology-dashboard-heading">
      <header className="ontology-dashboard-header">
        <div>
          <p className="eyebrow">Wellington City Ontology · current setup</p>
          <h2 id="ontology-dashboard-heading">Ontology Dashboard</h2>
          <p>See where each source fits and which operator screen can use it.</p>
        </div>
        <dl aria-label="Ontology dashboard totals">
          <div><dt>Sources</dt><dd>{model.summary.sources}</dd></div>
          <div><dt>Exact roles</dt><dd>{model.summary.ontology_roles}</dd></div>
          <div><dt>Concepts</dt><dd>{model.summary.concepts}</dd></div>
        </dl>
      </header>

      <div className="ontology-flow" aria-label="Data sources to ontology concepts to operator modules">
        <article>
          <span>01 · Data sources</span>
          <strong>{model.summary.sources} registered contracts</strong>
          <small>Official, context and mock</small>
        </article>
        <b aria-hidden="true">→</b>
        <article>
          <span>02 · Ontology concepts</span>
          <strong>{model.summary.concepts} groups · {model.summary.ontology_roles} roles</strong>
          <small>Typed meaning, place and time</small>
        </article>
        <b aria-hidden="true">→</b>
        <article>
          <span>03 · Operator modules</span>
          <strong>{model.summary.operator_modules} operational views</strong>
          <small>Live · Alerts · Replay</small>
        </article>
      </div>

      <div className="ontology-boundaries" aria-label="Ontology truth boundaries">
        <span><strong>{model.summary.real_record_layers}</strong> real-record layer</span>
        <span><strong>{model.summary.zero_weight_layers}</strong> zero-weight layers</span>
        <span><strong>Rule</strong> Unknown is not open</span>
        <span><strong>Authority</strong> Human review confirms incidents</span>
      </div>

      <div className="ontology-concepts" aria-label="Ontology concept groups">
        <button type="button" aria-pressed={concept === "all"} onClick={() => setConcept("all")}>
          <strong>All concepts</strong><span>{model.summary.sources}</span>
        </button>
        {model.concepts.map((item) => (
          <button
            type="button"
            aria-pressed={concept === item.id}
            onClick={() => setConcept(item.id)}
            key={item.id}
          >
            <strong>{item.label}</strong>
            <small>{item.description}</small>
            <span>{item.source_count}</span>
          </button>
        ))}
      </div>

      <div className="ontology-toolbar">
        <label>
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Source or ontology role"
          />
        </label>
        <label>
          <span>Concept</span>
          <select
            aria-label="Filter ontology pathways by concept"
            value={concept}
            onChange={(event) => setConcept(event.target.value)}
          >
            <option value="all">All concepts</option>
            {model.concepts.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>
          <span>Used in</span>
          <select
            aria-label="Filter ontology pathways by operator module"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          >
            <option value="all">All destinations</option>
            <option value="live_operations">Live Operations</option>
            <option value="alert_centre">Alert Centre</option>
            <option value="replay_analyzer">Replay Analyzer</option>
            <option value="integration_only">Integration only</option>
          </select>
        </label>
        <p aria-live="polite">Showing <strong>{filtered.length}</strong> of {model.summary.sources}</p>
      </div>

      <div className="ontology-path-list" aria-label="Source ontology pathways">
        {filtered.map((path) => (
          <article className="ontology-path" data-ontology-path={path.source_id} key={path.source_id}>
            <div className="ontology-path-source">
              <span>Source</span>
              <strong>{path.source_name}</strong>
              <code>{path.source_id}</code>
            </div>
            <b className="ontology-path-relation"><span aria-hidden="true">→</span><small>typed as</small></b>
            <div className="ontology-path-role">
              <span>{path.concept_label}</span>
              <strong>{readable(path.ontology_role)}</strong>
            </div>
            <b className="ontology-path-relation"><span aria-hidden="true">→</span><small>used in</small></b>
            <div className="ontology-path-target">
              <span>Destination</span>
              <strong>{operationsTargetLabel(path.operations_target)}</strong>
              {path.alert_eligible && <small>Also eligible for Alert Centre review</small>}
            </div>
            <footer>
              <span className={`ontology-tag truth-${path.demo_data_status}`}>{truthLabel(path)}</span>
              <span className="ontology-tag">{accessLabel(path)}</span>
              <span className="ontology-tag">Ontology weight {path.ontology_evidence_weight}</span>
            </footer>
          </article>
        ))}
      </div>
      {!filtered.length && <p className="ops-state">No ontology pathways match these filters.</p>}
    </section>
  );
}
