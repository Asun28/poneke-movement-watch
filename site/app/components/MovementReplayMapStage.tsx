"use client";

import type {
  MouseEventHandler,
  PointerEventHandler,
  RefObject,
} from "react";
import { ArrowCounterClockwise, CornersIn, CornersOut } from "@phosphor-icons/react";
import { OPERATIONAL_BASEMAP } from "../../lib/operationalBasemap.mjs";
import { AdaptiveEvidencePreview } from "./AdaptiveEvidence";
import type { AdaptiveEvidenceModel, EvidenceClusterModel } from "./AdaptiveEvidence";
import MapGroupingControl from "./MapGroupingControl";
import type { MapInspection } from "../movementCanvasTypes";

type MovementReplayMapStageProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  clusterBelowPercent: number;
  coverageCount: number;
  error: string | null;
  filteredSignalCount: number;
  fullscreenMessage: string | null;
  hasPanned: boolean;
  inspectionCluster: EvidenceClusterModel | null;
  inspectionEnabled: boolean;
  inspectionEvidence: AdaptiveEvidenceModel | null;
  isMapFullscreen: boolean;
  isPanning: boolean;
  mapInspection: MapInspection | null;
  mapInteractionRef: RefObject<HTMLDivElement | null>;
  onChangeGrouping: (value: number) => void;
  onInspectMap: MouseEventHandler<HTMLDivElement>;
  onLeaveMap: MouseEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onResetMap: () => void;
  onToggleFullscreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  showBasemap: boolean;
  showCoverage: boolean;
  zoom: number;
};

export default function MovementReplayMapStage({
  canvasRef,
  clusterBelowPercent,
  coverageCount,
  error,
  filteredSignalCount,
  fullscreenMessage,
  hasPanned,
  inspectionCluster,
  inspectionEnabled,
  inspectionEvidence,
  isMapFullscreen,
  isPanning,
  mapInspection,
  mapInteractionRef,
  onChangeGrouping,
  onInspectMap,
  onLeaveMap,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onResetMap,
  onToggleFullscreen,
  onZoomIn,
  onZoomOut,
  showBasemap,
  showCoverage,
  zoom,
}: MovementReplayMapStageProps) {
  return (
    <div className="map-stage replay-map-stage">
      <canvas
        ref={canvasRef}
        role="img"
        data-replay-clustering="screen-space"
        aria-label={`${filteredSignalCount} unusual movement changes across 414 WCC countlines ${showBasemap ? "on the Wellington basemap" : "with the basemap hidden"}.`}
      />
      <div
        ref={mapInteractionRef}
        className="map-inspection-layer"
        aria-label="Paused map inspection layer"
        data-active={inspectionEnabled}
        data-map-selectable={inspectionEnabled}
        data-panning={isPanning}
        onMouseMove={onInspectMap}
        onMouseLeave={onLeaveMap}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />
      <span className="sr-only" aria-live="polite">
        {isPanning
          ? "Moving map."
          : inspectionEnabled
          ? `Paused. ${filteredSignalCount} markers can be inspected.`
          : "Inspection is off during playback. The signal list remains available for keyboard inspection."}
      </span>
      <span className="sr-only">Inspection is off during playback. The signal list remains available for keyboard inspection.</span>
      {mapInspection ? (
        <AdaptiveEvidencePreview
          model={inspectionEvidence}
          cluster={inspectionCluster}
          className="map-hover-card"
          style={{ left: mapInspection.left, top: mapInspection.top }}
        />
      ) : null}
      <div className="map-controls replay-google-map-controls" aria-label="Map controls" data-max-zoom="2000%" data-style="google-vertical" data-corner="top-right">
        <div className="map-zoom-buttons" role="group" aria-label="Map zoom controls">
          <button type="button" aria-label="Zoom in" disabled={zoom >= 20} onClick={onZoomIn}>+</button>
          <button type="button" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={onZoomOut}>−</button>
        </div>
        <div className="map-view-actions">
          <button
            type="button"
            aria-label="Reset map view"
            title="Reset map view"
            disabled={zoom === 1 && !hasPanned}
            onClick={onResetMap}
          ><ArrowCounterClockwise size={18} aria-hidden="true" /></button>
          <button
            type="button"
            aria-label={isMapFullscreen ? "Exit map fullscreen" : "Show map fullscreen"}
            title={isMapFullscreen ? "Exit map fullscreen" : "Show map fullscreen"}
            aria-pressed={isMapFullscreen}
            onClick={onToggleFullscreen}
          >{isMapFullscreen ? <CornersIn size={18} aria-hidden="true" /> : <CornersOut size={18} aria-hidden="true" />}</button>
        </div>
        <MapGroupingControl value={clusterBelowPercent} onChange={onChangeGrouping} />
      </div>
      {fullscreenMessage ? <p className="map-fullscreen-message" role="status">{fullscreenMessage}</p> : null}
      <div className="map-key" data-map-legend="floating-card" aria-label="Movement map legend">
        <div className="map-key-grid">
          <span><i className="increase" />Increase</span>
          <span><i className="decrease" />Decrease</span>
          <span aria-label="Travel direction"><b className="direction-arrow-key" aria-hidden="true">↗</b>Direction</span>
          {showCoverage ? <span><i className="coverage" />Sensor coverage</span> : null}
        </div>
        <div className="map-cluster-key">
          <span data-cluster-state="grouped"><i>2</i>Grouped records</span>
          <span data-cluster-state="selected"><i>2</i>Selected group</span>
        </div>
      </div>
      {showBasemap ? (
        <div className="map-attribution" data-corner="bottom-right-before-controls">
          {OPERATIONAL_BASEMAP.attribution.map((item) => (
            <a key={item.href} href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
          ))}
        </div>
      ) : <div className="map-attribution"><span>Basemap hidden</span></div>}
      {coverageCount === 0 && !error ? <p className="map-message">Loading countlines…</p> : null}
      {error ? <p className="map-message error" role="alert">{error}</p> : null}
    </div>
  );
}
