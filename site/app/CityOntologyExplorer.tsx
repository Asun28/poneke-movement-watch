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
