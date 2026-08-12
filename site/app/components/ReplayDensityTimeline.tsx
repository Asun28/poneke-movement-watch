"use client";

import type { CSSProperties } from "react";
import { buildReplayTimelineDensity } from "../../lib/replayDataWorkspace.mjs";

type TimelinePoint = { target_at: string; activity_count: number };

export default function ReplayDensityTimeline({
  points,
  currentIndex,
  disabled,
  densityMeasure,
  densityLabel,
  formatTick,
  onChange,
}: {
  points: TimelinePoint[];
  currentIndex: number;
  disabled: boolean;
  densityMeasure: string;
  densityLabel: string;
  formatTick: (value: string | undefined) => string;
  onChange: (index: number) => void;
}) {
  const maxIndex = Math.max(0, points.length - 1);
  const safeIndex = Math.min(maxIndex, Math.max(0, currentIndex));
  const progress = maxIndex > 0 ? (safeIndex / maxIndex) * 100 : 0;
  const density = buildReplayTimelineDensity(points, 48);
  const currentPoint = points[safeIndex];
  const timelineStyle = {
    "--replay-progress": `${progress}%`,
  } as CSSProperties;

  return (
    <div
      className="replay-timeline"
      data-replay-timeline="activity-density"
      data-density-measure={densityMeasure}
      style={timelineStyle}
    >
      <div className="replay-density-chart" role="img" aria-label="Replay activity density">
        {density.bins.map((bin) => (
          <i
            key={bin.index}
            aria-hidden="true"
            style={{ "--density-height": `${bin.height_percent}%` } as CSSProperties}
          />
        ))}
      </div>
      <span className="replay-timeline-future" data-replay-future="muted" aria-hidden="true" />
      <span className="replay-timeline-playhead" data-replay-playhead="selected-time" aria-hidden="true" />
      <input
        className="replay-compact-scrubber"
        type="range"
        aria-label="Replay timeline"
        aria-valuetext={`${formatTick(currentPoint?.target_at)} · ${currentPoint?.activity_count ?? 0} ${densityLabel}`}
        min={0}
        max={maxIndex}
        value={safeIndex}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <span className="sr-only">
        Activity density shows {density.activity_total} {densityLabel} across the investigation window; it does not show severity.
      </span>
      <div className="replay-timeline-ticks" aria-label="Replay timeline ticks">
        <span>{formatTick(points[0]?.target_at)}</span>
        <strong>{formatTick(currentPoint?.target_at)}</strong>
        <span>{formatTick(points.at(-1)?.target_at)}</span>
      </div>
    </div>
  );
}
