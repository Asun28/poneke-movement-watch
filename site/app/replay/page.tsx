import health from "../../public/cop/v1/movement-health.json";
import EvidenceCaseLedger from "../EvidenceCaseLedger";
import MovementCanvas from "../MovementCanvas";
import OperatorShell from "../components/OperatorShell";

export default function ReplayPage() {
  return (
    <OperatorShell
      active="/replay"
      eyebrow="Known-event analysis module"
      title="Replay Analyzer"
      description="Reconstruct an already known time window, compare movement with matched history and inspect the evidence trail. This module is historical batch analysis, not current emergency information."
      modeLabel="Batch replay"
    >
      <section className="replay-summary" aria-label="Replay dataset summary">
        <div><span>Investigation signals</span><strong>{health.candidate_count}</strong></div>
        <div><span>Data gaps</span><strong>{health.data_gap_groups}</strong></div>
        <div><span>Publisher cadence</span><strong>At least monthly</strong></div>
        <div><span>Data through</span><strong>6 Aug 2026</strong></div>
      </section>
      <MovementCanvas />
      <EvidenceCaseLedger />
      <section className="replay-handoff" aria-labelledby="replay-handoff-heading">
        <div>
          <p className="eyebrow">Replay API handoff</p>
          <h2 id="replay-handoff-heading">Historical evidence remains modular</h2>
          <p>Existing v1 and v2 artifacts stay stable while Live Operations consumes the separate integration snapshot.</p>
        </div>
        <div className="endpoint-list">
          <a href="/cop/v1/movement-replay.json"><span>Historical replay</span><code>/cop/v1/movement-replay.json</code></a>
          <a href="/cop/v1/movement-signals.geojson"><span>Signal feed</span><code>/cop/v1/movement-signals.geojson</code></a>
          <a href="/cop/v1/movement-health.json"><span>Coverage and health</span><code>/cop/v1/movement-health.json</code></a>
          <a href="/cop/v2/evidence-graph.json"><span>Evidence graph</span><code>/cop/v2/evidence-graph.json</code></a>
        </div>
      </section>
    </OperatorShell>
  );
}
