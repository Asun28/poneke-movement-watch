import movementReplay from "../../public/cop/v1/movement-replay.json";
import aprilStorm from "../../public/cop/v4/april-storm-event-pack.json";
import hilltopPack from "../../public/cop/v4/april-storm-hilltop-observations.json";
import { buildReplayInvestigationCatalog, buildReplayInvestigationUrl } from "../../lib/replayInvestigations.mjs";
import OperatorDashboardClient from "../components/OperatorDashboardClient";
import OperatorShell from "../components/OperatorShell";

export default function DashboardPage() {
  const investigations = buildReplayInvestigationCatalog({ movementReplay, aprilStorm, hilltopPack })
    .map((investigation) => ({
      id: investigation.id,
      title: investigation.title.replaceAll(" · ", " | ").replaceAll("–", "-"),
      data_label: investigation.data_label,
      truth_label: investigation.truth_label,
      replay_url: buildReplayInvestigationUrl(investigation),
    }));

  return (
    <OperatorShell active="/dashboard" title="Dashboard" modeLabel="Current picture">
      <OperatorDashboardClient investigations={investigations} />
    </OperatorShell>
  );
}
