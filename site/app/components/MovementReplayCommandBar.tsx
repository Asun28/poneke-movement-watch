"use client";

import type { ReactNode } from "react";
import {
  Broadcast,
  CarProfile,
  PersonSimpleWalk,
  SidebarSimple,
  SquaresFour,
} from "@phosphor-icons/react";
import { InvestigationLayersButton } from "./InvestigationLayersPanel";
import ReplayDensityTimeline from "./ReplayDensityTimeline";
import { formatTimelineTick } from "../movementCanvasModel";
import type { MovementFilter, ReplaySpeed } from "../movementCanvasTypes";

type CurrentStatus = {
  accessible: string;
  primary: string;
  secondary: string;
  scope: string;
};

type TimelinePoint = { target_at: string; activity_count: number };

type MovementReplayCommandBarProps = {
  availableHours: string[];
  evidenceCount: number;
  filter: MovementFilter;
  investigationControl?: ReactNode;
  isEvidenceOpen: boolean;
  isLayerRailOpen: boolean;
  isPlaying: boolean;
  onChangeDateTime: (date: string, hour: string) => void;
  onChangeFilter: (filter: MovementFilter) => void;
  onChangeSpeed: (speed: ReplaySpeed) => void;
  onChangeTimeline: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleCoverage: () => void;
  onToggleEvidence: () => void;
  onToggleLayers: () => void;
  onTogglePlayback: () => void;
  replayCurrentStatus: CurrentStatus | null;
  replayDates: string[];
  replayEnabled: boolean;
  replaySourceSelected: boolean;
  replaySpeed: ReplaySpeed;
  replayTimelinePoints: TimelinePoint[];
  replayWarning: string | null;
  selectedDate: string;
  selectedHour: string;
  selectedLayerCount: number;
  showCoverage: boolean;
  slotCount: number;
  slotIndex: number;
  totalLayerCount: number;
};

