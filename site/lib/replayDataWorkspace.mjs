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

export function defaultSensorReplayLayers() {
  return {
    movement_outcomes: true,
    hilltop_observations: true,
    official_impacts: false,
  };
}

export function buildReplayTimelineDensity(points, requestedBins = 48) {
  const validPoints = (Array.isArray(points) ? points : [])
    .map((point) => ({
      target_at: cleanText(point?.target_at),
      target_epoch: epoch(point?.target_at),
      activity_count: Math.max(0, Number(point?.activity_count) || 0),
    }))
    .filter((point) => point.target_epoch !== null)
    .toSorted((first, second) => first.target_epoch - second.target_epoch);
  if (validPoints.length === 0) {
    return {
      measure: "record_activity",
      activity_total: 0,
      peak_activity_count: 0,
      bins: [],
    };
  }

  const desiredBins = Math.max(1, Math.trunc(Number(requestedBins) || 1));
  const binCount = Math.min(desiredBins, validPoints.length);
  const firstEpoch = validPoints[0].target_epoch;
  const lastEpoch = validPoints.at(-1).target_epoch;
  const duration = Math.max(0, lastEpoch - firstEpoch);
  const counts = Array.from({ length: binCount }, () => 0);

  validPoints.forEach((point, pointIndex) => {
    const position = duration > 0
      ? (point.target_epoch - firstEpoch) / duration
      : pointIndex / Math.max(1, validPoints.length - 1);
    const binIndex = Math.min(binCount - 1, Math.floor(position * binCount));
    counts[binIndex] += point.activity_count;
  });

  const peakActivityCount = Math.max(0, ...counts);
  return {
    measure: "record_activity",
    activity_total: counts.reduce((total, count) => total + count, 0),
    peak_activity_count: peakActivityCount,
    bins: counts.map((activityCount, index) => ({
      index,
      activity_count: activityCount,
      height_percent: peakActivityCount > 0
        ? Math.round((activityCount / peakActivityCount) * 100)
        : 0,
    })),
  };
}

export function movementReplayTimelinePoints(slots) {
  return (Array.isArray(slots) ? slots : []).map((slot) => ({
    target_at: cleanText(slot?.target_at),
    activity_count: Math.max(0, Number(slot?.candidate_count) || 0),
  }));
}

export function sensorReplayTimelinePoints(dataset) {
  const activityBySlot = new Map();
  for (const series of dataset?.series ?? []) {
    for (const observation of series?.observations ?? []) {
      const availableAt = cleanText(observation?.available_at);
      if (!availableAt) continue;
      activityBySlot.set(availableAt, (activityBySlot.get(availableAt) ?? 0) + 1);
    }
  }
  return (Array.isArray(dataset?.slots) ? dataset.slots : []).map((targetAt) => ({
    target_at: cleanText(targetAt),
    activity_count: activityBySlot.get(cleanText(targetAt)) ?? 0,
  }));
}

