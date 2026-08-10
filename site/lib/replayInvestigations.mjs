function cleanText(value, fallback = "") {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text || fallback;
}

function validTime(value) {
  return typeof value === "string" && Number.isFinite(new Date(value).getTime());
}

function slug(value) {
  return cleanText(value, "investigation")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "investigation";
}

function localId(title, startsAt) {
  const stamp = cleanText(startsAt).replace(/[^0-9a-z]+/gi, "").toLowerCase();
  return `local:${slug(title)}:${stamp}`;
}

export function buildReplayInvestigationCatalog({ movementReplay, aprilStorm, hilltopPack }) {
  return [
    {
      id: cleanText(aprilStorm?.event_id, "wellington-april-storm-2026"),
      case_id: cleanText(aprilStorm?.event_id, "wellington-april-storm-2026"),
      title: "April Storm · 18–22 Apr 2026",
      mode: cleanText(aprilStorm?.mode, "retrospective_case_study"),
      scope: "packaged",
      editable: false,
      source_id: cleanText(hilltopPack?.source_id, "gwrc-hilltop"),
      starts_at: cleanText(aprilStorm?.window?.start_at),
      as_of: cleanText(aprilStorm?.window?.end_at),
      default_target_at: "2026-04-20T20:00:00+12:00",
      target_hash: "april-storm-backtest",
      record_count: Number(hilltopPack?.record_count) || 0,
      data_label: `${Number(hilltopPack?.record_count || 0).toLocaleString("en-NZ")} sensor records`,
      truth_label: hilltopPack?.truth === "official_historical_observations"
        ? "Official historical sensors"
        : "Historical sensor pack",
      incident_created: false,
      external_effect: "none",
    },
    {
      id: "august-movement-review-2026",
      case_id: "august-movement-review-2026",
      title: "August movement review · 1–6 Aug 2026",
      mode: "historical_movement_replay",
      scope: "packaged",
      editable: false,
      source_id: "wcc-transport-sensors",
      starts_at: cleanText(movementReplay?.available_from),
      as_of: cleanText(movementReplay?.data_as_of ?? movementReplay?.available_to),
      default_target_at: cleanText(movementReplay?.default_target_at),
      target_hash: "history-replay",
      record_count: Array.isArray(movementReplay?.slots) ? movementReplay.slots.length : 0,
      data_label: `${Array.isArray(movementReplay?.slots) ? movementReplay.slots.length : 0} time slots`,
      truth_label: "Real publisher replay",
      incident_created: false,
      external_effect: "none",
    },
  ];
}

export function buildReplayInvestigationUrl(investigation) {
  const params = new URLSearchParams();
  params.set("investigation", cleanText(investigation?.id, "local-investigation"));
  params.set("case", cleanText(investigation?.case_id ?? investigation?.id, "local-investigation"));
  params.set("source", cleanText(investigation?.source_id, "unknown-source"));
  if (validTime(investigation?.starts_at)) params.set("from", investigation.starts_at);
  if (validTime(investigation?.as_of)) params.set("as_of", investigation.as_of);
  if (investigation?.scope === "local_draft") params.set("scope", "local_draft");
  const target = cleanText(investigation?.target_hash, "history-replay").replace(/^#/, "");
  return `/replay?${params.toString()}#${encodeURIComponent(target)}`;
}

export function prepareReplayInvestigationDraft(input, sourceWindows = [], canonicalIds = []) {
  const title = cleanText(input?.title);
  const sourceId = cleanText(input?.source_id);
  const startsAt = cleanText(input?.starts_at);
  const asOf = cleanText(input?.as_of);
  const requestedId = cleanText(input?.id);
  const sourceWindow = sourceWindows.find((item) => item?.source_id === sourceId);
  const errors = [];

  if (requestedId && canonicalIds.includes(requestedId)) errors.push("canonical_id_reserved");
  if (title.length < 3) errors.push("invalid_title");
  if (!sourceWindow) errors.push("unsupported_source");
  if (!validTime(startsAt) || !validTime(asOf) || new Date(startsAt) >= new Date(asOf)) {
    errors.push("invalid_window");
  } else if (sourceWindow && (
    new Date(startsAt) < new Date(sourceWindow.starts_at)
    || new Date(asOf) > new Date(sourceWindow.as_of)
  )) {
    errors.push("outside_source_window");
  }
  if (errors.length) return { ready: false, errors };

  const id = requestedId || localId(title, startsAt);
  if (canonicalIds.includes(id)) return { ready: false, errors: ["canonical_id_reserved"] };
  const investigation = {
    id,
    case_id: id,
    title: title.slice(0, 120),
    mode: "case_investigation",
    scope: "local_draft",
    editable: true,
    source_id: sourceId,
    starts_at: startsAt,
    as_of: asOf,
    target_hash: cleanText(sourceWindow.target_hash, "history-replay"),
    record_count: null,
    data_label: "Local draft · not Incident/COP",
    truth_label: "Local draft",
    incident_created: false,
    external_effect: "none",
  };
  return {
    ready: true,
    errors: [],
    investigation,
    replay_url: buildReplayInvestigationUrl(investigation),
  };
}

export function mergeReplayInvestigations(canonical = [], drafts = []) {
  const canonicalIds = new Set(canonical.map((item) => item.id));
  const safeDrafts = [];
  const seen = new Set(canonicalIds);
  for (const draft of Array.isArray(drafts) ? drafts : []) {
    if (
      draft?.scope !== "local_draft"
      || !cleanText(draft.id)
      || !cleanText(draft.title)
      || !cleanText(draft.source_id)
      || !validTime(draft.starts_at)
      || !validTime(draft.as_of)
      || seen.has(draft.id)
    ) continue;
    seen.add(draft.id);
    safeDrafts.push({ ...draft, incident_created: false, external_effect: "none" });
  }
  return [...canonical, ...safeDrafts];
}