export default function MovementReplayCommandBar({
  availableHours,
  evidenceCount,
  filter,
  investigationControl,
  isEvidenceOpen,
  isLayerRailOpen,
  isPlaying,
  onChangeDateTime,
  onChangeFilter,
  onChangeSpeed,
  onChangeTimeline,
  onNext,
  onPrevious,
  onToggleCoverage,
  onToggleEvidence,
  onToggleLayers,
  onTogglePlayback,
  replayCurrentStatus,
  replayDates,
  replayEnabled,
  replaySourceSelected,
  replaySpeed,
  replayTimelinePoints,
  replayWarning,
  selectedDate,
  selectedHour,
  selectedLayerCount,
  showCoverage,
  slotCount,
  slotIndex,
  totalLayerCount,
}: MovementReplayCommandBarProps) {
  return (
    <div className="replay-compact-bar movement-replay-compact" aria-label="Replay controls" data-replay-command-bar="unified" data-replay-toolbar-layout="two-tier" data-replay-density="compact">
      <div className="replay-playback-header" aria-label="Playback header">
        {investigationControl}
        <div className="replay-compact-inputs">
          <label>
            <span>Date</span>
            <input
              type="date"
              aria-label="Replay date"
              value={selectedDate}
              min={replayDates[0]}
              max={replayDates.at(-1)}
              disabled={!replayEnabled}
              onChange={(event) => onChangeDateTime(event.currentTarget.value, selectedHour)}
            />
          </label>
          <label>
            <span>Hour</span>
            <select
              aria-label="Replay hour"
              value={selectedHour}
              disabled={!replayEnabled}
              onChange={(event) => onChangeDateTime(selectedDate, event.currentTarget.value)}
            >
              {(availableHours.length > 0 ? availableHours : ["12"]).map((hour) => (
                <option key={hour} value={hour}>{hour}:00</option>
              ))}
            </select>
          </label>
          <label className="replay-speed-control">
            <span>Speed</span>
            <select
              aria-label="Replay speed"
              value={replaySpeed}
              disabled={!replayEnabled}
              onChange={(event) => onChangeSpeed(Number(event.currentTarget.value) as ReplaySpeed)}
            >
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={4}>4×</option>
            </select>
          </label>
          <div className="replay-buttons">
            <button
              type="button"
              aria-label="Previous replay hour"
              disabled={!replayEnabled || slotIndex === 0}
              onClick={onPrevious}
            >←</button>
            <button
              type="button"
              className="play-button"
              aria-label={isPlaying ? "Pause replay" : "Play replay"}
              aria-pressed={isPlaying}
              disabled={!replayEnabled || slotCount < 2}
              onClick={onTogglePlayback}
            >{isPlaying ? "Pause" : "Play"}</button>
            <button
              type="button"
              aria-label="Next replay hour"
              disabled={!replayEnabled || slotIndex >= slotCount - 1}
              onClick={onNext}
            >→</button>
          </div>
        </div>
        <output className="replay-compact-count" aria-live="polite" aria-label={replaySourceSelected ? replayCurrentStatus?.accessible : "No playable data"}>
          {!replaySourceSelected
            ? "No playable data"
            : replayCurrentStatus
            ? <><strong>{replayCurrentStatus.primary}</strong><span>· {replayCurrentStatus.secondary}</span><em>· {replayCurrentStatus.scope}</em></>
            : "Loading…"}
        </output>
      </div>
      <ReplayDensityTimeline
        points={replayTimelinePoints}
        currentIndex={slotIndex}
        disabled={!replayEnabled}
        densityMeasure="movement-candidates"
        densityLabel="model candidates"
        formatTick={formatTimelineTick}
        onChange={onChangeTimeline}
      />
      <nav className="replay-filter-subbar replay-compact-actions" aria-label="Replay filters and layers">
        <div className="replay-primary-filters" data-replay-filter-zone="primary">
          <div className="filter-group" data-replay-filter-kind="movement-mode" aria-label="Filter movement mode">
            {(["all", "people", "vehicles"] as MovementFilter[]).map((value) => (
              <button
                type="button"
                key={value}
                className={filter === value ? "active" : ""}
                aria-pressed={filter === value}
                onClick={() => onChangeFilter(value)}
              >
                {value === "all" ? (
                  <span className="movement-filter-icon" data-movement-icon="all" aria-hidden="true">
                    <SquaresFour size={17} weight="bold" />
                  </span>
                ) : null}
                {value === "people" ? (
                  <span className="movement-filter-icon" data-movement-icon="people" aria-hidden="true">
                    <PersonSimpleWalk size={17} weight="bold" />
                  </span>
                ) : null}
                {value === "vehicles" ? (
                  <span className="movement-filter-icon" data-movement-icon="vehicle" aria-hidden="true">
                    <CarProfile size={17} weight="bold" />
                  </span>
                ) : null}
                {value === "all" ? "All" : value === "people" ? "People" : "Vehicles"}
              </button>
            ))}
          </div>
          <div className="replay-map-overlays" aria-label="Map overlays">
            <button type="button" data-replay-overlay="sensor-coverage" aria-pressed={showCoverage} aria-label="Sensor coverage" onClick={onToggleCoverage}>
              <span className="movement-filter-icon" data-movement-icon="sensor" aria-hidden="true">
                <Broadcast size={17} weight="bold" />
              </span>
              Coverage
            </button>
          </div>
        </div>
        <div className="replay-primary-actions" data-replay-action-zone="always-visible">
          <InvestigationLayersButton
            open={isLayerRailOpen}
            selectedCount={selectedLayerCount}
            totalCount={totalLayerCount}
            onToggle={onToggleLayers}
          />
          <button
            type="button"
            data-replay-action="evidence"
            data-icon-only="true"
            aria-expanded={isEvidenceOpen}
            aria-label={isEvidenceOpen ? "Hide signal evidence" : "Show signal evidence"}
            title={`Evidence · ${evidenceCount}`}
            onClick={onToggleEvidence}
          >
            <SidebarSimple size={20} weight="regular" aria-hidden="true" />
            <span className="sr-only">{evidenceCount} signals</span>
          </button>
        </div>
      </nav>
      {replayWarning ? <p className="replay-warning" role="status">{replayWarning}</p> : null}
    </div>
  );
}
