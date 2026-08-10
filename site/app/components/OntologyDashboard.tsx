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
  const [pathsOpen, setPathsOpen] = useState(false);

  const filtered = useMemo(() => model.paths.filter((path) => {
    const matchesConcept = concept === "all" || path.concept_id === concept;
    const matchesTarget = target === "all"
      || path.operations_target === target
      || (target === "alert_centre" && path.alert_eligible);
    const haystack = `${path.source_name} ${path.source_id} ${path.ontology_role} ${path.concept_label}`.toLowerCase();
    return matchesConcept && matchesTarget && haystack.includes(query.trim().toLowerCase());
  }), [concept, model.paths, query, target]);

  const destinations = [
    {
      id: "live_operations",
      label: "Live Operations",
      description: "Current permitted records",
      count: model.paths.filter((path) => path.operations_target === "live_operations").length,
    },
    {
      id: "alert_centre",
      label: "Alert Centre",
      description: "Review-eligible candidates",
      count: model.paths.filter((path) => path.alert_eligible).length,
    },
    {
      id: "replay_analyzer",
      label: "Replay Analyzer",
      description: "Packaged historical records",
      count: model.paths.filter((path) => path.operations_target === "replay_analyzer").length,
    },
    {
      id: "integration_only",
      label: "Integration only",
      description: "Context, gated or mock",
      count: model.paths.filter((path) => path.operations_target === "integration_only").length,
    },
  ];

  function chooseConcept(next: string) {
    setConcept(next);
    setPathsOpen(true);
  }

  function chooseTarget(next: string) {
    setTarget(next);
    setPathsOpen(true);
  }

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

      <div className="ontology-hierarchy" aria-label="Top-to-bottom city ontology hierarchy">
        <section className="ontology-level" data-ontology-level="sources" aria-labelledby="ontology-level-sources">
          <header className="ontology-level-heading">
            <span>01</span>
            <div><h3 id="ontology-level-sources">Data sources</h3><p>What the city can currently register or receive.</p></div>
          </header>
          <div className="ontology-source-summary">
            <div><strong>{model.summary.sources}</strong><span>Source contracts</span></div>
            <div><strong>{model.summary.real_record_layers}</strong><span>Real-record layer</span></div>
            <div><strong>{model.summary.zero_weight_layers}</strong><span>Zero-weight layers</span></div>
          </div>
        </section>

        <div className="ontology-hierarchy-connector" data-hierarchy-connector="source-to-concept" aria-hidden="true">
          <span>↓</span><small>joined by source ID</small>
        </div>

        <section className="ontology-level" data-ontology-level="concepts" aria-labelledby="ontology-level-concepts">
          <header className="ontology-level-heading">
            <span>02</span>
            <div><h3 id="ontology-level-concepts">Ontology concepts</h3><p>Five readable groups preserve all {model.summary.ontology_roles} exact roles.</p></div>
          </header>
          <div className="ontology-concepts" aria-label="Ontology concept groups">
            <button type="button" aria-pressed={concept === "all"} onClick={() => chooseConcept("all")}>
              <strong>All concepts</strong><span>{model.summary.sources}</span>
            </button>
            {model.concepts.map((item) => (
              <button
                type="button"
                aria-pressed={concept === item.id}
                onClick={() => chooseConcept(item.id)}
                key={item.id}
              >
                <strong>{item.label}</strong>
                <small>{item.description}</small>
                <span>{item.source_count}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="ontology-hierarchy-connector" data-hierarchy-connector="concept-to-relation" aria-hidden="true">
          <span>↓</span><small>typed relationships</small>
        </div>

        <section className="ontology-level" data-ontology-level="relations" aria-labelledby="ontology-level-relations">
          <header className="ontology-level-heading">
            <span>03</span>
            <div><h3 id="ontology-level-relations">Relations &amp; rules</h3><p>Relationships explain what a record can—and cannot—mean.</p></div>
          </header>
          <div className="ontology-relation-branches">
            <article>
              <span>Observed city state</span>
              <ol>
                <li><strong>Observation</strong></li>
                <li className="is-relation">measured by</li>
                <li><strong>Infrastructure asset</strong></li>
                <li className="is-relation">located on</li>
                <li><strong>Place</strong></li>
              </ol>
            </article>
            <article>
              <span>Investigation path</span>
              <ol>
                <li><strong>Movement state</strong></li>
                <li className="is-relation">may indicate</li>
                <li><strong>Potential impact</strong></li>
                <li className="is-relation">may affect</li>
                <li><strong>Place</strong></li>
              </ol>
            </article>
          </div>
          <div className="ontology-boundaries" aria-label="Ontology truth boundaries">
            <span><strong>Rule</strong> Unknown is not open</span>
            <span><strong>Impact</strong> Inference only</span>
            <span><strong>Mock</strong> Zero evidence</span>
            <span><strong>Authority</strong> Human review confirms incidents</span>
          </div>
        </section>

        <div className="ontology-hierarchy-connector" data-hierarchy-connector="relation-to-destination" aria-hidden="true">
          <span>↓</span><small>routed by source contract</small>
        </div>

        <section className="ontology-level" data-ontology-level="destinations" aria-labelledby="ontology-level-destinations">
          <header className="ontology-level-heading">
            <span>04</span>
            <div><h3 id="ontology-level-destinations">Operator modules</h3><p>Three operational views; gated context stays in Integration.</p></div>
          </header>
          <div className="ontology-destinations" aria-label="Ontology operator destinations">
            {destinations.map((item) => (
              <button
                type="button"
                aria-pressed={target === item.id}
                onClick={() => chooseTarget(item.id)}
                key={item.id}
              >
                <span>{item.count} sources</span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
        </section>
      </div>

      <details
        className="ontology-pathways"
        open={pathsOpen}
        onToggle={(event) => setPathsOpen(event.currentTarget.open)}
      >
        <summary>
          <div><span>Source-level audit</span><strong>{`Explore ${model.summary.sources} source pathways`}</strong></div>
          <small>Showing {filtered.length}</small>
        </summary>
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
              <b className="ontology-path-relation"><span aria-hidden="true">↓</span><small>typed as</small></b>
              <div className="ontology-path-role">
                <span>{path.concept_label}</span>
                <strong>{readable(path.ontology_role)}</strong>
              </div>
              <b className="ontology-path-relation"><span aria-hidden="true">↓</span><small>used in</small></b>
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
      </details>
    </section>
  );
}
