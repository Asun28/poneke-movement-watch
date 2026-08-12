const SOURCE_ID = "mock-wellington-storm-flood-simulator";
const BASE_TIME = Date.parse("2026-08-13T09:00:00+12:00");

const APRIL_STORM = Object.freeze({
  id: "wellington-april-storm-2026",
  title: "April Storm 2026",
  replay_url: "/replay?investigation=wellington-april-storm-2026&case=wellington-april-storm-2026&source=gwrc-hilltop&from=2026-04-18T00%3A00%3A00%2B12%3A00&as_of=2026-04-22T23%3A59%3A59%2B12%3A00#april-storm-backtest",
});

const STAGES = Object.freeze([
  { label: "Baseline", elapsed_minutes: 0, rainfall_mm_h: 2, surface_water_index: 0, vehicle_change_pct: 0, pedestrian_change_pct: 0, transit_delay_min: 0, report_count: 0 },
  { label: "Heavy rain begins", elapsed_minutes: 30, rainfall_mm_h: 14, surface_water_index: 0, vehicle_change_pct: -3, pedestrian_change_pct: -2, transit_delay_min: 0, report_count: 0 },
  { label: "Surface water forming", elapsed_minutes: 60, rainfall_mm_h: 34, surface_water_index: 0.08, vehicle_change_pct: -12, pedestrian_change_pct: -9, transit_delay_min: 4, report_count: 1 },
  { label: "Movement disruption", elapsed_minutes: 90, rainfall_mm_h: 58, surface_water_index: 0.22, vehicle_change_pct: -31, pedestrian_change_pct: -24, transit_delay_min: 15, report_count: 3 },
  { label: "Access pressure", elapsed_minutes: 120, rainfall_mm_h: 76, surface_water_index: 0.36, vehicle_change_pct: -49, pedestrian_change_pct: -41, transit_delay_min: 31, report_count: 7 },
  { label: "Flood pattern", elapsed_minutes: 180, rainfall_mm_h: 86, surface_water_index: 0.48, vehicle_change_pct: -63, pedestrian_change_pct: -55, transit_delay_min: 46, report_count: 12 },
]);

