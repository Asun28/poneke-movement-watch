"use client";

import { ReactNode, useEffect, useMemo, useReducer, useState } from "react";
import { buildAdaptiveEvidenceClusterModel, buildAdaptiveEvidenceModel } from "../lib/adaptiveEvidence.mjs";
import {
  MOVEMENT_REPLAY_SOURCE_ID,
  canInspectSelectedSources,
  canReplaySelectedSources,
  playableSignalsForSources,
  replayIntervalMs,
  toggleSourceSelection,
} from "./layerModel.mjs";
import InvestigationLayersPanel from "./components/InvestigationLayersPanel";
import { buildReplayCurrentStatus, movementReplayTimelinePoints } from "../lib/replayDataWorkspace.mjs";
import {
  movementEvidenceRecord,
  PEOPLE,
  replaySignalFeature,
  signalKey,
} from "./movementCanvasModel";
import type {
  FeatureCollection,
  LineFeature,
  ReplayPayload,
  ReplaySpeed,
} from "./movementCanvasTypes";
import ReplayLayerWorkspace from "./components/ReplayLayerWorkspace";
import MovementReplayCommandBar from "./components/MovementReplayCommandBar";
import MovementReplayEvidence from "./components/MovementReplayEvidence";
import MovementReplayMapStage from "./components/MovementReplayMapStage";
import { INITIAL_REPLAY_UI_STATE, replayUiReducer } from "./movementReplayUi";
import { useReplaySourceWorkspace } from "./useReplaySourceWorkspace";
import { useMovementReplayMap } from "./useMovementReplayMap";
export default function MovementCanvas({ investigation, investigationControl }: {
  investigation?: { id: string; title: string; starts_at: string; as_of: string; default_target_at?: string };
  investigationControl?: ReactNode;
}) {
  const [coverage, setCoverage] = useState<LineFeature[]>([]);
  const [snapshotSignals, setSnapshotSignals] = useState<LineFeature[]>([]);
  const [replay, setReplay] = useState<ReplayPayload | null>(null);
  const [slotIndex, setSlotIndex] = useState(0);
  const [ui, dispatchUi] = useReducer(replayUiReducer, INITIAL_REPLAY_UI_STATE);
  const { filter, isEvidenceOpen, isPlaying, mapInspection, selectedSignalKey } = ui;
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed>(1);
  const [error, setError] = useState<string | null>(null);
  const [replayWarning, setReplayWarning] = useState<string | null>(null);
  const [isLayerRailOpen, setIsLayerRailOpen] = useState(false);
  const [showBasemap, setShowBasemap] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);
  const [symbolSize, setSymbolSize] = useState(10);
  const {
    customMarkerImage,
    movementIconSource,
    saveInvestigationSource,
    selectedSourceIds,
    setSelectedSourceIds,
    sourceLayers,
    sourceStorageNotice,
  } = useReplaySourceWorkspace();

  useEffect(() => {
    Promise.all([
      fetch("/cop/v1/countline-coverage.geojson").then((response) => response.json()),
      fetch("/cop/v1/movement-signals.geojson").then((response) => response.json()),
    ])
      .then(([coverageData, signalData]: FeatureCollection[]) => {
        setCoverage(coverageData.features);
        setSnapshotSignals(signalData.features);
        dispatchUi({
          type: "signal_selected",
          signalKey: signalData.features[0] ? signalKey(signalData.features[0]) : null,
        });
      })
      .catch(() => setError("The replay files could not be loaded. Check the COP feed."));

    fetch("/cop/v1/movement-replay.json")
      .then((response) => {
        if (!response.ok) throw new Error("replay unavailable");
        return response.json();
      })
      .then((payload: ReplayPayload) => {
        const startsAt = investigation?.starts_at ? new Date(investigation.starts_at).getTime() : null;
        const asOf = investigation?.as_of ? new Date(investigation.as_of).getTime() : null;
        const slots = payload.slots.filter((slot) => {
          const targetAt = new Date(slot.target_at).getTime();
          return (startsAt === null || targetAt >= startsAt) && (asOf === null || targetAt <= asOf);
        });
        if (slots.length === 0) throw new Error("no replay records in investigation window");
        const boundedPayload = {
          ...payload,
          available_from: slots[0].target_at,
          available_to: slots.at(-1)?.target_at ?? slots[0].target_at,
          default_target_at: investigation?.default_target_at ?? payload.default_target_at,
          slots,
        };
        setReplay(boundedPayload);
        const defaultIndex = slots.findIndex(
          (slot) => slot.target_at === boundedPayload.default_target_at,
        );
        setSlotIndex(defaultIndex >= 0 ? defaultIndex : slots.length - 1);
      })
      .catch(() => setReplayWarning("History replay is unavailable; showing the published snapshot."));
  }, [investigation?.as_of, investigation?.default_target_at, investigation?.starts_at]);

  const coverageByCountline = useMemo(() => new Map(
    coverage.map((feature) => [String(feature.properties.countline_id), feature]),
  ), [coverage]);
  const currentSlot = replay?.slots[slotIndex];
  const signals = useMemo(() => {
    if (!currentSlot) return snapshotSignals;
    return currentSlot.signals
      .map((signal) => replaySignalFeature(signal, coverageByCountline))
      .filter((feature): feature is LineFeature => feature !== null);
  }, [coverageByCountline, currentSlot, snapshotSignals]);
  const replaySourceSelected = canReplaySelectedSources(selectedSourceIds, sourceLayers);
  const inspectionEnabled = canInspectSelectedSources(
    isPlaying,
    selectedSourceIds,
    sourceLayers,
  );
  const selectedLayerSignals = useMemo(
    () => playableSignalsForSources(signals, selectedSourceIds, sourceLayers) as LineFeature[],
    [selectedSourceIds, signals, sourceLayers],
  );
  const filteredSignals = useMemo(() => selectedLayerSignals.filter((feature) => {
    const mode = String(feature.properties.transport_class);
    if (filter === "people") return PEOPLE.has(mode);
    if (filter === "vehicles") return !PEOPLE.has(mode);
    return true;
  }), [selectedLayerSignals, filter]);

  const selected = filteredSignals.find(
    (feature) => signalKey(feature) === selectedSignalKey,
  ) ?? filteredSignals[0];
  const selectedEvidence = selected
    ? buildAdaptiveEvidenceModel(movementEvidenceRecord(selected), {
      case_id: "august-movement-review-2026",
      source_label: "WCC Transport Sensors",
      truth_label: "Batch replay",
    })
    : null;
  const inspectionEvidence = mapInspection?.count === 1
    ? buildAdaptiveEvidenceModel(movementEvidenceRecord(mapInspection.feature), {
      case_id: "august-movement-review-2026",
      source_label: "WCC Transport Sensors",
      truth_label: "Batch replay",
    })
    : null;
  const inspectionCluster = mapInspection?.count && mapInspection.count > 1
    ? buildAdaptiveEvidenceClusterModel(mapInspection.features.map(movementEvidenceRecord), {
      case_id: "august-movement-review-2026",
    })
    : null;
  const {
    adjustZoom,
    canvasRef,
    clusterBelowPercent,
    finishMapPan,
    fullscreenMessage,
    hasPanned,
    inspectMap,
    isMapFullscreen,
    isPanning,
    leaveMap,
    mapInteractionRef,
    mapStageRef,
    moveMapPan,
    resetMapView,
    setClusterBelowPercent,
    startMapPan,
    toggleMapFullscreen,
    zoom,
  } = useMovementReplayMap({
    coverage,
    customMarkerImage,
    dispatchUi,
    filteredSignals,
    inspectionEnabled,
    movementIconSource,
    selectedId: selected?.id ?? null,
    showBasemap,
    showCoverage,
    symbolSize,
  });

  useEffect(() => {
    if (!isPlaying || !replay || !replaySourceSelected) return;
    const timer = window.setInterval(() => {
      setSlotIndex((current) => {
        if (current >= replay.slots.length - 1) {
          dispatchUi({ type: "playing_changed", isPlaying: false });
          return current;
        }
        return current + 1;
      });
    }, replayIntervalMs(replaySpeed));
    return () => window.clearInterval(timer);
  }, [isPlaying, replay, replaySourceSelected, replaySpeed]);

  const replayDates = useMemo(() => replay
    ? [...new Set(replay.slots.map((slot) => slot.target_at.slice(0, 10)))]
    : [], [replay]);
  const selectedDate = currentSlot?.target_at.slice(0, 10) ?? "2026-08-06";
  const selectedHour = currentSlot?.target_at.slice(11, 13) ?? "12";
  const availableHours = replay?.slots
    .filter((slot) => slot.target_at.startsWith(selectedDate))
    .map((slot) => slot.target_at.slice(11, 13)) ?? [];
  const selectDateAndHour = (date: string, hour: string) => {
    if (!replay || !replaySourceSelected) return;
    const exact = replay.slots.findIndex(
      (slot) => slot.target_at.startsWith(`${date}T${hour}:`),
    );
    const firstOnDate = replay.slots.findIndex((slot) => slot.target_at.startsWith(`${date}T`));
    if (exact >= 0) setSlotIndex(exact);
    else if (firstOnDate >= 0) setSlotIndex(firstOnDate);
    dispatchUi({ type: "timeline_changed" });
  };
  const replayEnabled = Boolean(replay && replaySourceSelected);
  const replayCurrentStatus = currentSlot
    ? buildReplayCurrentStatus({
        recordCount: currentSlot.candidate_count,
        gapCount: currentSlot.data_gap_groups,
      })
    : null;
  const replayTimelinePoints = useMemo(
    () => movementReplayTimelinePoints(replay?.slots),
    [replay],
  );
  const toggleSource = (sourceId: string) => {
    dispatchUi({
      type: "sources_changed",
      stopPlayback: sourceId === MOVEMENT_REPLAY_SOURCE_ID && selectedSourceIds.has(sourceId),
    });
    setSelectedSourceIds((current) => toggleSourceSelection(current, sourceId));
  };

  return (
    <section
      id="replay-map"
      ref={mapStageRef}
      className="investigation-frame replay-map-workspace"
      aria-label={`${investigation?.title ?? "Movement changes"} replay map`}
      data-replay-map-first="true"
      data-replay-time-policy="playhead-bound"
      data-replay-dataset="movement"
      data-delta-encoding="signed-centre-bar"
      data-marker-direction="icon-arrow"
    >
      <InvestigationLayersPanel open={isLayerRailOpen} onClose={() => setIsLayerRailOpen(false)}>
        <ReplayLayerWorkspace
          sources={sourceLayers}
          showBasemap={showBasemap}
          showCoverage={showCoverage}
          symbolSize={symbolSize}
          selectedSourceIds={selectedSourceIds}
          sourceStorageNotice={sourceStorageNotice}
          onSetBasemap={setShowBasemap}
          onSetCoverage={setShowCoverage}
          onSetSymbolSize={setSymbolSize}
          onToggleSource={toggleSource}
          onSelectAllSources={() => {
            setSelectedSourceIds(new Set(sourceLayers.map((source) => source.id)));
            dispatchUi({ type: "sources_changed", stopPlayback: false });
          }}
          onReplayOnly={() => {
            setSelectedSourceIds(new Set([MOVEMENT_REPLAY_SOURCE_ID]));
            dispatchUi({ type: "sources_changed", stopPlayback: false });
          }}
          onClearSources={() => {
            setSelectedSourceIds(new Set());
            dispatchUi({ type: "sources_changed", stopPlayback: true });
          }}
          onSaveSource={saveInvestigationSource}
        />
      </InvestigationLayersPanel>
      <div className="map-column">
        <MovementReplayCommandBar
          availableHours={availableHours}
          evidenceCount={filteredSignals.length}
          filter={filter}
          investigationControl={investigationControl}
          isEvidenceOpen={isEvidenceOpen}
          isLayerRailOpen={isLayerRailOpen}
          isPlaying={isPlaying}
          onChangeDateTime={selectDateAndHour}
          onChangeFilter={(value) => dispatchUi({ type: "filter_changed", filter: value })}
          onChangeSpeed={setReplaySpeed}
          onChangeTimeline={(index) => {
            setSlotIndex(index);
            dispatchUi({ type: "timeline_changed" });
          }}
          onNext={() => {
            setSlotIndex((value) => Math.min((replay?.slots.length ?? 1) - 1, value + 1));
            dispatchUi({ type: "timeline_changed" });
          }}
          onPrevious={() => {
            setSlotIndex((value) => Math.max(0, value - 1));
            dispatchUi({ type: "timeline_changed" });
          }}
          onToggleCoverage={() => setShowCoverage((value) => !value)}
          onToggleEvidence={() => dispatchUi({
            type: "evidence_visibility_changed",
            isOpen: !isEvidenceOpen,
          })}
          onToggleLayers={() => setIsLayerRailOpen((value) => !value)}
          onTogglePlayback={() => dispatchUi({
            type: "playing_changed",
            isPlaying: !isPlaying,
            clearEvidence: true,
          })}
          replayCurrentStatus={replayCurrentStatus}
          replayDates={replayDates}
          replayEnabled={replayEnabled}
          replaySourceSelected={replaySourceSelected}
          replaySpeed={replaySpeed}
          replayTimelinePoints={replayTimelinePoints}
          replayWarning={replayWarning}
          selectedDate={selectedDate}
          selectedHour={selectedHour}
          selectedLayerCount={selectedSourceIds.size + Number(showBasemap) + Number(showCoverage)}
          showCoverage={showCoverage}
          slotCount={replay?.slots.length ?? 0}
          slotIndex={slotIndex}
          totalLayerCount={sourceLayers.length + 2}
        />
        <MovementReplayMapStage
          canvasRef={canvasRef}
          clusterBelowPercent={clusterBelowPercent}
          coverageCount={coverage.length}
          error={error}
          filteredSignalCount={filteredSignals.length}
          fullscreenMessage={fullscreenMessage}
          hasPanned={hasPanned}
          inspectionCluster={inspectionCluster}
          inspectionEnabled={inspectionEnabled}
          inspectionEvidence={inspectionEvidence}
          isMapFullscreen={isMapFullscreen}
          isPanning={isPanning}
          mapInspection={mapInspection}
          mapInteractionRef={mapInteractionRef}
          onChangeGrouping={setClusterBelowPercent}
          onInspectMap={inspectMap}
          onLeaveMap={leaveMap}
          onPointerCancel={finishMapPan}
          onPointerDown={startMapPan}
          onPointerMove={moveMapPan}
          onPointerUp={finishMapPan}
          onResetMap={resetMapView}
          onToggleFullscreen={toggleMapFullscreen}
          onZoomIn={() => adjustZoom(zoom + 0.5)}
          onZoomOut={() => adjustZoom(zoom - 0.5)}
          showBasemap={showBasemap}
          showCoverage={showCoverage}
          zoom={zoom}
        />
      </div>

      <MovementReplayEvidence
        filteredSignals={filteredSignals}
        isOpen={isEvidenceOpen}
        onClose={() => dispatchUi({ type: "evidence_visibility_changed", isOpen: false })}
        onSelectSignal={(nextSignalKey) => dispatchUi({
          type: "signal_selected",
          signalKey: nextSignalKey,
        })}
        replaySourceSelected={replaySourceSelected}
        selected={selected}
        selectedEvidence={selectedEvidence}
      />
    </section>
  );
}
