const WELLINGTON_BOUNDS = { west: 174.45, east: 175.25, south: -41.75, north: -40.7 };

export function normaliseProviderTime(value) {
  if (value === null || value === undefined || value === "") return null;
  const epoch = typeof value === "number" && Math.abs(value) < 100_000_000_000
    ? value * 1000
    : value;
  const date = typeof epoch === "number" ? new Date(epoch) : new Date(String(epoch));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function inWellington(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return false;
  const [longitude, latitude] = coordinates;
  return longitude >= WELLINGTON_BOUNDS.west
    && longitude <= WELLINGTON_BOUNDS.east
    && latitude >= WELLINGTON_BOUNDS.south
    && latitude <= WELLINGTON_BOUNDS.north;
}

async function fetchResponse(fetchImpl, url, accept) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("provider timeout"), 4500);
  try {
    const response = await fetchImpl(url, {
      headers: { accept, "user-agent": "Poneke-Movement-Watch/0.13 prototype" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`upstream HTTP ${response.status}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(fetchImpl, url) {
  return (await fetchResponse(fetchImpl, url, "application/json, application/geo+json")).json();
}

function unescapeXml(value) {
  return String(value ?? "")
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function xmlTag(block, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"));
  return match ? unescapeXml(match[1]) : null;
}

function capPolygon(value) {
  if (!value) return null;
  const coordinates = value.split(/\s+/).map((pair) => {
    const [latitude, longitude] = pair.split(",").map(Number);
    return [longitude, latitude];
  }).filter(([longitude, latitude]) => Number.isFinite(longitude) && Number.isFinite(latitude));
  if (coordinates.length < 3) return null;
  const west = Math.min(...coordinates.map(([longitude]) => longitude));
  const east = Math.max(...coordinates.map(([longitude]) => longitude));
  const south = Math.min(...coordinates.map(([, latitude]) => latitude));
  const north = Math.max(...coordinates.map(([, latitude]) => latitude));
  const intersectsWellington = east >= WELLINGTON_BOUNDS.west
    && west <= WELLINGTON_BOUNDS.east
    && north >= WELLINGTON_BOUNDS.south
    && south <= WELLINGTON_BOUNDS.north;
  if (!intersectsWellington) return null;
  if (coordinates[0][0] !== coordinates.at(-1)[0] || coordinates[0][1] !== coordinates.at(-1)[1]) {
    coordinates.push([...coordinates[0]]);
  }
  return { type: "Polygon", coordinates: [coordinates] };
}

export function parseRssObservations(text, sourceId, kind, now) {
  const items = text.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
  return items.map((item, index) => {
    const embedded = xmlTag(item, "content:encoded") ?? item;
    const title = xmlTag(item, "title") ?? xmlTag(embedded, "headline") ?? "Official alert";
    const identifier = xmlTag(embedded, "identifier") ?? xmlTag(item, "guid") ?? `${sourceId}:${index}`;
    const sent = normaliseProviderTime(xmlTag(embedded, "sent") ?? xmlTag(item, "pubDate"));
    const effective = normaliseProviderTime(xmlTag(embedded, "effective"));
    const expires = normaliseProviderTime(xmlTag(embedded, "expires"));
    return {
      id: `${sourceId}:${identifier}`,
      kind,
      observed_at: now.toISOString(),
      geometry: capPolygon(xmlTag(embedded, "polygon")),
      properties: {
        headline: title,
        sent_at: sent,
        event: xmlTag(embedded, "event"),
        severity: xmlTag(embedded, "severity") ?? "Unknown",
        urgency: xmlTag(embedded, "urgency") ?? "Unknown",
        certainty: xmlTag(embedded, "certainty") ?? "Unknown",
        effective,
        expires,
        area_description: xmlTag(embedded, "areaDesc"),
        link: xmlTag(item, "link"),
      },
    };
  }).filter((observation) => !observation.properties.expires || new Date(observation.properties.expires) >= now);
}

async function rssAdapter(fetchImpl, contract, now, kind) {
  const response = await fetchResponse(fetchImpl, contract.endpoint, "application/rss+xml, application/xml, text/xml");
  const text = await response.text();
  const observations = parseRssObservations(text, contract.source_id, kind, now);
  return { raw_record_count: observations.length, observations };
}

function arcgisFeatureId(feature, fallback) {
  return feature.id ?? feature.properties?.OBJECTID ?? feature.properties?.FID ?? fallback;
}

function pointCoordinates(geometry) {
  if (geometry?.type === "Point") return geometry.coordinates;
  if (geometry?.type === "LineString") return geometry.coordinates[Math.floor(geometry.coordinates.length / 2)];
  if (geometry?.type === "MultiLineString") return geometry.coordinates[0]?.[0];
  return null;
}

export function isActiveProviderEvent(properties, now) {
  const starts = normaliseProviderTime(properties?.StartDate ?? properties?.Start_Date);
  const ends = normaliseProviderTime(
    properties?.EndDate
      ?? properties?.End_Date
      ?? properties?.ExpectedResolutionDate,
  );
  const status = String(properties?.Status ?? "").toLowerCase();
  if (["resolved", "closed", "cancelled", "completed"].includes(status)) return false;
  return (!starts || new Date(starts) <= now) && (!ends || new Date(ends) >= now);
}

export function makeLiveAdapters(fetchImpl = fetch) {
  return {
    "gwrc-hilltop": async ({ contract }) => {
      const payload = await fetchJson(fetchImpl, contract.endpoint);
      const observations = (payload.features ?? []).filter((feature) => (
        inWellington(pointCoordinates(feature.geometry))
      )).map((feature, index) => ({
        id: `gwrc-rain:${arcgisFeatureId(feature, index)}`,
        kind: "hazard_measurement_observation",
        observed_at: normaliseProviderTime(feature.properties?.LatestTime),
        geometry: feature.geometry,
        properties: {
          site_id: feature.properties?.SiteID,
          latest_rainfall: feature.properties?.LatestRainfall,
          rainfall_6h: feature.properties?.RainTot6Hrs,
          unit: "mm",
        },
      }));
      return { raw_record_count: payload.features?.length ?? 0, observations };
    },
    "nzta-road-events": async ({ contract, now }) => {
      const payload = await fetchJson(fetchImpl, contract.endpoint);
      const observedAt = normaliseProviderTime(payload.lastUpdated) ?? now.toISOString();
      const observations = (payload.features ?? []).filter((feature) => (
        inWellington(pointCoordinates(feature.geometry))
        && isActiveProviderEvent(feature.properties, now)
      )).map((feature, index) => ({
        id: `nzta-road:${feature.properties?.ExternalId ?? feature.id ?? index}`,
        kind: "road_event_observation",
        observed_at: observedAt,
        geometry: feature.geometry,
        properties: {
          name: feature.properties?.LocationArea ?? feature.properties?.EventDescription ?? "NZTA road event",
          event_type: feature.properties?.EventType,
          impact: feature.properties?.Impact,
          status: feature.properties?.Status,
          is_planned: feature.properties?.IsPlanned,
          start_at: normaliseProviderTime(feature.properties?.StartDate),
          end_at: normaliseProviderTime(feature.properties?.EndDate),
          expected_resolution_at: normaliseProviderTime(feature.properties?.ExpectedResolutionDate),
        },
      }));
      return { raw_record_count: payload.features?.length ?? 0, observations };
    },
    "metservice-cap": async ({ contract, now }) => rssAdapter(
      fetchImpl,
      contract,
      now,
      "hazard_alert_observation",
    ),
    "geonet-quakes": async ({ contract, now }) => {
      const payload = await fetchJson(fetchImpl, contract.endpoint);
      const observations = (payload.features ?? []).filter((feature) => inWellington(feature.geometry?.coordinates)).map((feature, index) => ({
        id: `geonet-quake:${feature.properties?.publicID ?? index}`,
        kind: "earthquake_observation",
        observed_at: normaliseProviderTime(feature.properties?.time) ?? now.toISOString(),
        geometry: feature.geometry,
        properties: {
          public_id: feature.properties?.publicID,
          magnitude: feature.properties?.magnitude,
          mmi: feature.properties?.mmi,
          depth_km: feature.properties?.depth ?? feature.geometry?.coordinates?.[2],
          locality: feature.properties?.locality,
          quality: feature.properties?.quality,
        },
      }));
      return { raw_record_count: payload.features?.length ?? 0, observations };
    },
    "geonet-tilde-wlgt": async ({ contract }) => {
      const payload = await fetchJson(fetchImpl, contract.endpoint);
      const series = Array.isArray(payload) ? payload[0] : null;
      const rows = Array.isArray(series?.data) ? series.data : [];
      const latest = rows.toSorted((a, b) => String(a.ts).localeCompare(String(b.ts))).at(-1);
      const observations = latest ? [{
        id: `geonet-tilde-wlgt:${latest.ts}`,
        kind: "sea_level_measurement",
        observed_at: normaliseProviderTime(latest.ts),
        geometry: { type: "Point", coordinates: [series.longitude, series.latitude] },
        properties: {
          value: latest.val,
          error: latest.err,
          qc: latest.qc,
          unit: series.valueUnit,
          method: series.series?.method,
        },
      }] : [];
      return { raw_record_count: rows.length, observations };
    },
    "wcc-road-closures": async ({ contract, now }) => {
      const payload = await fetchJson(fetchImpl, contract.endpoint);
      const observations = (payload.features ?? []).filter((feature) => {
        const approved = feature.properties?.Approved;
        const approvedText = String(approved ?? "").toLowerCase();
        const isApproved = approved === true
          || approved === 1
          || approvedText === "yes"
          || approvedText === "approved";
        const starts = normaliseProviderTime(feature.properties?.Start_Date);
        const ends = normaliseProviderTime(feature.properties?.End_Date);
        return isApproved
          && (!starts || new Date(starts) <= now)
          && (!ends || new Date(ends) >= now);
      }).map((feature, index) => ({
        id: `wcc-road-closure:${arcgisFeatureId(feature, index)}`,
        kind: "official_access_event_observation",
        observed_at: now.toISOString(),
        geometry: feature.geometry,
        properties: {
          name: feature.properties?.Event_Name ?? "WCC road event",
          event_type: feature.properties?.EventType,
          approved: feature.properties?.Approved,
          start_at: normaliseProviderTime(feature.properties?.Start_Date),
          end_at: normaliseProviderTime(feature.properties?.End_Date),
          symbology: feature.properties?.Symbology,
        },
      }));
      return { raw_record_count: payload.features?.length ?? 0, observations };
    },
    "wcc-emergency-assistance-centres": async ({ contract, now }) => {
      const separator = contract.endpoint.includes("?") ? "&" : "?";
      const url = `${contract.endpoint}${separator}where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson`;
      const payload = await fetchJson(fetchImpl, url);
      const observations = (payload.features ?? []).map((feature, index) => ({
        id: `wcc-eac:${arcgisFeatureId(feature, index)}`,
        kind: "response_capability_observation",
        observed_at: now.toISOString(),
        geometry: feature.geometry,
        properties: { ...feature.properties },
      }));
      return { raw_record_count: payload.features?.length ?? 0, observations };
    },
    "nzta-traffic-cameras": async ({ contract, now }) => {
      const payload = await fetchJson(fetchImpl, contract.endpoint);
      const observedAt = normaliseProviderTime(payload.lastUpdated) ?? now.toISOString();
      const observations = (payload.features ?? []).filter((feature) => inWellington(feature.geometry?.coordinates)).map((feature, index) => ({
        id: `nzta-camera:${feature.properties?.ExternalId ?? feature.id ?? index}`,
        kind: "visual_access_context",
        observed_at: observedAt,
        geometry: feature.geometry,
        properties: {
          name: feature.properties?.Name,
          direction: feature.properties?.Direction,
          offline: feature.properties?.Offline,
          under_maintenance: feature.properties?.UnderMaintenance,
        },
      }));
      return { raw_record_count: payload.features?.length ?? 0, observations };
    },
    "nema-public-ema-cap": async ({ contract, now }) => rssAdapter(
      fetchImpl,
      contract,
      now,
      "official_alert_observation",
    ),
    "gwrc-parks-notices": async ({ contract, now }) => {
      const payload = await fetchJson(fetchImpl, contract.endpoint);
      const parks = Array.isArray(payload) ? payload : [];
      const observations = parks.flatMap((park, parkIndex) => (park.notices ?? []).map((notice, noticeIndex) => ({
        id: `gwrc-park:${parkIndex}:${noticeIndex}`,
        kind: "official_access_notice_context",
        observed_at: now.toISOString(),
        geometry: null,
        properties: {
          park: park.name,
          address: park.address,
          title: notice.title,
          message: notice.message,
          severe: notice.severe,
        },
      })));
      return { raw_record_count: observations.length, observations };
    },
  };
}
