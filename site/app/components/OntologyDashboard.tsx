"use client";

import { useMemo, useState } from "react";
import { buildOntologyEgoGraph, selectOntologyGraphNode } from "../../lib/dataIntegration.mjs";
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

type OntologyGraphNode = {
  id: string;
  kind: "source" | "concept" | "destination" | "authority";
  label: string;
  description?: string;
  source_id?: string;
  ontology_role?: string;
  evidence_weight?: number;
  source_count?: number;
};

type OntologyGraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: string;
  label: string;
};

type OntologyEgoGraph = {
  nodes: OntologyGraphNode[];
  edges: OntologyGraphEdge[];
};

type OntologyGraphSelection = {
  node: OntologyGraphNode;
  edges: OntologyGraphEdge[];
  neighbors: OntologyGraphNode[];
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
  const defaultGraphConcept = model.concepts[0]?.id ?? "";
  const defaultGraphSource = model.paths.find((path) => path.concept_id === defaultGraphConcept)?.source_id;
  const [query, setQuery] = useState("");
  const [concept, setConcept] = useState("all");
  const [target, setTarget] = useState("all");
  const [pathsOpen, setPathsOpen] = useState(false);
  const [view, setView] = useState<"chain" | "graph">("chain");
  const [graphConcept, setGraphConcept] = useState(defaultGraphConcept);
  const [graphNodeId, setGraphNodeId] = useState(
    defaultGraphSource ? `source:${defaultGraphSource}` : `concept:${defaultGraphConcept}`,
  );

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

  const graph = useMemo(
    () => buildOntologyEgoGraph(model, graphConcept) as OntologyEgoGraph,
    [graphConcept, model],
  );
  const graphSelection = useMemo(
    () => selectOntologyGraphNode(graph, graphNodeId) as OntologyGraphSelection | null,
    [graph, graphNodeId],
  );
  const selectedSourcePath = graphSelection?.node.kind === "source"
    ? model.paths.find((path) => path.source_id === graphSelection.node.source_id)
    : null;

  function chooseConcept(next: string) {
    setConcept(next);
    setPathsOpen(true);
  }

  function chooseTarget(next: string) {
    setTarget(next);
    setPathsOpen(true);
  }

  function chooseGraphConcept(next: string) {
    setGraphConcept(next);
    const firstSource = model.paths.find((path) => path.concept_id === next)?.source_id;
    setGraphNodeId(firstSource ? `source:${firstSource}` : `concept:${next}`);
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

      <div className="ontology-view-switch" role="group" aria-label="Choose ontology view">
        <button type="button" aria-pressed={view === "chain"} onClick={() => setView("chain")}>Operational chain</button>
        <button type="button" aria-pressed={view === "graph"} onClick={() => setView("graph")}>Knowledge graph</button>
      </div>
      <p className="ontology-view-note">Operational chain remains the default. The graph shows the same explicit contracts from another angle.</p>

      <div
        className="ontology-hierarchy"
        aria-label="Top-to-bottom city ontology hierarchy"
        data-ontology-view="chain"
        hidden={view !== "chain"}
      >
        <section className="ontology-level" data-ontology-level="sources" aria-labelledby="ontology-level-sources">
          <header className="ontology-level-heading">
            <span>01</span>
            <div><h3 id="ontology-level-sources">Data sources &amp; access</h3><p>What the city can receive, and whether it is real, mock, gated or paid.</p></div>
          </header>
          <div className="ontology-source-summary">
            <div><strong>{model.summary.sources}</strong><span>Source contracts</span></div>
            <div><strong>{model.summary.real_record_layers}</strong><span>Real-record layer</span></div>
            <div><strong>{model.summary.zero_weight_layers}</strong><span>Zero-weight layers</span></div>
          </div>
        </section>

        <div className="ontology-hierarchy-connector" data-hierarchy-connector="source-to-alignment" aria-hidden="true">
          <span>↓</span><small>normalize and align</small>
        </div>

        <section className="ontology-level" data-ontology-level="alignment" aria-labelledby="ontology-level-alignment">
          <header className="ontology-level-heading">
            <span>02</span>
            <div><h3 id="ontology-level-alignment">Normalize, align time &amp; place</h3><p>Make unlike records comparable without changing their source truth.</p></div>
          </header>
          <div className="ontology-processing-grid" aria-label="Normalization and alignment steps">
            <article><span>Schema</span><strong>Common fields &amp; units</strong><small>Keep the original value and provenance.</small></article>
            <article><span>Time</span><strong>Observed · available · valid</strong><small>Prevent future-data leakage.</small></article>
            <article><span>Place</span><strong>WGS84 · area · asset</strong><small>Resolve records to the same city location.</small></article>
          </div>
        </section>

        <div className="ontology-hierarchy-connector" data-hierarchy-connector="alignment-to-ontology" aria-hidden="true">
          <span>↓</span><small>type with evidence rules</small>
        </div>

        <section className="ontology-level" data-ontology-level="concepts" aria-labelledby="ontology-level-concepts">
          <header className="ontology-level-heading">
            <span>03</span>
            <div><h3 id="ontology-level-concepts">Ontology entities, relations &amp; evidence rules</h3><p>Give aligned records a shared meaning while preserving all {model.summary.ontology_roles} exact roles.</p></div>
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

        <div className="ontology-hierarchy-connector" data-hierarchy-connector="ontology-to-corroboration" aria-hidden="true">
          <span>↓</span><small>detect and corroborate</small>
        </div>

        <section className="ontology-level" data-ontology-level="corroboration" aria-labelledby="ontology-level-corroboration">
          <header className="ontology-level-heading">
            <span>04</span>
            <div><h3 id="ontology-level-corroboration">Anomaly candidates &amp; multi-source corroboration</h3><p>Compare the same time and place, then keep supporting, contradicting and missing evidence separate.</p></div>
          </header>
          <ol className="ontology-corroboration-flow" aria-label="Candidate corroboration sequence">
            <li><span>1</span><strong>Detect change</strong><small>One source creates a candidate.</small></li>
            <li><span>2</span><strong>Match context</strong><small>Same time, place and affected asset.</small></li>
            <li><span>3</span><strong>Compare evidence</strong><small>Supporting · contradicting · missing.</small></li>
            <li><span>4</span><strong>Prompt review</strong><small>Confidence stays explainable.</small></li>
          </ol>
          <p className="ontology-stage-note"><strong>Candidate, not incident</strong><span>No single score or source confirms disruption.</span></p>
        </section>

        <div className="ontology-hierarchy-connector" data-hierarchy-connector="corroboration-to-destination" aria-hidden="true">
          <span>↓</span><small>route by operator purpose</small>
        </div>

        <section className="ontology-level" data-ontology-level="destinations" aria-labelledby="ontology-level-destinations">
          <header className="ontology-level-heading">
            <span>05</span>
            <div><h3 id="ontology-level-destinations">Live · Alert Centre · Replay</h3><p>Use the same evidence chain for current awareness, review and historical investigation.</p></div>
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

        <div className="ontology-hierarchy-connector" data-hierarchy-connector="destination-to-decision" aria-hidden="true">
          <span>↓</span><small>escalate to human authority</small>
        </div>

        <section className="ontology-level ontology-decision-level" data-ontology-level="decision" aria-labelledby="ontology-level-decision">
          <header className="ontology-level-heading">
            <span>06</span>
            <div><h3 id="ontology-level-decision">Human confirmation &amp; response</h3><p>Staff decide whether to investigate, confirm an incident and prepare an authorised response.</p></div>
          </header>
          <div className="ontology-decision-grid" aria-label="Human decision stages">
            <article><span>Review</span><strong>Investigate the case</strong><small>Check evidence, unknowns and contradictions.</small></article>
            <article><span>Confirm</span><strong>Set incident status</strong><small>Record owner, reason and next review.</small></article>
            <article><span>Act</span><strong>Approve the response</strong><small>External actions retain their own authority.</small></article>
          </div>
          <p className="ontology-stage-note is-authority"><strong>Human decision required</strong><span>Models and ontology never issue a public warning.</span></p>
        </section>
      </div>

      <section
        className="ontology-graph-view"
        data-ontology-view="graph"
        hidden={view !== "graph"}
        aria-labelledby="ontology-graph-heading"
      >
        <header className="ontology-graph-header">
          <div>
            <p className="eyebrow">Focused neighbourhood</p>
            <h3 id="ontology-graph-heading">Knowledge graph</h3>
            <p>Select a node to reveal only its direct, registered relationships.</p>
          </div>
          <span>Explicit relationships only</span>
        </header>

        <div className="ontology-graph-concepts" role="group" aria-label="Choose graph focus concept">
          {model.concepts.map((item) => (
            <button
              type="button"
              aria-pressed={graphConcept === item.id}
              onClick={() => chooseGraphConcept(item.id)}
              key={item.id}
            >
              <strong>{item.label}</strong>
              <span>{item.source_count}</span>
            </button>
          ))}
        </div>

        <div className="ontology-graph-workspace" data-ontology-graph="ego">
          <div className="ontology-ego-canvas" aria-label="Selected node and direct ontology neighbours">
            <div className="ontology-graph-legend" aria-label="Knowledge graph node types">
              <span data-kind="source">Source</span>
              <span data-kind="concept">Concept</span>
              <span data-kind="destination">Operator module</span>
              <span data-kind="authority">Human authority</span>
            </div>

            {graphSelection && (
              <>
                <article
                  className={`ontology-ego-focus kind-${graphSelection.node.kind}`}
                  data-graph-node-kind={graphSelection.node.kind}
                >
                  <span>{readable(graphSelection.node.kind)}</span>
                  <strong>{graphSelection.node.label}</strong>
                  <small>{graphSelection.node.description ?? graphSelection.node.ontology_role?.replaceAll("_", " ")}</small>
                </article>
                <div className="ontology-ego-stem" aria-hidden="true"><span>direct relations</span></div>
                <div className="ontology-ego-neighbours" aria-label="Direct neighbours">
                  {graphSelection.neighbors.map((node) => {
                    const edge = graphSelection.edges.find((item) => (
                      item.source === node.id || item.target === node.id
                    ));
                    const direction = edge?.source === graphSelection.node.id ? "outgoing" : "incoming";
                    return (
                      <button
                        type="button"
                        className={`ontology-ego-node kind-${node.kind}`}
                        data-graph-node-kind={node.kind}
                        data-graph-edge-role={edge?.relation}
                        aria-label={`${node.label}; ${edge?.label}; ${direction} relationship`}
                        aria-pressed={graphNodeId === node.id}
                        aria-controls="ontology-graph-inspector"
                        onClick={() => setGraphNodeId(node.id)}
                        key={node.id}
                      >
                        <span>{edge?.label}</span>
                        <strong>{node.label}</strong>
                        <small>{readable(node.kind)}</small>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <aside className="ontology-graph-inspector" id="ontology-graph-inspector" aria-live="polite">
            <header>
              <span>Node details</span>
              <h4>{graphSelection?.node.label}</h4>
              <small>{graphSelection?.node.id}</small>
            </header>

            <section>
              <h5>Direct neighbours</h5>
              <ul>
                {graphSelection?.edges.map((edge) => {
                  const neighborId = edge.source === graphSelection.node.id ? edge.target : edge.source;
                  const neighbor = graph.nodes.find((node) => node.id === neighborId);
                  return (
                    <li key={edge.id}>
                      <span>{edge.label}</span>
                      <strong>{neighbor?.label}</strong>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h5>Source truth &amp; provenance</h5>
              {selectedSourcePath ? (
                <div className="ontology-graph-truth">
                  <span>{truthLabel(selectedSourcePath)}</span>
                  <span>{accessLabel(selectedSourcePath)}</span>
                  <span>Ontology weight {selectedSourcePath.ontology_evidence_weight}</span>
                </div>
              ) : (
                <p>Select a source node to inspect its truth, access and evidence weight.</p>
              )}
            </section>

            <p className="ontology-graph-guardrail"><strong>Graph boundary</strong> Position and distance never create evidence.</p>
          </aside>
        </div>
      </section>

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