export function buildSensorReplayDataset(pack, investigation, detectorPack = null) {
  const startsAt = epoch(investigation?.starts_at);
  const asOf = epoch(investigation?.as_of);
  const detectorBySeries = new Map((Array.isArray(detectorPack?.series) ? detectorPack.series : [])
    .map((item) => [cleanText(item?.series_id), item]));
  const series = (Array.isArray(pack?.series) ? pack.series : []).map((item) => {
    const detector = detectorBySeries.get(cleanText(item?.series_id)) ?? null;
    const threshold = Number(detector?.baseline?.threshold);
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
      .map((observation) => ({
        ...observation,
        detector_candidate: Number.isFinite(threshold) && Number(observation?.value) > threshold,
        detector_threshold: Number.isFinite(threshold) ? threshold : null,
      }))
      .toSorted((first, second) => epoch(first.available_at) - epoch(second.available_at));
    return {
      id: cleanText(item?.series_id, "sensor-series"),
      site: cleanText(item?.site, "Unknown site"),
      measurement: cleanText(item?.measurement, "Measurement"),
      unit: cleanText(item?.unit),
      cadence_seconds: Number(item?.cadence_seconds)
        || (Number(item?.cadence_minutes) > 0 ? Number(item.cadence_minutes) * 60 : null),
      geometry: item?.geometry ?? null,
      domain: String(item?.measurement ?? "").toLowerCase().includes("rain") ? "rainfall" : "river-flow",
      detector_episode_count: Number(detector?.episode_count) || 0,
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
    detector_candidate_count: Number(detectorPack?.episode_count) || 0,
    detector_observation_count: Number(detectorPack?.candidate_count) || 0,
    detector_model: detectorPack?.model ?? null,
    layer_groups: [
      { id: "rainfall", label: "Rainfall", series_count: series.filter((item) => item.domain === "rainfall").length },
      { id: "river-flow", label: "River flow", series_count: series.filter((item) => item.domain === "river-flow").length },
      { id: "detector-candidates", label: "Detector candidates", series_count: Number(detectorPack?.episode_count) || 0 },
    ],
    series,
    slots,
  };
}

export function sensorReplayFrame(dataset, requestedIndex) {
  const index = clampIndex(requestedIndex, dataset?.slots?.length ?? 0);
  const targetAt = dataset?.slots?.[index] ?? null;
  const targetEpoch = epoch(targetAt);
  if (targetEpoch === null) {
    return {
      index: 0,
      target_at: null,
      readings: [],
      newly_available_count: 0,
      current_reading_count: 0,
      stale_reading_count: 0,
    };
  }

  const readings = [];
  let newlyAvailableCount = 0;
  let staleReadingCount = 0;
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
    const observedEpoch = epoch(observation.observed_at) ?? epoch(observation.available_at);
    const cadenceSeconds = Number(item.cadence_seconds) > 0 ? Number(item.cadence_seconds) : 3600;
    const validUntilEpoch = observedEpoch + cadenceSeconds * 3 * 1000;
    if (targetEpoch > validUntilEpoch) {
      staleReadingCount += 1;
      continue;
    }
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
      age_seconds: Math.max(0, Math.round((targetEpoch - observedEpoch) / 1000)),
      valid_until: new Date(validUntilEpoch).toISOString(),
      temporal_state: "current_at_playhead",
      value: Number(observation.value),
      change: previous ? Number(observation.value) - Number(previous.value) : null,
      detector_candidate: observation.detector_candidate === true,
      detector_threshold: observation.detector_threshold ?? null,
    });
  }

  return {
    index,
    target_at: targetAt,
    readings,
    newly_available_count: newlyAvailableCount,
    current_reading_count: readings.length,
    stale_reading_count: staleReadingCount,
  };
}

export function buildReplayCurrentStatus({ recordCount = 0, gapCount, staleCount } = {}) {
  const count = Math.max(0, Number(recordCount) || 0);
  const hasGaps = gapCount !== undefined;
  const noun = hasGaps ? "signals" : "records";
  const primary = `${count} ${noun}`;
  const gaps = Math.max(0, Number(gapCount) || 0);
  const stale = Math.max(0, Number(staleCount) || 0);
  const secondary = hasGaps
    ? `${gaps} gaps`
    : stale > 0
      ? `${stale} stale hidden`
      : "";
  const accessible = hasGaps
    ? `${primary}, ${gaps} data gaps at selected time`
    : stale > 0
      ? `${primary} at selected time, ${stale} stale records hidden`
      : `${primary} at selected time`;

  return { accessible, primary, secondary, scope: "selected time" };
}

export function movementOutcomeSignalsAt(pack, targetAt) {
  const targetEpoch = epoch(targetAt);
  if (targetEpoch === null) return [];
  const slots = (Array.isArray(pack?.slots) ? pack.slots : [])
    .map((slot) => ({ ...slot, target_epoch: epoch(slot?.target_at) }))
    .filter((slot) => slot.target_epoch !== null)
    .toSorted((first, second) => first.target_epoch - second.target_epoch);
  if (slots.length === 0) return [];

  const slotIndex = slots.findLastIndex((slot) => slot.target_epoch <= targetEpoch);
  if (slotIndex < 0) return [];
  const slot = slots[slotIndex];
  const previousEpoch = slots[slotIndex - 1]?.target_epoch;
  const inferredDuration = previousEpoch === undefined
    ? 60 * 60 * 1000
    : Math.max(1, slot.target_epoch - previousEpoch);
  const validUntil = slots[slotIndex + 1]?.target_epoch ?? slot.target_epoch + inferredDuration;
  if (targetEpoch >= validUntil) return [];
  return Array.isArray(slot.signals) ? slot.signals : [];
}

