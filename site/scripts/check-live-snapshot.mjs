import { readFile } from "node:fs/promises";

import { buildLiveSnapshot, buildSourceContracts, createAlertCandidates } from "../lib/dataIntegration.mjs";
import { makeLiveAdapters } from "../lib/liveAdapters.mjs";
import { PROVIDER_FIXTURES } from "../lib/providerFixtures.mjs";
import { SOURCE_MANIFEST } from "../lib/sourceManifest.mjs";

const registry = JSON.parse(
  await readFile(new URL("../public/cop/v2/source-registry.json", import.meta.url), "utf8"),
);
const contracts = buildSourceContracts(registry, SOURCE_MANIFEST);
const snapshot = await buildLiveSnapshot({
  contracts,
  adapters: makeLiveAdapters(fetch),
  mockFixtures: PROVIDER_FIXTURES,
  now: new Date(),
});
const alerts = createAlertCandidates(snapshot);
const alertSources = alerts.candidates.reduce((counts, candidate) => {
  counts[candidate.source_id] = (counts[candidate.source_id] ?? 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  generated_at: snapshot.generated_at,
  summary: snapshot.summary,
  observation_count: snapshot.observations.length,
  alert_candidate_count: alerts.count,
  alert_sources: alertSources,
  live_sources: snapshot.sources
    .filter((source) => source.connector_mode === "live")
    .map(({ source_id, runtime_state, record_count, raw_record_count, message }) => ({
      source_id,
      runtime_state,
      record_count,
      raw_record_count,
      message,
    })),
}, null, 2));
