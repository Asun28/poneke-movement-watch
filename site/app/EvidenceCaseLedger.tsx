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
        <h2 id="case-ledger-heading">Evidence trail</h2>
        <div className="case-rank" aria-label="Current review rank">
          <span>Review priority</span>
          <strong>{hypothesis.review_priority}</strong>
          <small>{hypothesis.evidence_state.replaceAll("_", " ")}</small>
        </div>
      </header>

      <ol className="epistemic-track" aria-label="Evidence lifecycle">
        <li className="is-current">
          <span>01</span><strong>Observation</strong>
          <p>502 observed · 873.5 expected</p>
        </li>
        <li>
          <span>02</span><strong>Inference</strong>
          <p>Access disruption · unconfirmed</p>
        </li>
        <li>
          <span>03</span><strong>Human decision</strong>
          <p>Not reviewed</p>
        </li>
        <li>
          <span>04</span><strong>Confirmed fact</strong>
          <p>None</p>
        </li>
      </ol>

      <div className="evidence-board">
        <article className="evidence-bucket supporting">
          <p className="bucket-label">Supporting</p>
          {supporting.map((item) => (
            <div className="evidence-row" key={item.observation_id ?? item.source_id}>
              <strong>{sourceName(item.source_id)}</strong>
              <span>42.5% below baseline</span>
              <small>{item.units} units · high baseline</small>
            </div>
          ))}
          <div className="evidence-row fixture-row">
            <strong>WCC ticket format adapter</strong>
            <span>Demo format only</span>
            <small>Mock · zero evidence</small>
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
              <strong>None received</strong>
            </div>
          )}
        </article>

        <article className="evidence-bucket missing">
          <p className="bucket-label">Missing</p>
          {missing.map((item) => (
            <div className="evidence-row" key={item.source_id}>
              <strong>{sourceName(item.source_id)}</strong>
              <span>No 6 August record</span>
            </div>
          ))}
        </article>

        <article className="evidence-bucket context">
          <p className="bucket-label">Context / excluded</p>
          <div className="evidence-row">
            <strong>{`${registryData.sources.length} sources registered`}</strong>
            <span>Time-aligned records only</span>
          </div>
          <small className="case-id">{graph.observation_refs[0]}</small>
        </article>
      </div>
    </section>
  );
}
