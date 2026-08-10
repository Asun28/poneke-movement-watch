import { eventSymbolById } from "../../lib/liveMapWorkspace.mjs";

export default function EventSymbolBadge({
  symbolId,
  decorative = false,
}: {
  symbolId: string;
  decorative?: boolean;
}) {
  const symbol = eventSymbolById(symbolId);
  return (
    <span
      className={`event-symbol-token symbol-${symbol.id}`}
      data-event-symbol={symbol.id}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : symbol.label}
      style={{ "--event-symbol-colour": symbol.colour } as React.CSSProperties}
    >{symbol.glyph}</span>
  );
}
