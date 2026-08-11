"use client";

export type AprilBacktestSummary = {
  movementCandidates: number;
  movementRecords: number;
  seriesCount: number;
  sensorRecords: number;
  detectorEpisodes: number;
};

export default function AprilBacktestDetails({ summary }: { summary: AprilBacktestSummary }) {
  return (
    <details id="april-storm-backtest" className="backtest-pack">
      <summary className="backtest-header">
        <div><h2 id="april-storm-heading">April Storm · movement impacts · 18–22 Apr 2026</h2></div>
        <div className="backtest-header-status">
          <span>Replay Analyzer input</span>
          <span className="backtest-readiness">{summary.movementCandidates.toLocaleString("en-NZ")} movement candidates</span>
          <span className="backtest-toggle">Event details</span>
        </div>
      </summary>
      <div className="backtest-summary" aria-label="April storm backtest contract">
        <div><span>Movement candidates</span><strong>{summary.movementCandidates.toLocaleString("en-NZ")}</strong></div>
        <div><span>WCC count records</span><strong>{summary.movementRecords.toLocaleString("en-NZ")}</strong></div>
        <div><span>Supporting gauges</span><strong>{summary.seriesCount}</strong></div>
        <div><span>Window</span><strong>18–22 Apr</strong></div>
      </div>
      <div className="backtest-grid">
        <article>
          <h3>Primary · city movement</h3>
          <dl className="backtest-rules">
            <div><dt>Input</dt><dd>{summary.movementRecords.toLocaleString("en-NZ")} count records</dd></div>
            <div><dt>Model</dt><dd>Movement seasonal MAD v1</dd></div>
            <div><dt>Output</dt><dd>{summary.movementCandidates.toLocaleString("en-NZ")} movement candidates</dd></div>
            <div><dt>Availability</dt><dd>Retrospective only · event-time weight 0</dd></div>
          </dl>
        </article>
        <article>
          <h3>Supporting · weather and river</h3>
          <dl className="backtest-rules">
            <div><dt>Coverage</dt><dd>{summary.seriesCount} gauges · {summary.sensorRecords.toLocaleString("en-NZ")} readings</dd></div>
            <div><dt>Rainfall</dt><dd>12 rain gauges</dd></div>
            <div><dt>River flow</dt><dd>6 river gauges</dd></div>
            <div><dt>Hydro detector</dt><dd>{summary.detectorEpisodes} episodes · Investigation only</dd></div>
          </dl>
        </article>
        <article>
          <h3>Evaluation guardrails</h3>
          <dl className="backtest-rules">
            <div><dt>Training cutoff</dt><dd>Train before 18 Apr</dd></div>
            <div><dt>Replay step</dt><dd>5 or 15 min</dd></div>
            <div><dt>Replay input</dt><dd><code>available_at</code> ≤ replay step</dd></div>
            <div><dt>Exclude</dt><dd>Mock, news, final reports and damage</dd></div>
            <div><dt>Score</dt><dd>Lead time · precision/recall · false alerts · Brier</dd></div>
          </dl>
        </article>
        <article>
          <h3>Official impact evidence</h3>
          <p className="backtest-evidence-state">Post-event · withheld</p>
          <ol className="backtest-timeline">
            <li><time dateTime="2026-04-18">18 Apr</time><span>Heavy rain and flooding begin.</span></li>
            <li><time dateTime="2026-04-20">20 Apr</time><span>Berhampore 85.9 mm/h; Hutt River peaks near 475 m³/s.</span></li>
            <li><time dateTime="2026-04-21">21–22 Apr</time><span>SH2 Remutaka washout closure and reopening.</span></li>
          </ol>
        </article>
      </div>
      <div className="backtest-conflict" role="note">
        <strong>Source conflicts preserved</strong>
        <span><code>source_claimed_time</code> → <code>normalized_event_time</code> · <code>correction_note</code> · 85.9 mm report / 77.10347 mm series</span>
      </div>
      <footer className="backtest-footer">
        <div><strong>Mock excluded</strong><span>One event cannot establish general accuracy.</span></div>
        <div className="backtest-links">
          <a href="/cop/v4/april-storm-event-pack.json">Event pack</a>
          <a href="/cop/v4/april-storm-hilltop-observations.json">Sensor data</a>
          <a href="/cop/v4/april-storm-hydro-detector.json">Detector data</a>
          <a href="/cop/v4/april-storm-movement-outcomes.json">Movement outcomes</a>
        </div>
      </footer>
    </details>
  );
}
