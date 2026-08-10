"use client";

import { useState } from "react";

const destinations = [
  { href: "/live", label: "Live Operations", short: "Live", glyph: "●" },
  { href: "/alerts", label: "Alert Centre", short: "Alerts", glyph: "!" },
  { href: "/replay", label: "Replay Analyzer", short: "Replay", glyph: "↺" },
  { href: "/integration", label: "Data Integration", short: "Integrate", glyph: "⇄" },
  { href: "/ontology", label: "Ontology", short: "Ontology", glyph: "◇" },
  { href: "/setup", label: "Setup", short: "Setup", glyph: "+" },
];

export default function OperatorNavigation({ active }: { active: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside className={`operator-sidebar${collapsed ? " is-collapsed" : ""}`}>
        <div className="operator-brand-block">
          <span className="brand-mark" aria-hidden="true">M05</span>
          {!collapsed && (
            <span>
              <strong>Pōneke watch</strong>
              <small>WCC operations</small>
            </span>
          )}
        </div>
        <button
          className="operator-nav-toggle"
          type="button"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((value) => !value)}
        >
          <span aria-hidden="true">{collapsed ? "›" : "‹"}</span>
          {!collapsed && "Hide menu"}
        </button>
        <nav aria-label="Operator modules">
          {destinations.map((destination) => (
            <a
              key={destination.href}
              href={destination.href}
              aria-current={active === destination.href ? "page" : undefined}
              title={collapsed ? destination.label : undefined}
            >
              <span aria-hidden="true">{destination.glyph}</span>
              {!collapsed && destination.label}
            </a>
          ))}
        </nav>
      </aside>
      <nav className="operator-mobile-nav" aria-label="Operator modules">
        {destinations.map((destination) => (
          <a
            key={destination.href}
            href={destination.href}
            aria-current={active === destination.href ? "page" : undefined}
          >
            <span aria-hidden="true">{destination.glyph}</span>
            {destination.short}
          </a>
        ))}
      </nav>
    </>
  );
}
