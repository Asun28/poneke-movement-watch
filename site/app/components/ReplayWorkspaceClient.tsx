"use client";

import { useCallback, useState } from "react";
import MovementCanvas from "../MovementCanvas";
import { replayDatasetKind } from "../../lib/replayDataWorkspace.mjs";
import ReplayCaseContext from "./ReplayCaseContext";
import ReplayInvestigationSelector from "./ReplayInvestigationSelector";
import SensorReplayCanvas from "./SensorReplayCanvas";
import AprilBacktestDetails, { AprilBacktestSummary } from "./AprilBacktestDetails";

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

export default function ReplayWorkspaceClient({ catalog, aprilSummary }: { catalog: Investigation[]; aprilSummary: AprilBacktestSummary }) {
  const defaultInvestigation = catalog.find((item) => item.id === "august-movement-review-2026") ?? catalog[0];
  const [active, setActive] = useState(defaultInvestigation);
  const selectInvestigation = useCallback((investigation: Investigation) => setActive(investigation), []);
  if (!active) return null;
  const datasetKind = replayDatasetKind(active);
  const investigationControl = (
    <ReplayInvestigationSelector catalog={catalog} activeId={active.id} onSelect={selectInvestigation} />
  );

  return (
    <div className="replay-bound-workspace" data-investigation-switches-dataset="true" data-active-investigation={active.id}>
      <ReplayCaseContext investigation={active} />
      {datasetKind === "sensor"
        ? <SensorReplayCanvas key={active.id} investigation={active} investigationControl={investigationControl} />
        : <MovementCanvas key={active.id} investigation={active} investigationControl={investigationControl} />}
      {active.id === "wellington-april-storm-2026" ? <AprilBacktestDetails summary={aprilSummary} /> : null}
    </div>
  );
}
