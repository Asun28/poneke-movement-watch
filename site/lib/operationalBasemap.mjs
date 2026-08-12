const TILE_SUBDOMAINS = ["a", "b", "c", "d"];

export const OPERATIONAL_BASEMAP = Object.freeze({
  id: "carto-positron",
  label: "Calm streets",
  attribution: Object.freeze([
    Object.freeze({
      label: "© OpenStreetMap contributors",
      href: "https://www.openstreetmap.org/copyright",
    }),
    Object.freeze({
      label: "© CARTO",
      href: "https://carto.com/attributions",
    }),
  ]),
});

export function operationalBasemapTileUrl({ zoom, x, y, pixelRatio = 1 }) {
  const subdomain = TILE_SUBDOMAINS[Math.abs(x + y) % TILE_SUBDOMAINS.length];
  const scale = pixelRatio >= 1.5 ? "@2x" : "";
  return `https://${subdomain}.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}${scale}.png`;
}
