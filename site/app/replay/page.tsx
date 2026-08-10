import health from "../../public/cop/v1/movement-health.json";
import aprilStorm from "../../public/cop/v4/april-storm-event-pack.json";
import hilltopPack from "../../public/cop/v4/april-storm-hilltop-observations.json";
import EvidenceCaseLedger from "../EvidenceCaseLedger";
import ReplayCaseContext from "../components/ReplayCaseContext";
import MovementCanvas from "../MovementCanvas";
import OperatorShell from "../components/OperatorShell";

export default function ReplayPage() {
  return (
    <OperatorShell
      active="/replay"
      title="Replay Analyzer"
      modeLabel="Batch replay"
    >
      <ReplayCaseContext />
      <section className="replay-summary" aria-label="Replay dataset summary">
        <div><span>Investigation signals</span><strong>{health.candidate_count}</strong></div>
        <div><span>Data gaps</span><strong>{health.data_gap_groups}</strong></div>
        <div><span>Publisher cadence</span><strong>At least monthly</strong></div>
        <div><span>Data through</span><strong>6 Aug 2026</strong></div>
      </section>
      <details id="april-storm-backtest" className="backtest-pack">
        <summary className="backtest-header">
          <div>
            <h2 id="april-storm-heading">April Storm · 18–22 Apr 2026</h2>
          </div>
          <div className="backtest-header-status">
            <span>Replay Analyzer input</span>
            <span className="backtest-readiness">3 sensor series loaded</span>
            <span className="backtest-toggle">Event details</span>
          </div>
        </summary>

        <div className="backtest-summary" aria-label="April storm backtest contract">
          <div><span>Window</span><strong>18–22 Apr</strong></div>
          <div><span>Training cutoff</span><strong>Train before 18 Apr</strong></div>
          <div><span>Replay step</span><strong>5 or 15 min</strong></div>
          <div><span>Sensor records</span><strong>{hilltopPack.record_count.toLocaleString("en-NZ")}</strong></div>
        </div>

        <div className="backtest-grid">
          <article>
            <h3>Event record</h3>
            <ol className="backtest-timeline">
              <li><time dateTime="2026-04-18">18 Apr</time><span>Heavy rain and flooding begin.</span></li>
              <li><time dateTime="2026-04-20">20 Apr</time><span>Berhampore 85.9 mm/h; Hutt River peaks near 475 m³/s.</span></li>
              <li><time dateTime="2026-04-21">21–22 Apr</time><span>SH2 Remutaka washout closure and reopening.</span></li>
            </ol>
          </article>
          <article>
            <h3>Evaluation</h3>
            <dl className="backtest-rules">
              <div><dt>Input</dt><dd><code>available_at</code> ≤ replay step</dd></div>
              <div><dt>Compare</dt><dd>Rules · robust anomaly · regularized logistic</dd></div>
              <div><dt>Exclude</dt><dd>Mock, news, final reports and damage</dd></div>
              <div><dt>Score</dt><dd>Lead time · precision/recall · false alerts · Brier</dd></div>
            </dl>
          </article>
          <article>
            <h3>Replay inputs</h3>
            <dl className="backtest-rules">
              <div><dt>Rainfall</dt><dd>Berhampore · Newtown</dd></div>
              <div><dt>River flow</dt><dd>Hutt River at Taita Gorge</dd></div>
              <div><dt>Movement</dt><dd>{aprilStorm.coverage.wcc_transport_countlines.window_record_count.toLocaleString("en-NZ")} records · outcome only</dd></div>
              <div><dt>Availability</dt><dd>Derived cadence bound</dd></div>
            </dl>
          </article>
        </div>

        <div className="backtest-conflict" role="note">
          <strong>Source conflicts preserved</strong>
          <span><code>source_claimed_time</code> → <code>normalized_event_time</code> · <code>correction_note</code> · 85.9 mm report / 77.10347 mm series</span>
        </div>

        <footer className="backtest-footer">
          <div>
            <strong>Mock excluded</strong>
            <span>One event cannot establish general accuracy.</span>
          </div>
          <div className="backtest-links">
            <a href="/cop/v4/april-storm-event-pack.json">Event pack</a>
            <a href="/cop/v4/april-storm-hilltop-observations.json">Sensor data</a>
          </div>
        </footer>
      </details>
      <div className="replay-available-heading">
        <h2>August replay</h2>
      </div>
      <MovementCanvas />
      <details className="operator-advanced">
        <summary>Evidence review</summary>
        <EvidenceCaseLedger />
        <section className="replay-handoff" aria-labelledby="replay-handoff-heading">
          <h2 id="replay-handoff-heading">Data links</h2>
          <div className="endpoint-list">
            <a href="/cop/v1/movement-replay.json"><span>Historical replay</span><code>/cop/v1/movement-replay.json</code></a>
            <a href="/cop/v1/movement-signals.geojson"><span>Signal feed</span><code>/cop/v1/movement-signals.geojson</code></a>
            <a href="/cop/v1/movement-health.json"><span>Coverage and health</span><code>/cop/v1/movement-health.json</code></a>
            <a href="/cop/v2/evidence-graph.json"><span>Evidence graph</span><code>/cop/v2/evidence-graph.json</code></a>
            <a href="/cop/v4/april-storm-event-pack.json"><span>April storm event pack</span><code>/cop/v4/april-storm-event-pack.json</code></a>
            <a href="/cop/v4/april-storm-hilltop-observations.json"><span>April storm sensor data</span><code>/cop/v4/april-storm-hilltop-observations.json</code></a>
          </div>
        </section>
      </details>
    </OperatorShell>
  );
}
