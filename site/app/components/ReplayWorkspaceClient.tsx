"use client";

import { useCallback, useState } from "react";
import MovementCanvas from "../MovementCanvas";
import { replayDatasetKind } from "../../lib/replayDataWorkspace.mjs";
import ReplayCaseContext from "./ReplayCaseContext";
import ReplayInvestigationSelector from "./ReplayInvestigationSelector";
import SensorReplayCanvas from "./SensorReplayCanvas";

type Investigation = {
  id: string;
  case_id: string;
  title: string;
  scope: "packaged" | "local_draft";
  editable: boolean;
  source_id: string;
  primary_source_id?: string;
  supporting_source_ids?: string[];
  starts_at: string;
  as_of: string;
  target_hash: string;
  record_count: number | null;
  data_label: string;
  truth_label: string;
  incident_created: false;
  external_effect: "none";
  default_target_at?: string;
};

export default function ReplayWorkspaceClient({ catalog }: { catalog: Investigation[] }) {
  const defaultInvestigation = catalog.find((item) => item.id === "august-movement-review-2026") ?? catalog[0];
  const [active, setActive] = useState(defaultInvestigation);
  const selectInvestigation = useCallback((investigation: Investigation) => setActive(investigation), []);
  if (!active) return null;
  const datasetKind = replayDatasetKind(active);

  return (
    <div className="replay-bound-workspace" data-investigation-switches-dataset="true" data-active-investigation={active.id}>
      <ReplayInvestigationSelector catalog={catalog} activeId={active.id} onSelect={selectInvestigation} />
      <ReplayCaseContext investigation={active} />
      {datasetKind === "sensor"
        ? <SensorReplayCanvas key={active.id} investigation={active} />
        : <MovementCanvas key={active.id} investigation={active} />}
    </div>
  );
}
