"use client";

import { useState, type ReactNode } from "react";
import {
  CarProfile,
  PersonSimpleWalk,
  Shapes,
  UploadSimple,
} from "@phosphor-icons/react";
import {
  MAX_CUSTOM_ICON_BYTES,
  validateCustomIconFile,
} from "../../lib/replaySourceWorkspace.mjs";

export type SourceIconMode = "auto" | "people" | "vehicle" | "custom";

type IconValue = {
  mode: SourceIconMode;
  customIconDataUrl: string | null;
};

export function SourceIconPreview({
  mode = "auto",
  customIconDataUrl = null,
  size = 20,
}: {
  mode?: SourceIconMode;
  customIconDataUrl?: string | null;
  size?: number;
}) {
  if (mode === "custom" && customIconDataUrl) {
    return (
      <span className="source-icon-preview is-custom" data-source-icon="custom" aria-hidden="true">
        {/* Browser-local display preference; never evidence content. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={customIconDataUrl} alt="" width={size} height={size} />
      </span>
    );
  }
  if (mode === "people") {
    return <span className="source-icon-preview" data-source-icon="people" aria-hidden="true"><PersonSimpleWalk size={size} weight="bold" /></span>;
  }
  if (mode === "vehicle") {
    return <span className="source-icon-preview" data-source-icon="vehicle" aria-hidden="true"><CarProfile size={size} weight="bold" /></span>;
  }
  return (
    <span className="source-icon-preview is-auto" data-source-icon="auto" aria-hidden="true">
      <PersonSimpleWalk size={Math.max(12, size - 3)} weight="bold" />
      <CarProfile size={Math.max(12, size - 3)} weight="bold" />
    </span>
  );
}

export default function SourceIconPicker({
  mode,
  customIconDataUrl,
  onChange,
}: IconValue & { onChange: (value: IconValue) => void }) {
  const [notice, setNotice] = useState("");
  const choices: Array<{ value: SourceIconMode; label: string; icon: ReactNode }> = [
    { value: "auto", label: "Auto by data type", icon: <Shapes size={18} weight="bold" /> },
    { value: "people", label: "People", icon: <PersonSimpleWalk size={18} weight="bold" /> },
    { value: "vehicle", label: "Vehicle", icon: <CarProfile size={18} weight="bold" /> },
    { value: "custom", label: "Custom", icon: customIconDataUrl ? <SourceIconPreview mode="custom" customIconDataUrl={customIconDataUrl} size={18} /> : <UploadSimple size={18} weight="bold" /> },
  ];

  function choose(nextMode: SourceIconMode) {
    setNotice(nextMode === "custom" && !customIconDataUrl ? "Choose a PNG or WebP file." : "");
    onChange({ mode: nextMode, customIconDataUrl });
  }

  function upload(file?: File) {
    if (!file) return;
    const validation = validateCustomIconFile(file);
    if (!validation.ok) {
      setNotice(validation.error === "size" ? "Keep the icon under 128 KB." : "Use PNG or WebP.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setNotice("This icon could not be read.");
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setNotice("This icon could not be read.");
        return;
      }
      setNotice("Icon ready · this browser only");
      onChange({ mode: "custom", customIconDataUrl: reader.result });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="source-icon-picker">
      <span className="source-icon-label">Map icon</span>
      <div className="source-icon-choices" role="radiogroup" aria-label="Map icon">
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={mode === choice.value}
            className={mode === choice.value ? "is-selected" : ""}
            onClick={() => choose(choice.value)}
          >
            {choice.icon}
            <span>{choice.label}</span>
          </button>
        ))}
      </div>
      <label className="source-icon-upload">
        <UploadSimple size={17} weight="bold" aria-hidden="true" />
        <span>Upload PNG or WebP</span>
        <input
          type="file"
          accept="image/png,image/webp"
          aria-describedby="source-icon-limit"
          onChange={(event) => {
            upload(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </label>
      <small id="source-icon-limit">Max {Math.round(MAX_CUSTOM_ICON_BYTES / 1024)} KB · saved on this browser</small>
      <output aria-live="polite">{notice}</output>
    </div>
  );
}
