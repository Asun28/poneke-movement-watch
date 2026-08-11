export const INVESTIGATION_MODULES = [
  "replay_analyzer",
  "live_operations",
  "alert_centre",
];

const DEMO_DATA_STATUSES = new Set([
  "real_replay",
  "registered_only",
  "mock_preview",
]);

const ACCESS_STATUSES = new Set([
  "public_free",
  "key_required",
  "paid_key_required",
  "permission_required",
  "publisher_clearance_required",
  "council_input_required",
]);

const ICON_MODES = new Set(["auto", "people", "vehicle", "custom"]);
const PEOPLE_TRANSPORT_CLASSES = new Set(["Pedestrian", "Cyclist", "E-scooter"]);
const CUSTOM_ICON_TYPES = new Set(["image/png", "image/webp"]);
export const MAX_CUSTOM_ICON_BYTES = 131072;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validCustomIconDataUrl(value) {
  const text = clean(value);
  if (!/^data:image\/(?:png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(text)) return false;
  const encoded = text.slice(text.indexOf(",") + 1).replace(/=+$/, "");
  return Math.floor((encoded.length * 3) / 4) <= MAX_CUSTOM_ICON_BYTES;
}

export function validateCustomIconFile(file) {
  if (!CUSTOM_ICON_TYPES.has(clean(file?.type).toLowerCase())) return { ok: false, error: "type" };
  const size = Number(file?.size);
  if (!Number.isFinite(size) || size <= 0 || size > MAX_CUSTOM_ICON_BYTES) {
    return { ok: false, error: "size" };
  }
  return { ok: true, error: null };
}

export function movementIconDescriptor(source, transportClass, direction) {
  const autoIcon = PEOPLE_TRANSPORT_CLASSES.has(clean(transportClass)) ? "people" : "vehicle";
  const requested = ICON_MODES.has(source?.icon_mode) ? source.icon_mode : "auto";
  const customIcon = validCustomIconDataUrl(source?.custom_icon_data_url)
    ? clean(source.custom_icon_data_url)
    : null;
  return {
    icon: requested === "auto" ? autoIcon : requested === "custom" && !customIcon ? autoIcon : requested,
    custom_icon_data_url: requested === "custom" ? customIcon : null,
    direction: clean(direction).toUpperCase(),
  };
}

function uniqueModules(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((module) => INVESTIGATION_MODULES.includes(module)))];
}

function canonicalModules(source) {
  const modules = [];
  if (["replay_analyzer", "live_operations"].includes(source.operations_target)) {
    modules.push(source.operations_target);
  }
  if (source.alert_eligible === true) modules.push("alert_centre");
  return uniqueModules(modules);
}

function operationsTarget(modules) {
  if (modules.includes("replay_analyzer")) return "replay_analyzer";
  if (modules.includes("live_operations")) return "live_operations";
  return "integration_only";
}

function draftDataState(draft) {
  if ([
    "permission_required",
    "publisher_clearance_required",
    "council_input_required",
  ].includes(draft.access_status)) return "input_required";
  if (["key_required", "paid_key_required"].includes(draft.access_status)) {
    return "credentials_required";
  }
  return "available_not_ingested";
}

function validateDraft(input) {
  const errors = [];
  const id = clean(input?.id);
  const name = clean(input?.name);
  const endpoint = clean(input?.endpoint);
  const rawModules = Array.isArray(input?.assigned_modules) ? input.assigned_modules : [];
  const modules = uniqueModules(rawModules);
  const iconMode = clean(input?.icon_mode) || "auto";
  const customIconDataUrl = clean(input?.custom_icon_data_url) || null;

  if (!id) errors.push("required:id");
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) errors.push("invalid:id");
  if (!name) errors.push("required:name");
  if (rawModules.length === 0) errors.push("required:assigned_modules");
  else if (modules.length !== rawModules.length) errors.push("invalid:assigned_modules");
  if (!DEMO_DATA_STATUSES.has(input?.demo_data_status)) errors.push("invalid:demo_data_status");
  if (!ACCESS_STATUSES.has(input?.access_status)) errors.push("invalid:access_status");
  if (!ICON_MODES.has(iconMode)) errors.push("invalid:icon_mode");
  if (customIconDataUrl && !validCustomIconDataUrl(customIconDataUrl)) {
    errors.push("invalid:custom_icon_data_url");
  } else if (iconMode === "custom" && !customIconDataUrl) {
    errors.push("required:custom_icon_data_url");
  }
  if (endpoint) {
    try {
      const url = new URL(endpoint);
      if (!["http:", "https:"].includes(url.protocol)) errors.push("invalid:endpoint");
    } catch {
      errors.push("invalid:endpoint");
    }
  }

  return {
    errors,
    id,
    name,
    endpoint: endpoint || null,
    modules,
    iconMode,
    customIconDataUrl: iconMode === "custom" ? customIconDataUrl : null,
  };
}

