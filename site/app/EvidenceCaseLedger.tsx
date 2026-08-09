import graphData from "../public/cop/v2/evidence-graph.json";
import registryData from "../public/cop/v2/source-registry.json";

type EvidenceItem = {
  observation_id: string | null;
  source_id: string;
  role: "supporting" | "contradicting" | "neutral" | "missing";
  units: number;
  basis: string;
};

const graph = graphData as typeof graphData & {
  hypotheses: Array<{ evidence: EvidenceItem[] }>;
};
const hypothesis = graph.hypotheses[0];
const evidence = hypothesis.evidence;
const sourceNames = new Map(
  registryData.sources.map((source) => [source.id, source.name]),
);

function sourceName(sourceId: string) {
  return sourceNames.get(sourceId) ?? sourceId;
}

export default function EvidenceCaseLedger() {
  const supporting = evidence.filter((item) => item.role === "supporting" && item.units > 0);
  const contradicting = evidence.filter((item) => item.role === "contradicting");
  const missing = evidence.filter((item) => item.role === "missing");

  return (
    <section className="case-ledger" aria-labelledby="case-ledger-heading">
      <header className="case-ledger-header">
        <div>
          <p className="eyebrow">Ontology replay · one review case</p>
          <h2 id="case-ledger-heading">From movement change to an evidence trail</h2>
          <p>
            Centennial Highway northern access. Sources remain observations; the
            system may rank a hypothesis, but only an authorised person can decide
            or record a confirmed fact.
          </p>
        </div>
        <div className="case-rank" aria-label="Current review rank">
          <span>Review priority</span>
          <strong>{hypothesis.review_priority}</strong>
          <small>{hypothesis.evidence_state.replaceAll("_", " ")}</small>
        </div>
      </header>

      <ol className="epistemic-track" aria-label="Evidence lifecycle">
        <li className="is-current">
          <span>01</span><strong>Observation</strong>
          <p>502 cars measured; 873.5 expected at this countline and hour.</p>
        </li>
        <li>
          <span>02</span><strong>Inference</strong>
          <p>Physical access disruption is a review hypothesis, not a diagnosis.</p>
        </li>
        <li>
          <span>03</span><strong>Human decision</strong>
          <p>Unreviewed. No authorised action is recorded.</p>
        </li>
        <li>
          <span>04</span><strong>Confirmed fact</strong>
          <p>None recorded in this replay.</p>
        </li>
      </ol>

      <div className="evidence-board">
        <article className="evidence-bucket supporting">
          <p className="bucket-label">Supporting</p>
          {supporting.map((item) => (
            <div className="evidence-row" key={item.observation_id ?? item.source_id}>
              <strong>{sourceName(item.source_id)}</strong>
              <span>Direct count fell 42.5% below its matched baseline.</span>
              <small>{item.units} review units · measured observation · Baseline strength: high</small>
            </div>
          ))}
          <div className="evidence-row fixture-row">
            <strong>WCC ticket format adapter</strong>
            <span>Slips taxonomy maps to this case for demonstration only.</span>
            <small>Synthetic format fixture · no evidence weight</small>
          </div>
        </article>

        <article className="evidence-bucket contradicting">
          <p className="bucket-label">Contradicting</p>
          {contradicting.length ? contradicting.map((item) => (
            <div className="evidence-row" key={item.observation_id ?? item.source_id}>
              <strong>{sourceName(item.source_id)}</strong>
              <span>{item.basis.replaceAll("_", " ")}</span>
            </div>
          )) : (
            <div className="evidence-row empty-row">
              <strong>None received in this replay</strong>
              <span>Silence is missing evidence, not proof that access is clear.</span>
            </div>
          )}
        </article>

        <article className="evidence-bucket missing">
          <p className="bucket-label">Missing</p>
          {missing.map((item) => (
            <div className="evidence-row" key={item.source_id}>
              <strong>{sourceName(item.source_id)}</strong>
              <span>No observation aligned to the 6 August replay window.</span>
            </div>
          ))}
        </article>

        <article className="evidence-bucket context">
          <p className="bucket-label">Context / excluded</p>
          <div className="evidence-row">
            <strong>{`${registryData.sources.length} sources registered`}</strong>
            <span>Only time-aligned, resolved records may affect this case.</span>
            <small>NZTA TMS stays unresolved; static layers stay context-only.</small>
          </div>
          <small className="case-id">{graph.observation_refs[0]}</small>
        </article>
      </div>
    </section>
  );
}
