import cityData from "../public/cop/v3/city-ontology.json";

type CityNode = {
  id: string;
  type: string;
  subtype?: string;
  label: string;
  value?: string;
  start?: string;
  end_exclusive?: string;
  transport_class?: string;
  direction?: string;
  source_id?: string;
  ontology_role?: string;
  access_status?: string;
  evidence_weight?: number;
  data_2026?: {
    status: string;
    active: boolean;
    record_state: string;
    verified_at: string;
  };
  can_support: string[];
  cannot_assert: string[];
};

const graph = cityData as typeof cityData & { nodes: CityNode[] };

function findNode(type: CityNode["type"]) {
  const node = graph.nodes.find((candidate) => candidate.type === type);
  if (!node) throw new Error(`City ontology requires one ${type} node`);
  return node;
}

const observation = findNode("Observation");
const infrastructure = findNode("InfrastructureAsset");
const place = findNode("Place");
const timeWindow = findNode("TimeWindow");
const movementState = findNode("MovementState");
const potentialImpact = findNode("PotentialImpact");
const accessState = findNode("AccessState");
const dataLayers = graph.nodes.filter((node) => node.type === "DataLayer");

const layerStatusLabels: Record<string, string> = {
  real_records: "Real 2026 records",
  available_not_ingested: "Feed available · not in replay",
  available_context: "2026 context available",
  planned_context: "Static or planned context",
  static_context: "Static or planned context",
  empty_activation: "Empty activation feed",
  credentials_required: "Credentials required",
  input_required: "Council input required",
  terms_review: "Terms review",
  restricted_not_ingested: "Restricted · not ingested",
  paid_mock_only: "Paid · mock only",
  stale_excluded: "Stale · excluded",
};

function SemanticNode({ kind, node }: { kind: string; node: CityNode }) {
  return (
    <div className={`semantic-node node-${node.type.toLowerCase()}`}>
      <span>{kind}</span>
      <strong>{node.label}</strong>
      <small>{node.can_support[0]}</small>
    </div>
  );
}

function Relation({ children }: { children: string }) {
  return (
    <span className="semantic-relation">
      <b aria-hidden="true">→</b>
      <em>{children}</em>
    </span>
  );
}

export default function CityOntologyExplorer() {
  return (
    <section className="city-ontology" aria-labelledby="city-ontology-heading">
      <header className="city-ontology-header">
        <div>
          <p className="eyebrow">Wellington City Ontology · v3</p>
          <h2 id="city-ontology-heading">City ontology explorer</h2>
          <p>
            Follow one real movement signal through its place, infrastructure,
            time and possible effect. Every connector is typed; none of them turns
            a movement change into a confirmed incident.
          </p>
        </div>
        <a href="/cop/v3/city-ontology.json">
          <span>Machine-readable graph</span>
          <code>/cop/v3/city-ontology.json</code>
        </a>
      </header>

      <div className="semantic-rails" aria-label="Typed city ontology relationships">
        <div className="semantic-rail">
          <SemanticNode kind="Observation" node={observation} />
          <Relation>measured by</Relation>
          <SemanticNode kind="Infrastructure" node={infrastructure} />
          <Relation>located on</Relation>
          <SemanticNode kind="Place" node={place} />
        </div>
        <div className="semantic-rail">
          <SemanticNode kind="Observation" node={observation} />
          <Relation>observed during</Relation>
          <SemanticNode kind="Time window" node={timeWindow} />
          <Relation>classified as</Relation>
          <SemanticNode kind="Movement state" node={movementState} />
        </div>
        <div className="semantic-rail is-inference">
          <SemanticNode kind="Movement state" node={movementState} />
          <Relation>may indicate</Relation>
          <SemanticNode kind="Potential impact" node={potentialImpact} />
          <Relation>may affect</Relation>
          <SemanticNode kind="Place" node={place} />
        </div>
      </div>

      <section className="data-layer-register" aria-labelledby="data-layer-register-heading">
        <header>
          <div>
            <p className="eyebrow">Source → role → 2026 state</p>
            <h3 id="data-layer-register-heading">2026 data-layer register</h3>
            <p>
              All 33 contracts sit inside the ontology with their access and time
              state. Zero evidence until a record is time-aligned, entity-resolved
              and permitted for this application.
            </p>
          </div>
          <dl aria-label="2026 ontology layer totals">
            <div><dt>Layers</dt><dd>{dataLayers.length}</dd></div>
            <div><dt>Active context</dt><dd>{dataLayers.filter((layer) => layer.data_2026?.active).length}</dd></div>
            <div><dt>Real replay</dt><dd>{dataLayers.filter((layer) => layer.data_2026?.status === "real_records").length}</dd></div>
          </dl>
        </header>
        <div className="data-layer-list" aria-label={`${dataLayers.length} typed 2026 data layers`}>
          {dataLayers.map((layer) => (
            <article
              className={`data-layer-row status-${layer.data_2026?.status ?? "unknown"}`}
              data-ontology-layer={layer.source_id}
              key={layer.id}
            >
              <div>
                <span>{layer.ontology_role?.replaceAll("_", " ")}</span>
                <strong>{layer.label}</strong>
              </div>
              <em>{layerStatusLabels[layer.data_2026?.status ?? ""] ?? "State unknown"}</em>
              <small>{layer.access_status?.replaceAll("_", " ")} · weight {layer.evidence_weight ?? 0}</small>
            </article>
          ))}
        </div>
      </section>

      <div className="ontology-guardrails">
        <article>
          <span>Potential impact</span>
          <strong>Inference only</strong>
          <p>{potentialImpact.cannot_assert[0]}.</p>
        </article>
        <article className="access-unknown">
          <span>Access state</span>
          <strong>{accessState.value}</strong>
          <p>Unknown is not open. A time-aligned authoritative record is required.</p>
        </article>
        <article>
          <span>Human confirmation</span>
          <strong>None recorded</strong>
          <p>Only authorised review can create a decision or confirmed fact.</p>
        </article>
      </div>
    </section>
  );
}
