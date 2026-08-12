"use client";

import { SlidersHorizontal } from "@phosphor-icons/react";

const GROUPING_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 75, label: "75%" },
  { value: 100, label: "100%" },
  { value: 150, label: "150%" },
  { value: 200, label: "200%" },
  { value: 300, label: "300%" },
];

export default function MapGroupingControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <details className="map-grouping-control">
      <summary aria-label="Grouping settings" title="Grouping settings">
        <SlidersHorizontal size={19} weight="regular" aria-hidden="true" />
      </summary>
      <div className="map-grouping-menu">
        <label>
          <span>Group records below zoom</span>
          <select
            aria-label="Group records below zoom"
            value={value}
            onChange={(event) => onChange(Number(event.currentTarget.value))}
          >
            {GROUPING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
    </details>
  );
}