export function buildSensorReplayLayerStates(frame, movementSignals, officialImpactCount = 0) {
  const readings = Array.isArray(frame?.readings) ? frame.readings : [];
  const countNow = (predicate) => readings.filter(predicate).length;
  const snapshot = (count) => ({ temporal_mode: "snapshot", current_count: count, label: `${count} now` });
  const movementCount = Array.isArray(movementSignals) ? movementSignals.length : 0;
  const staleCount = Math.max(0, Number(frame?.stale_reading_count) || 0);
  const impactCount = Math.max(0, Number(officialImpactCount) || 0);

  return {
    movement_outcomes: {
      temporal_mode: "time_slot",
      current_count: movementCount,
      label: `${movementCount} now`,
    },
    rainfall: snapshot(countNow((reading) => String(reading?.measurement ?? "").toLowerCase().includes("rain"))),
    river_flow: snapshot(countNow((reading) => !String(reading?.measurement ?? "").toLowerCase().includes("rain"))),
    detector_candidates: snapshot(countNow((reading) => reading?.detector_candidate === true)),
    stale_sensors: {
      temporal_mode: "expired",
      current_count: staleCount,
      label: `${staleCount} stale · hidden`,
    },
    official_impacts: {
      temporal_mode: "static_context",
      current_count: null,
      label: `Static context · ${impactCount}`,
    },
  };
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function signedCount(value) {
  const number = finiteNumber(value);
  const formatted = new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 1 }).format(Math.abs(number));
  if (number > 0) return `+${formatted}`;
  if (number < 0) return `−${formatted}`;
  return "0";
}

export function buildMovementEvidenceDetail(signal) {
  const observed = finiteNumber(signal?.observed_count);
  const expected = finiteNumber(signal?.expected_count);
  const observedAt = epoch(signal?.observed_at);
  const history = (Array.isArray(signal?.matched_history) ? signal.matched_history : [])
    .map((point) => ({
      observed_at: cleanText(point?.observed_at),
      observed_count: finiteNumber(point?.observed_count),
    }))
    .filter((point) => {
      const pointAt = epoch(point.observed_at);
      return pointAt !== null && (observedAt === null || pointAt < observedAt);
    })
    .toSorted((first, second) => epoch(first.observed_at) - epoch(second.observed_at));
  const confidence = cleanText(signal?.signal_confidence?.level, "unknown").toLowerCase();
  const change = observed - expected;

  return {
    id: cleanText(signal?.id, "movement-signal"),
    name: cleanText(signal?.name, "Unnamed countline"),
    transport_label: [cleanText(signal?.transport_class), cleanText(signal?.direction)]
      .filter(Boolean)
      .join(" · "),
    change_direction: cleanText(signal?.change_direction, change < 0 ? "decrease" : "increase").toLowerCase(),
    observed,
    expected,
    change,
    change_label: signedCount(change),
    robust_z: finiteNumber(signal?.robust_z),
    observed_at: cleanText(signal?.observed_at),
    history,
    history_count: history.length,
    history_available: history.length > 0,
    baseline_confidence: confidence,
    confidence_basis: cleanText(signal?.signal_confidence?.basis),
    cause: null,
    boundary: "No cause inferred. Check operational context before acting.",
  };
}

export function filterSensorReplayReadings(readings, {
  visibleSeriesIds = new Set(),
  measurementFilter = "all",
} = {}) {
  const selected = visibleSeriesIds instanceof Set ? visibleSeriesIds : new Set(visibleSeriesIds ?? []);
  return (Array.isArray(readings) ? readings : []).filter((reading) => {
    if (!selected.has(reading.series_id)) return false;
    if (!measurementFilter) return false;
    if (measurementFilter === "all") return true;
    if (measurementFilter === "anomaly") return reading.detector_candidate === true;
    return String(reading.measurement ?? "").toLowerCase().includes(measurementFilter);
  });
}

export function toggleSensorEvidenceFilter(currentFilter, requestedFilter) {
  return currentFilter === requestedFilter ? null : requestedFilter;
}

const WELLINGTON_CITY_WEATHER_SERIES = new Set([
  "berhampore-hourly-rainfall",
  "newtown-hourly-rainfall",
  "te-papa-hourly-rainfall",
  "karori-reservoir-hourly-rainfall",
  "seton-nossiter-hourly-rainfall",
]);

export function wellingtonCityWeatherReadings(readings) {
  return (Array.isArray(readings) ? readings : [])
    .filter((reading) => WELLINGTON_CITY_WEATHER_SERIES.has(String(reading?.series_id ?? "")));
}

export function updateVisibleSensorSeries(currentIds, seriesId, checked) {
  const next = new Set(currentIds instanceof Set ? currentIds : currentIds ?? []);
  if (checked) next.add(seriesId);
  else next.delete(seriesId);
  return next;
}