function canonicalSource(source) {
  const descriptor = movementIconDescriptor(source, "Car", "");
  return {
    ...source,
    endpoint: source.endpoint ?? null,
    assigned_modules: canonicalModules(source),
    record_origin: "canonical",
    icon_mode: ICON_MODES.has(source?.icon_mode) ? source.icon_mode : "auto",
    custom_icon_data_url: source?.icon_mode === "custom" ? descriptor.custom_icon_data_url : null,
  };
}

function localDraft(input, parsed) {
  return {
    id: parsed.id,
    name: parsed.name,
    role: "investigation_context",
    endpoint: parsed.endpoint,
    demo_data_status: input.demo_data_status,
    access_status: input.access_status,
    operations_target: operationsTarget(parsed.modules),
    alert_eligible: false,
    assigned_modules: parsed.modules,
    record_origin: "local_draft",
    evidence_weight: 0,
    icon_mode: parsed.iconMode,
    custom_icon_data_url: parsed.customIconDataUrl,
    data_2026: {
      status: draftDataState(input),
      active: false,
      record_state: "local_investigation_draft",
      verified_at: null,
    },
  };
}

function localOverride(existing, input, parsed) {
  return {
    ...existing,
    name: parsed.name,
    endpoint: existing.endpoint ?? null,
    assigned_modules: parsed.modules,
    operations_target: operationsTarget(parsed.modules),
    record_origin: "local_override",
    canonical_name: existing.canonical_name ?? existing.name,
    icon_mode: parsed.iconMode,
    custom_icon_data_url: parsed.customIconDataUrl,
  };
}

export function mergeInvestigationSources(canonicalSources, savedSources = []) {
  const merged = canonicalSources.map(canonicalSource);
  for (const saved of Array.isArray(savedSources) ? savedSources : []) {
    const parsed = validateDraft(saved);
    if (parsed.errors.length > 0) continue;
    const index = merged.findIndex((source) => source.id === parsed.id);
    if (index >= 0) {
      merged[index] = localOverride(merged[index], saved, parsed);
    } else if (saved.demo_data_status !== "real_replay") {
      merged.push(localDraft(saved, parsed));
    }
  }
  return merged;
}

export function upsertInvestigationSource(sources, input) {
  const parsed = validateDraft(input);
  if (parsed.errors.length > 0) {
    return { ok: false, errors: parsed.errors, sources, saved: null };
  }

  const existing = sources.find((source) => source.id === parsed.id);
  if (!existing && input.demo_data_status === "real_replay") {
    return {
      ok: false,
      errors: ["invalid:demo_data_status"],
      sources,
      saved: null,
    };
  }
  const saved = existing && existing.record_origin !== "local_draft"
    ? localOverride(existing, input, parsed)
    : localDraft(input, parsed);
  const next = existing
    ? sources.map((source) => source.id === parsed.id ? saved : source)
    : [...sources, saved];
  return { ok: true, errors: [], sources: next, saved };
}

export function persistableInvestigationSources(sources) {
  return sources
    .filter((source) => source.record_origin !== "canonical")
    .map((source) => ({
      id: source.id,
      name: source.name,
      endpoint: source.endpoint,
      demo_data_status: source.demo_data_status,
      access_status: source.access_status,
      assigned_modules: source.assigned_modules,
      record_origin: source.record_origin,
      icon_mode: source.icon_mode,
      custom_icon_data_url: source.custom_icon_data_url,
    }));
}