const REFERENCE_PROFILE = Object.freeze({
  rainfall: { label: "Heavy rainfall", value: 0.92, weight: 0.3 },
  surface_water: { label: "Surface flooding", value: 0.94, weight: 0.25 },
  movement: { label: "Movement reduction", value: 0.9, weight: 0.25 },
  transit: { label: "Transit disruption", value: 0.76, weight: 0.1 },
  reports: { label: "Public reports", value: 0.8, weight: 0.1 },
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function observedAt(elapsedMinutes) {
  return new Date(BASE_TIME + elapsedMinutes * 60_000).toISOString();
}

function pointObservation({ id, kind, title, coordinates, observed_at, properties }) {
  return {
    id: `simulation:${id}`,
    source_id: SOURCE_ID,
    kind,
    observed_at,
    received_at: observed_at,
    freshness_state: "simulation",
    evidence_weight: 0,
    geometry: { type: "Point", coordinates },
    properties: {
      title,
      name: title,
      scenario_id: "mock-wellington-storm-flood-v1",
      demo_data_status: "mock_simulation",
      alert_eligible: false,
      training_use: "excluded",
      ...properties,
    },
  };
}

function buildFrame(metrics, index) {
  const observed_at = observedAt(metrics.elapsed_minutes);
  const observations = [
    pointObservation({
      id: "berhampore-rain",
      kind: "rain_sensor",
      title: "Berhampore rainfall",
      coordinates: [174.77165, -41.32322],
      observed_at,
      properties: { latest_rainfall: metrics.rainfall_mm_h, value: metrics.rainfall_mm_h, unit: "mm/h", map_label: `${metrics.rainfall_mm_h} mm/h` },
    }),
    pointObservation({
      id: "newtown-rain",
      kind: "rain_sensor",
      title: "Newtown rainfall",
      coordinates: [174.7791, -41.3114],
      observed_at,
      properties: { latest_rainfall: Math.round(metrics.rainfall_mm_h * 0.86), value: Math.round(metrics.rainfall_mm_h * 0.86), unit: "mm/h", map_label: `${Math.round(metrics.rainfall_mm_h * 0.86)} mm/h` },
    }),
    pointObservation({
      id: "adelaide-car",
      kind: "vehicle_movement",
      title: "Adelaide Road vehicle movement",
      coordinates: [174.7794, -41.311],
      observed_at,
      properties: {
        transport_class: "Car",
        direction: "Southbound",
        expected: 120,
        observed: Math.round(120 * (1 + metrics.vehicle_change_pct / 100)),
        value: metrics.vehicle_change_pct,
        unit: "% vs expected",
        map_label: `${metrics.vehicle_change_pct > 0 ? "+" : ""}${metrics.vehicle_change_pct}%`,
      },
    }),
    pointObservation({
      id: "cuba-people",
      kind: "people_movement",
      title: "Cuba Street pedestrian movement",
      coordinates: [174.7758, -41.2929],
      observed_at,
      properties: {
        transport_class: "Pedestrian",
        direction: "Northbound",
        expected: 90,
        observed: Math.round(90 * (1 + metrics.pedestrian_change_pct / 100)),
        value: metrics.pedestrian_change_pct,
        unit: "% vs expected",
        map_label: `${metrics.pedestrian_change_pct > 0 ? "+" : ""}${metrics.pedestrian_change_pct}%`,
      },
    }),
  ];

  if (metrics.surface_water_index > 0) {
    observations.push(pointObservation({
      id: "newtown-surface-water",
      kind: "surface_water_sensor",
      title: "Newtown surface water",
      coordinates: [174.7806, -41.3132],
      observed_at,
      properties: { value: Math.round(metrics.surface_water_index * 100), unit: "index", map_label: `${Math.round(metrics.surface_water_index * 100)}%` },
    }));
  }
  if (metrics.transit_delay_min > 0) {
    observations.push(pointObservation({
      id: "route-1-delay",
      kind: "public_transport_delay",
      title: "Route 1 simulated delay",
      coordinates: [174.7798, -41.3076],
      observed_at,
      properties: { value: metrics.transit_delay_min, unit: "min", route: "1", map_label: `+${metrics.transit_delay_min} min` },
    }));
  }
  if (metrics.report_count > 0) {
    observations.push(pointObservation({
      id: "newtown-reports",
      kind: "community_report",
      title: "Newtown flood reports",
      coordinates: [174.7819, -41.3101],
      observed_at,
      properties: { value: metrics.report_count, unit: "mock reports", map_label: `${metrics.report_count} reports` },
    }));
  }

  return {
    index,
    label: metrics.label,
    elapsed_minutes: metrics.elapsed_minutes,
    observed_at,
    metrics: { ...metrics },
    observations,
  };
}

export function buildStormFloodSimulation() {
  const frames = STAGES.map(buildFrame);
  return {
    id: "mock-wellington-storm-flood-v1",
    title: "Wellington storm and flood exercise",
    source: {
      source_id: SOURCE_ID,
      name: "Storm exercise simulator",
      role: "Synthetic exercise scenario",
      connector_mode: "mock",
      runtime_state: "simulation",
      record_count: frames.at(-1).observations.length,
      observed_at: frames.at(-1).observed_at,
      received_at: frames.at(-1).observed_at,
      message: "Browser-local mock scenario. No external connection or write.",
      alert_eligible: false,
      access: { status: "browser_local" },
      truth: { demo_data_status: "mock_simulation" },
    },
    truth: {
      demo_data_status: "mock_simulation",
      evidence_weight: 0,
      alert_eligible: false,
      training_use: "excluded",
      external_write: false,
    },
    frames,
  };
}

export function simulationFrameAt(scenario, index) {
  const safeIndex = clamp(Number.isFinite(Number(index)) ? Math.trunc(Number(index)) : 0, 0, scenario.frames.length - 1);
  return scenario.frames[safeIndex];
}

function frameProfile(frame) {
  const movementChange = (Math.abs(frame.metrics.vehicle_change_pct) + Math.abs(frame.metrics.pedestrian_change_pct)) / 2;
  return {
    rainfall: { available: true, value: clamp(frame.metrics.rainfall_mm_h / 90, 0, 1) },
    surface_water: { available: frame.metrics.surface_water_index > 0, value: clamp(frame.metrics.surface_water_index / 0.5, 0, 1) },
    movement: { available: movementChange > 5, value: clamp(movementChange / 65, 0, 1) },
    transit: { available: frame.metrics.transit_delay_min > 0, value: clamp(frame.metrics.transit_delay_min / 50, 0, 1) },
    reports: { available: frame.metrics.report_count > 0, value: clamp(frame.metrics.report_count / 15, 0, 1) },
  };
}

export function compareSimulationToSavedInvestigation(frame) {
  const profile = frameProfile(frame);
  const components = Object.entries(REFERENCE_PROFILE).map(([id, reference]) => {
    const current = profile[id];
    const similarity = current.available ? clamp(1 - Math.abs(current.value - reference.value), 0, 1) : 0;
    return {
      id,
      label: reference.label,
      available: current.available,
      current: Math.round(current.value * 100),
      reference: Math.round(reference.value * 100),
      similarity: Math.round(similarity * 100),
      weight: reference.weight,
    };
  });
  const available = components.filter((component) => component.available);
  const availableWeight = available.reduce((sum, component) => sum + component.weight, 0);
  const score = availableWeight > 0
    ? Math.round(available.reduce((sum, component) => sum + component.similarity * component.weight, 0) / availableWeight)
    : 0;
  const ranked = available.toSorted((first, second) => second.similarity - first.similarity);
  const strongest_matches = ranked.slice(0, 2).map((component) => `${component.label} ${component.similarity}%`);
  const material_differences = [...components]
    .toSorted((first, second) => first.similarity - second.similarity)
    .slice(0, 2)
    .map((component) => component.available ? `${component.label} differs from the saved pattern` : `${component.label} not present yet`);

  return {
    reference: APRIL_STORM,
    score,
    label: score >= 80 ? "Strong reference match" : score >= 55 ? "Partial reference match" : "Low reference match",
    coverage: { available: available.length, total: components.length, percent: Math.round((available.length / components.length) * 100) },
    components,
    strongest_matches,
    material_differences,
    decision_role: "reference_only",
    automatic_alert: false,
    training_use: "excluded",
    disclaimer: "Pattern similarity only — not a forecast, incident probability or automatic alert.",
  };
}
