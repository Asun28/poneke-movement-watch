"use client";

import { useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowsLeftRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  Pulse,
  ShareNetwork,
  SlidersHorizontal,
  SquaresFour,
  Tray,
} from "@phosphor-icons/react";

const destinations = [
  { href: "/dashboard", label: "Dashboard", short: "Dashboard", icon: "dashboard", Icon: SquaresFour },
  { href: "/live", label: "Live Operations", short: "Live", icon: "activity", Icon: Pulse },
  { href: "/alerts", label: "Signal Review", short: "Review", icon: "inbox", Icon: Tray },
  { href: "/replay", label: "Replay Analyzer", short: "Replay", icon: "replay", Icon: ArrowCounterClockwise },
  { href: "/integration", label: "Data Integration", short: "Integrate", icon: "integration", Icon: ArrowsLeftRight },
  { href: "/ontology", label: "Ontology", short: "Ontology", icon: "ontology", Icon: ShareNetwork },
  { href: "/setup", label: "Setup", short: "Setup", icon: "settings", Icon: SlidersHorizontal },
];

const mobileDestinations = destinations.filter(({ href }) => !["/integration", "/ontology"].includes(href));

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
          data-icon-only="true"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed
            ? <CaretDoubleRight size={18} aria-hidden="true" />
            : <CaretDoubleLeft size={18} aria-hidden="true" />}
        </button>
        <nav aria-label="Operator modules">
          {destinations.map((destination) => (
            <a
              key={destination.href}
              href={destination.href}
              aria-current={active === destination.href ? "page" : undefined}
              title={collapsed ? destination.label : undefined}
            >
              <span className="operator-nav-icon" data-nav-icon={destination.icon} aria-hidden="true"><destination.Icon size={18} weight="regular" /></span>
              {!collapsed && destination.label}
            </a>
          ))}
        </nav>
      </aside>
      <nav className="operator-mobile-nav" aria-label="Operator modules" data-icon-alignment="center">
        {mobileDestinations.map((destination) => (
          <a
            key={destination.href}
            href={destination.href}
            aria-current={active === destination.href ? "page" : undefined}
          >
            <span className="operator-nav-icon" data-nav-icon={destination.icon} aria-hidden="true"><destination.Icon size={19} weight="regular" /></span>
            {destination.short}
          </a>
        ))}
      </nav>
    </>
  );
}
