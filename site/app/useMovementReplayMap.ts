"use client";

import {
  type Dispatch,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  clampMapZoom,
  findNearestMapMarker,
  zoomFromWheel,
  zoomPanOffsetAtPoint,
} from "./layerModel.mjs";
import { drawMap } from "./movementCanvasMap";
import { signalKey } from "./movementCanvasModel";
import type {
  Coordinate,
  LineFeature,
  MapDragState,
  MapHitTarget,
  MapInspection,
  SourceLayer,
} from "./movementCanvasTypes";
import type { ReplayUiAction } from "./movementReplayUi";

type UseMovementReplayMapOptions = {
  coverage: LineFeature[];
  customMarkerImage: HTMLImageElement | null;
  dispatchUi: Dispatch<ReplayUiAction>;
  filteredSignals: LineFeature[];
  inspectionEnabled: boolean;
  movementIconSource: SourceLayer | undefined;
  selectedId: string | null;
  showBasemap: boolean;
  showCoverage: boolean;
  symbolSize: number;
};

export function useMovementReplayMap({
  coverage,
  customMarkerImage,
  dispatchUi,
  filteredSignals,
  inspectionEnabled,
  movementIconSource,
  selectedId,
  showBasemap,
  showCoverage,
  symbolSize,
}: UseMovementReplayMapOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapStageRef = useRef<HTMLDivElement>(null);
  const mapInteractionRef = useRef<HTMLDivElement>(null);
  const hitTargetsRef = useRef<MapHitTarget[]>([]);
  const panOffsetRef = useRef<Coordinate>([0, 0]);
  const mapDragRef = useRef<MapDragState | null>(null);
  const redrawMapRef = useRef<() => void>(() => undefined);
  const [zoom, setZoom] = useState(1);
  const [clusterBelowPercent, setClusterBelowPercent] = useState(100);
  const [hasPanned, setHasPanned] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [tileRevision, setTileRevision] = useState(0);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState<string | null>(null);

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
          selectedId,
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
  }, [clusterBelowPercent, coverage, customMarkerImage, filteredSignals, movementIconSource, selectedId, showBasemap, showCoverage, symbolSize, tileRevision, zoom]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMapFullscreen(document.fullscreenElement === mapStageRef.current);
      dispatchUi({ type: "inspection_changed", inspection: null });
      setFullscreenMessage(null);
      setTileRevision((value) => value + 1);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [dispatchUi]);

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
      dispatchUi({ type: "inspection_changed", inspection: null });
    };
    mapInteraction.addEventListener("wheel", handleWheel, { passive: false });
    return () => mapInteraction.removeEventListener("wheel", handleWheel);
  }, [dispatchUi, zoom]);

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
    dispatchUi({ type: "inspection_changed", inspection: null });
  };

  const inspectMap = (event: MouseEvent<HTMLDivElement>) => {
    if (!inspectionEnabled || mapDragRef.current) {
      dispatchUi({ type: "inspection_changed", inspection: null });
      return;
    }
    const { rect, target } = mapTargetAtPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    );
    dispatchUi({
      type: "inspection_changed",
      inspection: target ? inspectionForTarget(target, rect) : null,
    });
  };

  const leaveMap = () => {
    if (!mapDragRef.current) {
      dispatchUi({ type: "inspection_changed", inspection: null });
    }
  };

  const startMapPan = (event: PointerEvent<HTMLDivElement>) => {
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

  const moveMapPan = (event: PointerEvent<HTMLDivElement>) => {
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
    dispatchUi({ type: "inspection_changed", inspection: null });
    redrawMapRef.current();
  };

  const finishMapPan = (event: PointerEvent<HTMLDivElement>) => {
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
          dispatchUi({ type: "signal_selected", signalKey: signalKey(target.feature) });
          dispatchUi({
            type: "inspection_changed",
            inspection: inspectionForTarget(target, rect),
          });
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
    dispatchUi({ type: "inspection_changed", inspection: null });
  };

  const resetMapView = () => {
    panOffsetRef.current = [0, 0];
    setHasPanned(false);
    setZoom(1);
    dispatchUi({ type: "inspection_changed", inspection: null });
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

  return {
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
  };
}
