import movementReplay from "../../public/cop/v1/movement-replay.json";
import aprilStorm from "../../public/cop/v4/april-storm-event-pack.json";
import hilltopPack from "../../public/cop/v4/april-storm-hilltop-observations.json";
import detectorPack from "../../public/cop/v4/april-storm-hydro-detector.json";
import { buildReplayInvestigationCatalog } from "../../lib/replayInvestigations.mjs";
import EvidenceCaseLedger from "../EvidenceCaseLedger";
import ReplayWorkspaceClient from "../components/ReplayWorkspaceClient";
import OperatorShell from "../components/OperatorShell";

export default function ReplayPage() {
  const investigations = buildReplayInvestigationCatalog({ movementReplay, aprilStorm, hilltopPack });
  const movementCandidates = aprilStorm.replay_inputs.retrospective_outcomes[0].candidate_signals;
  const movementRecords = aprilStorm.coverage.wcc_transport_countlines.window_record_count;

  return (
    <OperatorShell
      active="/replay"
      title="Replay Analyzer"
      modeLabel="Batch replay"
    >
      <ReplayWorkspaceClient
        catalog={investigations}
        aprilSummary={{
          movementCandidates,
          movementRecords,
          seriesCount: hilltopPack.series_count,
          sensorRecords: hilltopPack.record_count,
          detectorEpisodes: detectorPack.episode_count,
        }}
      />
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
            <a href="/cop/v4/april-storm-hydro-detector.json"><span>April hydro detector</span><code>/cop/v4/april-storm-hydro-detector.json</code></a>
            <a href="/cop/v4/april-storm-movement-outcomes.json"><span>April movement outcomes</span><code>/cop/v4/april-storm-movement-outcomes.json</code></a>
          </div>
        </section>
      </details>
    </OperatorShell>
  );
}
