function cleanText(value, fallback = "") {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text || fallback;
}

function epoch(value) {
  const time = new Date(value ?? "").getTime();
  return Number.isFinite(time) ? time : null;
}

function clampIndex(value, length) {
  if (length <= 0) return 0;
  const index = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0;
  return Math.min(length - 1, Math.max(0, index));
}

export function replayDatasetKind(investigation) {
  return investigation?.source_id === "gwrc-hilltop" ? "sensor" : "movement";
}

export function buildSensorReplayDataset(pack, investigation) {
  const startsAt = epoch(investigation?.starts_at);
  const asOf = epoch(investigation?.as_of);
  const series = (Array.isArray(pack?.series) ? pack.series : []).map((item) => {
    const observations = (Array.isArray(item?.observations) ? item.observations : [])
      .filter((observation) => {
        const observedAt = epoch(observation?.observed_at);
        const availableAt = epoch(observation?.available_at);
        return observedAt !== null
          && availableAt !== null
          && (startsAt === null || observedAt >= startsAt)
          && (asOf === null || observedAt <= asOf)
          && (asOf === null || availableAt <= asOf);
      })
      .toSorted((first, second) => epoch(first.available_at) - epoch(second.available_at));
    return {
      id: cleanText(item?.series_id, "sensor-series"),
      site: cleanText(item?.site, "Unknown site"),
      measurement: cleanText(item?.measurement, "Measurement"),
      unit: cleanText(item?.unit),
      cadence_seconds: Number(item?.cadence_seconds) || null,
      geometry: item?.geometry ?? null,
      observations,
    };
  }).filter((item) => item.observations.length > 0);

  const slots = [...new Set(series.flatMap((item) => item.observations.map((observation) => observation.available_at)))]
    .toSorted((first, second) => epoch(first) - epoch(second));
  const playableRecordCount = series.reduce((total, item) => total + item.observations.length, 0);

  return {
    id: cleanText(investigation?.id, "sensor-replay"),
    kind: "sensor",
    title: cleanText(investigation?.title, "Sensor replay"),
    source_id: cleanText(investigation?.source_id ?? pack?.source_id, "gwrc-hilltop"),
    truth: cleanText(pack?.truth, "historical_observations"),
    starts_at: investigation?.starts_at ?? null,
    as_of: investigation?.as_of ?? null,
    available_from: slots[0] ?? null,
    available_to: slots.at(-1) ?? null,
    default_target_at: slots.at(-1) ?? null,
    total_record_count: Number(pack?.record_count) || playableRecordCount,
    playable_record_count: playableRecordCount,
    excluded_record_count: Math.max(0, (Number(pack?.record_count) || playableRecordCount) - playableRecordCount),
    series,
    slots,
  };
}

export function sensorReplayFrame(dataset, requestedIndex) {
  const index = clampIndex(requestedIndex, dataset?.slots?.length ?? 0);
  const targetAt = dataset?.slots?.[index] ?? null;
  const targetEpoch = epoch(targetAt);
  if (targetEpoch === null) {
    return { index: 0, target_at: null, readings: [], newly_available_count: 0 };
  }

  const readings = [];
  let newlyAvailableCount = 0;
  for (const item of dataset.series ?? []) {
    let currentIndex = -1;
    for (let observationIndex = item.observations.length - 1; observationIndex >= 0; observationIndex -= 1) {
      const observation = item.observations[observationIndex];
      if (epoch(observation.available_at) <= targetEpoch) {
        currentIndex = observationIndex;
        break;
      }
    }
    newlyAvailableCount += item.observations.filter((observation) => observation.available_at === targetAt).length;
    if (currentIndex < 0) continue;
    const observation = item.observations[currentIndex];
    const previous = item.observations[currentIndex - 1];
    readings.push({
      id: `${item.id}:${observation.available_at}`,
      series_id: item.id,
      site: item.site,
      measurement: item.measurement,
      unit: item.unit,
      geometry: item.geometry,
      observed_at: observation.observed_at,
      available_at: observation.available_at,
      available_at_quality: observation.available_at_quality ?? null,
      value: Number(observation.value),
      change: previous ? Number(observation.value) - Number(previous.value) : null,
    });
  }

  return { index, target_at: targetAt, readings, newly_available_count: newlyAvailableCount };
}
