import { readFileSync } from "node:fs";

export function readAppStyles(entry = new URL("../app/globals.css", import.meta.url), seen = new Set()) {
  if (seen.has(entry.href)) return "";
  seen.add(entry.href);
  const source = readFileSync(entry, "utf8");
  const imports = [...source.matchAll(/@import\s+["'](\.[^"']+)["'];/g)]
    .map((match) => readAppStyles(new URL(match[1], entry), seen));
  return [source, ...imports].join("\n");
}
