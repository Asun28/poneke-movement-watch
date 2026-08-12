"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ArrowCounterClockwise, Broadcast, CarProfile, CornersIn, CornersOut, PersonSimpleWalk, SidebarSimple, SquaresFour } from "@phosphor-icons/react";
import registryData from "../public/cop/v2/source-registry.json";
import { SOURCE_MANIFEST } from "../lib/sourceManifest.mjs";
import { operationsTargetForConnectorMode } from "../lib/sourceOperations.mjs";
import { buildAdaptiveEvidenceClusterModel, buildAdaptiveEvidenceModel } from "../lib/adaptiveEvidence.mjs";
import { OPERATIONAL_BASEMAP } from "../lib/operationalBasemap.mjs";
import {
  mergeInvestigationSources,
  persistableInvestigationSources,
  upsertInvestigationSource,
} from "../lib/replaySourceWorkspace.mjs";
import {
  MOVEMENT_REPLAY_SOURCE_ID,
  canInspectSelectedSources,
  canReplaySelectedSources,
  clampMapZoom,
  findNearestMapMarker,
  playableSignalsForSources,
  replayIntervalMs,
  toggleSourceSelection,
  zoomFromWheel,
  zoomPanOffsetAtPoint,
} from "./layerModel.mjs";
import InvestigationLayersPanel, { InvestigationLayersButton } from "./components/InvestigationLayersPanel";
import MovementDelta from "./components/MovementDelta";
import { AdaptiveEvidenceDrawer, AdaptiveEvidencePreview } from "./components/AdaptiveEvidence";
import ReplayDensityTimeline from "./components/ReplayDensityTimeline";
import MapGroupingControl from "./components/MapGroupingControl";
import { buildReplayCurrentStatus, movementReplayTimelinePoints } from "../lib/replayDataWorkspace.mjs";
import { drawMap } from "./movementCanvasMap";
import {
  formatTimelineTick,
  movementEvidenceRecord,
  PEOPLE,
  replaySignalFeature,
  signalKey,
} from "./movementCanvasModel";
import type {
  Coordinate,
  FeatureCollection,
  LineFeature,
  MapDragState,
  MapHitTarget,
  MapInspection,
  MovementFilter as Filter,
  ReplayPayload,
  ReplaySpeed,
  SourceLayer,
} from "./movementCanvasTypes";
import MovementTrendView from "./components/MovementTrendView";
import ReplayLayerWorkspace, {
  type InvestigationSourceDraft,
} from "./components/ReplayLayerWorkspace";

