"use client";

import { useEffect, useMemo, useState } from "react";
import registryData from "../public/cop/v2/source-registry.json";
import { SOURCE_MANIFEST } from "../lib/sourceManifest.mjs";
import { operationsTargetForConnectorMode } from "../lib/sourceOperations.mjs";
import {
  mergeInvestigationSources,
  persistableInvestigationSources,
  upsertInvestigationSource,
} from "../lib/replaySourceWorkspace.mjs";
import { MOVEMENT_REPLAY_SOURCE_ID } from "./layerModel.mjs";
import type { InvestigationSourceDraft } from "./components/ReplayLayerWorkspace";
import type { SourceLayer } from "./movementCanvasTypes";

const SOURCE_WORKSPACE_STORAGE_KEY = "poneke-replay-source-workspace-v1";

const canonicalSourceLayers = registryData.sources.map((source) => ({
  ...source,
  operations_target: operationsTargetForConnectorMode(
    SOURCE_MANIFEST[source.id as keyof typeof SOURCE_MANIFEST]?.connector_mode,
  ),
  alert_eligible: SOURCE_MANIFEST[source.id as keyof typeof SOURCE_MANIFEST]?.alert_eligible === true,
})) as SourceLayer[];

export function useReplaySourceWorkspace() {
  const [sourceLayers, setSourceLayers] = useState<SourceLayer[]>(
    () => mergeInvestigationSources(canonicalSourceLayers) as SourceLayer[],
  );
  const [selectedSourceIds, setSelectedSourceIds] = useState(
    () => new Set([MOVEMENT_REPLAY_SOURCE_ID]),
  );
  const [storageReady, setStorageReady] = useState(false);
  const [sourceStorageNotice, setSourceStorageNotice] = useState("This browser only");
  const [customMarkerAsset, setCustomMarkerAsset] = useState<{
    url: string;
    image: HTMLImageElement;
  } | null>(null);

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
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(SOURCE_WORKSPACE_STORAGE_KEY, JSON.stringify({
        sources: persistableInvestigationSources(sourceLayers),
        selected_source_ids: [...selectedSourceIds],
      }));
    } catch {
      window.setTimeout(() => setSourceStorageNotice("Could not save"), 0);
    }
  }, [selectedSourceIds, sourceLayers, storageReady]);

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
    image.onload = () => {
      if (active) setCustomMarkerAsset({ url: movementCustomIconUrl, image });
    };
    image.src = movementCustomIconUrl;
    return () => { active = false; };
  }, [movementCustomIconUrl]);

  const saveInvestigationSource = (draft: InvestigationSourceDraft) => {
    const result = upsertInvestigationSource(sourceLayers, draft);
    if (!result.ok) return { ok: false, errors: result.errors };
    setSourceLayers(result.sources as SourceLayer[]);
    setSelectedSourceIds((current) => new Set([...current, result.saved.id]));
    setSourceStorageNotice("Saved on this browser");
    return { ok: true, errors: [] };
  };

  return {
    customMarkerImage,
    movementIconSource,
    saveInvestigationSource,
    selectedSourceIds,
    setSelectedSourceIds,
    sourceLayers,
    sourceStorageNotice,
  };
}