const canonicalSourceLayers = registryData.sources.map((source) => ({
  ...source,
  operations_target: operationsTargetForConnectorMode(
    SOURCE_MANIFEST[source.id as keyof typeof SOURCE_MANIFEST]?.connector_mode,
  ),
  alert_eligible: SOURCE_MANIFEST[source.id as keyof typeof SOURCE_MANIFEST]?.alert_eligible === true,
})) as SourceLayer[];
const SOURCE_WORKSPACE_STORAGE_KEY = "poneke-replay-source-workspace-v1";
export default function MovementCanvas({ investigation, investigationControl }: {
  investigation?: { id: string; title: string; starts_at: string; as_of: string; default_target_at?: string };
  investigationControl?: ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapStageRef = useRef<HTMLDivElement>(null);
  const mapInteractionRef = useRef<HTMLDivElement>(null);
  const hitTargetsRef = useRef<MapHitTarget[]>([]);
  const panOffsetRef = useRef<Coordinate>([0, 0]);
  const mapDragRef = useRef<MapDragState | null>(null);
  const redrawMapRef = useRef<() => void>(() => undefined);
  const [coverage, setCoverage] = useState<LineFeature[]>([]);
  const [snapshotSignals, setSnapshotSignals] = useState<LineFeature[]>([]);
  const [replay, setReplay] = useState<ReplayPayload | null>(null);
  const [slotIndex, setSlotIndex] = useState(0);
  const [selectedSignalKey, setSelectedSignalKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed>(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [zoom, setZoom] = useState(1);
  const [clusterBelowPercent, setClusterBelowPercent] = useState(100);
  const [hasPanned, setHasPanned] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [tileRevision, setTileRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [replayWarning, setReplayWarning] = useState<string | null>(null);
  const [isLayerRailOpen, setIsLayerRailOpen] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [showBasemap, setShowBasemap] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);
  const [symbolSize, setSymbolSize] = useState(10);
  const [sourceLayers, setSourceLayers] = useState<SourceLayer[]>(
    () => mergeInvestigationSources(canonicalSourceLayers) as SourceLayer[],
  );
  const [selectedSourceIds, setSelectedSourceIds] = useState(
    () => new Set([MOVEMENT_REPLAY_SOURCE_ID]),
  );
  const [sourceStorageReady, setSourceStorageReady] = useState(false);
  const [sourceStorageNotice, setSourceStorageNotice] = useState("This browser only");
  const [customMarkerAsset, setCustomMarkerAsset] = useState<{
    url: string;
    image: HTMLImageElement;
  } | null>(null);
  const [mapInspection, setMapInspection] = useState<MapInspection | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/cop/v1/countline-coverage.geojson").then((response) => response.json()),
      fetch("/cop/v1/movement-signals.geojson").then((response) => response.json()),
    ])
      .then(([coverageData, signalData]: FeatureCollection[]) => {
        setCoverage(coverageData.features);
        setSnapshotSignals(signalData.features);
        setSelectedSignalKey(signalData.features[0] ? signalKey(signalData.features[0]) : null);
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(SOURCE_WORKSPACE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const merged = mergeInvestigationSources(
            canonicalSourceLayers,
            parsed.sources,
          ) as SourceLayer[];
          setSourceLayers(merged);
          if (Array.isArray(parsed.selected_source_ids)) {
            const knownIds = new Set(merged.map((source) => source.id));
            setSelectedSourceIds(new Set(
              parsed.selected_source_ids.filter((id: unknown) => (
                typeof id === "string" && knownIds.has(id)
              )),
            ));
          }
          setSourceStorageNotice("Saved on this browser");
        }
      } catch {
        setSourceStorageNotice("Browser storage unavailable");
      }
      setSourceStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!sourceStorageReady) return;
    try {
      window.localStorage.setItem(SOURCE_WORKSPACE_STORAGE_KEY, JSON.stringify({
        sources: persistableInvestigationSources(sourceLayers),
        selected_source_ids: [...selectedSourceIds],
      }));
    } catch {
      window.setTimeout(() => setSourceStorageNotice("Could not save"), 0);
    }
  }, [selectedSourceIds, sourceLayers, sourceStorageReady]);

  const movementIconSource = useMemo(
    () => sourceLayers.find((source) => source.id === MOVEMENT_REPLAY_SOURCE_ID),
    [sourceLayers],
  );
  const movementCustomIconUrl = movementIconSource?.icon_mode === "custom"
    ? movementIconSource.custom_icon_data_url ?? null
    : null;
  const customMarkerImage = customMarkerAsset?.url === movementCustomIconUrl
    ? customMarkerAsset.image
    : null;

  useEffect(() => {
    if (!movementCustomIconUrl) return;
    let active = true;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => { if (active) setCustomMarkerAsset({ url: movementCustomIconUrl, image }); };
    image.src = movementCustomIconUrl;
    return () => { active = false; };
  }, [movementCustomIconUrl]);

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

  useEffect(() => {
    if (!isPlaying || !replay || !replaySourceSelected) return;
    const timer = window.setInterval(() => {
      setSlotIndex((current) => {
        if (current >= replay.slots.length - 1) {
          setIsPlaying(false);
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
    setIsPlaying(false);
    setMapInspection(null);
    setSelectedSignalKey(null);
    setIsEvidenceOpen(false);
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
    if (sourceId === MOVEMENT_REPLAY_SOURCE_ID && selectedSourceIds.has(sourceId)) {
      setIsPlaying(false);
    }
    setMapInspection(null);
    setSelectedSignalKey(null);
    setIsEvidenceOpen(false);
    setSelectedSourceIds((current) => toggleSourceSelection(current, sourceId));
  };
  const saveInvestigationSource = (draft: InvestigationSourceDraft) => {
    const result = upsertInvestigationSource(sourceLayers, draft);
    if (!result.ok) return { ok: false, errors: result.errors };
    setSourceLayers(result.sources as SourceLayer[]);
    setSelectedSourceIds((current) => new Set([...current, result.saved.id]));
    setSourceStorageNotice("Saved on this browser");
    return { ok: true, errors: [] };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animationFrame = 0;
    const render = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        hitTargetsRef.current = drawMap(
          canvas,
          coverage,
          filteredSignals,
          selected?.id ?? null,
          zoom,
          clusterBelowPercent / 100,
          panOffsetRef.current,
          showBasemap,
          showCoverage,
          symbolSize,
          movementIconSource,
          customMarkerImage,
          () => setTileRevision((value) => value + 1),
        );
      });
    };
    redrawMapRef.current = render;
    window.addEventListener("resize", render);
    render();
    return () => {
      cancelAnimationFrame(animationFrame);
      redrawMapRef.current = () => undefined;
      window.removeEventListener("resize", render);
    };
  }, [clusterBelowPercent, coverage, customMarkerImage, filteredSignals, movementIconSource, selected, showBasemap, showCoverage, symbolSize, tileRevision, zoom]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMapFullscreen(document.fullscreenElement === mapStageRef.current);
      setMapInspection(null);
      setFullscreenMessage(null);
      setTileRevision((value) => value + 1);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const mapInteraction = mapInteractionRef.current;
    if (!mapInteraction) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const nextZoom = zoomFromWheel(zoom, event.deltaY);
      if (nextZoom === zoom) return;
      const rect = mapInteraction.getBoundingClientRect();
      panOffsetRef.current = zoomPanOffsetAtPoint(
        panOffsetRef.current,
        zoom,
        nextZoom,
        [event.clientX - rect.left, event.clientY - rect.top],
        [rect.width, rect.height],
      );
      setHasPanned(
        Math.abs(panOffsetRef.current[0]) > 0.5
          || Math.abs(panOffsetRef.current[1]) > 0.5,
      );
      setZoom(nextZoom);
      setMapInspection(null);
    };
    mapInteraction.addEventListener("wheel", handleWheel, { passive: false });
    return () => mapInteraction.removeEventListener("wheel", handleWheel);
  }, [zoom]);

  const mapTargetAtPoint = (
    element: HTMLDivElement,
    clientX: number,
    clientY: number,
  ) => {
    const rect = element.getBoundingClientRect();
    const target = findNearestMapMarker(
      hitTargetsRef.current,
      { x: clientX - rect.left, y: clientY - rect.top },
      symbolSize + 9,
    ) as MapHitTarget | null;
    return { rect, target };
  };

  const inspectionForTarget = (target: MapHitTarget, rect: DOMRect): MapInspection => ({
    feature: target.feature,
    features: target.features,
    count: target.count,
    left: Math.min(Math.max(12, target.x + target.radius + 12), Math.max(12, rect.width - 272)),
    top: Math.min(Math.max(12, target.y - 34), Math.max(12, rect.height - 190)),
  });

  const zoomToCluster = (target: MapHitTarget, element: HTMLDivElement) => {
    const nextZoom = clampMapZoom(Math.max(zoom + 0.75, zoom * 1.8));
    const rect = element.getBoundingClientRect();
    panOffsetRef.current = zoomPanOffsetAtPoint(
      panOffsetRef.current,
      zoom,
      nextZoom,
      [target.x, target.y],
      [rect.width, rect.height],
    );
    setHasPanned(true);
    setZoom(nextZoom);
    setMapInspection(null);
  };

  const inspectMap = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!inspectionEnabled || mapDragRef.current) {
      setMapInspection(null);
      return;
    }
    const { rect, target } = mapTargetAtPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    );
    if (!target) {
      setMapInspection(null);
      return;
    }
    setMapInspection(inspectionForTarget(target, rect));
  };

  const startMapPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    mapDragRef.current = {
      pointerId: event.pointerId,
      last: [event.clientX, event.clientY],
      distance: 0,
      moved: false,
    };
    setIsPanning(true);
  };

  const moveMapPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.last[0];
    const deltaY = event.clientY - drag.last[1];
    drag.last = [event.clientX, event.clientY];
    drag.distance += Math.hypot(deltaX, deltaY);
    drag.moved = drag.moved || drag.distance > 3;
    if (!drag.moved) return;
    panOffsetRef.current = [
      panOffsetRef.current[0] + deltaX,
      panOffsetRef.current[1] + deltaY,
    ];
    setMapInspection(null);
    redrawMapRef.current();
  };

  const finishMapPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      setHasPanned(true);
    } else if (inspectionEnabled) {
      const { rect, target } = mapTargetAtPoint(
        event.currentTarget,
        event.clientX,
        event.clientY,
      );
      if (target) {
        if (target.count > 1) zoomToCluster(target, event.currentTarget);
        else {
          setSelectedSignalKey(signalKey(target.feature));
          setMapInspection(inspectionForTarget(target, rect));
        }
      }
    }
    mapDragRef.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const adjustZoom = (nextZoom: number) => {
    const clampedZoom = clampMapZoom(nextZoom);
    const rect = mapInteractionRef.current?.getBoundingClientRect();
    if (rect) {
      panOffsetRef.current = zoomPanOffsetAtPoint(
        panOffsetRef.current,
        zoom,
        clampedZoom,
        [rect.width / 2, rect.height / 2],
        [rect.width, rect.height],
      );
      setHasPanned(
        Math.abs(panOffsetRef.current[0]) > 0.5
          || Math.abs(panOffsetRef.current[1]) > 0.5,
      );
    }
    setZoom(clampedZoom);
    setMapInspection(null);
  };

  const resetMapView = () => {
    panOffsetRef.current = [0, 0];
    setHasPanned(false);
    setZoom(1);
    setMapInspection(null);
    redrawMapRef.current();
  };

  const toggleMapFullscreen = async () => {
    const mapStage = mapStageRef.current;
    if (!mapStage || !document.fullscreenEnabled) {
      setFullscreenMessage("Fullscreen is unavailable in this browser view.");
      return;
    }
    try {
      if (document.fullscreenElement === mapStage) await document.exitFullscreen();
      else await mapStage.requestFullscreen();
    } catch {
      setFullscreenMessage("Fullscreen was blocked. Use the browser's fullscreen control instead.");
    }
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
          onSelectAllSources={() => { setSelectedSourceIds(new Set(sourceLayers.map((source) => source.id))); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
          onReplayOnly={() => { setSelectedSourceIds(new Set([MOVEMENT_REPLAY_SOURCE_ID])); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
          onClearSources={() => { setSelectedSourceIds(new Set()); setIsPlaying(false); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
          onSaveSource={saveInvestigationSource}
        />
      </InvestigationLayersPanel>
      <div className="map-column">
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
                  onChange={(event) => selectDateAndHour(event.currentTarget.value, selectedHour)}
                />
              </label>
              <label>
                <span>Hour</span>
                <select
                  aria-label="Replay hour"
                  value={selectedHour}
                  disabled={!replayEnabled}
                  onChange={(event) => selectDateAndHour(selectedDate, event.currentTarget.value)}
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
                  onChange={(event) => setReplaySpeed(Number(event.currentTarget.value) as ReplaySpeed)}
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
                  onClick={() => { setSlotIndex((value) => Math.max(0, value - 1)); setIsPlaying(false); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
                >←</button>
                <button
                  type="button"
                  className="play-button"
                  aria-label={isPlaying ? "Pause replay" : "Play replay"}
                  aria-pressed={isPlaying}
                  disabled={!replayEnabled || (replay?.slots.length ?? 0) < 2}
                  onClick={() => {
                    if (!isPlaying) setMapInspection(null);
                    setIsPlaying(!isPlaying);
                    setSelectedSignalKey(null);
                    setIsEvidenceOpen(false);
                  }}
                >{isPlaying ? "Pause" : "Play"}</button>
                <button
                  type="button"
                  aria-label="Next replay hour"
                  disabled={!replayEnabled || slotIndex >= (replay?.slots.length ?? 1) - 1}
                  onClick={() => { setSlotIndex((value) => Math.min((replay?.slots.length ?? 1) - 1, value + 1)); setIsPlaying(false); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
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
            onChange={(index) => { setSlotIndex(index); setIsPlaying(false); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
          />
          <nav className="replay-filter-subbar replay-compact-actions" aria-label="Replay filters and layers">
            <div className="replay-primary-filters" data-replay-filter-zone="primary">
              <div className="filter-group" data-replay-filter-kind="movement-mode" aria-label="Filter movement mode">
                {(["all", "people", "vehicles"] as Filter[]).map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={filter === value ? "active" : ""}
                    aria-pressed={filter === value}
                    onClick={() => { setFilter(value); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
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
                <button type="button" data-replay-overlay="sensor-coverage" aria-pressed={showCoverage} aria-label="Sensor coverage" onClick={() => setShowCoverage((value) => !value)}>
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
                selectedCount={selectedSourceIds.size + Number(showBasemap) + Number(showCoverage)}
                totalCount={sourceLayers.length + 2}
                onToggle={() => setIsLayerRailOpen((value) => !value)}
              />
              <button
                type="button"
                data-replay-action="evidence"
                data-icon-only="true"
                aria-expanded={isEvidenceOpen}
                aria-label={isEvidenceOpen ? "Hide signal evidence" : "Show signal evidence"}
                title={`Evidence · ${filteredSignals.length}`}
                onClick={() => setIsEvidenceOpen((value) => !value)}
              >
                <SidebarSimple size={20} weight="regular" aria-hidden="true" />
                <span className="sr-only">{filteredSignals.length} signals</span>
              </button>
            </div>
          </nav>
          {replayWarning ? <p className="replay-warning" role="status">{replayWarning}</p> : null}
        </div>
        <div className="map-stage replay-map-stage">
          <canvas
            ref={canvasRef}
            role="img"
            data-replay-clustering="screen-space"
            aria-label={`${filteredSignals.length} unusual movement changes across 414 WCC countlines ${showBasemap ? "on the Wellington basemap" : "with the basemap hidden"}.`}
          />
          <div
            ref={mapInteractionRef}
            className="map-inspection-layer"
            aria-label="Paused map inspection layer"
            data-active={inspectionEnabled}
            data-map-selectable={inspectionEnabled}
            data-panning={isPanning}
            onMouseMove={inspectMap}
            onMouseLeave={() => {
              if (!mapDragRef.current) setMapInspection(null);
            }}
            onPointerDown={startMapPan}
            onPointerMove={moveMapPan}
            onPointerUp={finishMapPan}
            onPointerCancel={finishMapPan}
          />
          <span className="sr-only" aria-live="polite">
            {isPanning
              ? "Moving map."
              : inspectionEnabled
              ? `Paused. ${filteredSignals.length} markers can be inspected.`
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
              <button
                type="button"
                aria-label="Zoom in"
                disabled={zoom >= 20}
                onClick={() => adjustZoom(zoom + 0.5)}
              >+</button>
              <button
                type="button"
                aria-label="Zoom out"
                disabled={zoom <= 0.5}
                onClick={() => adjustZoom(zoom - 0.5)}
              >−</button>
            </div>
            <div className="map-view-actions">
              <button
                type="button"
                aria-label="Reset map view"
                title="Reset map view"
                disabled={zoom === 1 && !hasPanned}
                onClick={resetMapView}
              ><ArrowCounterClockwise size={18} aria-hidden="true" /></button>
              <button
                type="button"
                aria-label={isMapFullscreen ? "Exit map fullscreen" : "Show map fullscreen"}
                title={isMapFullscreen ? "Exit map fullscreen" : "Show map fullscreen"}
                aria-pressed={isMapFullscreen}
                onClick={toggleMapFullscreen}
              >{isMapFullscreen ? <CornersIn size={18} aria-hidden="true" /> : <CornersOut size={18} aria-hidden="true" />}</button>
            </div>
            <MapGroupingControl value={clusterBelowPercent} onChange={setClusterBelowPercent} />
          </div>
          {fullscreenMessage ? (
            <p className="map-fullscreen-message" role="status">{fullscreenMessage}</p>
          ) : null}
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
          {coverage.length === 0 && !error ? <p className="map-message">Loading countlines…</p> : null}
          {error ? <p className="map-message error" role="alert">{error}</p> : null}
        </div>
      </div>

      <AdaptiveEvidenceDrawer
        model={selectedEvidence}
        open={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        title="Signal evidence"
        className="evidence-column"
      >
        <MovementTrendView signal={selected} visible={isEvidenceOpen} />

        <div className="signal-list" aria-label={`${filteredSignals.length} filtered signals`}>
          {filteredSignals.map((feature) => (
            <button
              type="button"
              key={feature.id}
              className={feature.id === selected?.id ? "selected" : ""}
              onClick={() => setSelectedSignalKey(signalKey(feature))}
            >
              <span>
                <strong>{String(feature.properties.name)}</strong>
                <small>{String(feature.properties.transport_class)} · {String(feature.properties.direction)}</small>
              </span>
              <span className="signal-list-delta">
                <MovementDelta observed={Number(feature.properties.observed_count)} expected={Number(feature.properties.expected_count)} compact />
                <small>{Number(feature.properties.robust_z).toFixed(1)} z</small>
              </span>
            </button>
          ))}
          {filteredSignals.length === 0 ? (
            <p className="empty-slot">
              {replaySourceSelected
                ? "No investigation signals in this hour and filter."
                : "No playable movement source is selected."}
            </p>
          ) : null}
        </div>
      </AdaptiveEvidenceDrawer>
    </section>
  );
}
