"use client";

import { useEffect, useMemo, useRef } from "react";
import type { HistoryPoint, LineFeature } from "../movementCanvasTypes";

const EMPTY_HISTORY: HistoryPoint[] = [];

export default function MovementTrendView({ signal, visible }: { signal?: LineFeature; visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const history = (signal?.properties.matched_history as HistoryPoint[] | undefined) ?? EMPTY_HISTORY;
  const observed = signal ? Number(signal.properties.observed_count) : 0;
  const expected = signal ? Number(signal.properties.expected_count) : 0;
  const points = useMemo(() => signal
    ? [...history, { observed_at: String(signal.properties.observed_at), observed_count: observed }]
    : [], [history, observed, signal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0 || !visible) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      const width = rect.width;
      const height = rect.height;
      const padding = { left: 32, right: 12, top: 12, bottom: 22 };
      const maxValue = Math.max(expected, ...points.map((point) => point.observed_count), 1);
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      const x = (index: number) => padding.left + (index / Math.max(1, points.length - 1)) * chartWidth;
      const y = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

      context.clearRect(0, 0, width, height);
      context.strokeStyle = "rgba(16, 42, 51, 0.12)";
      context.lineWidth = 1;
      for (let step = 0; step <= 2; step += 1) {
        const gridY = padding.top + (chartHeight / 2) * step;
        context.beginPath();
        context.moveTo(padding.left, gridY);
        context.lineTo(width - padding.right, gridY);
        context.stroke();
      }
      context.fillStyle = "#526b73";
      context.font = "9px Consolas, monospace";
      context.fillText(String(Math.round(maxValue)), 2, padding.top + 4);
      context.fillText("0", 20, padding.top + chartHeight + 3);

      context.setLineDash([5, 4]);
      context.strokeStyle = "#1e6a8d";
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(padding.left, y(expected));
      context.lineTo(width - padding.right, y(expected));
      context.stroke();
      context.setLineDash([]);

      const colour = signal?.properties.change_direction === "decrease" ? "#c75845" : "#0c66e4";
      context.strokeStyle = colour;
      context.lineWidth = 2.5;
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) context.moveTo(x(index), y(point.observed_count));
        else context.lineTo(x(index), y(point.observed_count));
      });
      context.stroke();
      points.forEach((point, index) => {
        context.fillStyle = index === points.length - 1 ? "#102a33" : colour;
        context.beginPath();
        context.arc(x(index), y(point.observed_count), index === points.length - 1 ? 4 : 2.5, 0, Math.PI * 2);
        context.fill();
      });
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [expected, points, signal, visible]);

  const firstDate = points[0]?.observed_at;
  const lastDate = points.at(-1)?.observed_at;
  const shortDate = (value: string) => new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    timeZone: "Pacific/Auckland",
  }).format(new Date(value));

  return (
    <section className="trend-panel" aria-labelledby="trend-heading">
      <div className="trend-heading-row">
        <div>
          <h4 id="trend-heading">Matched-hour trend</h4>
          <span>12 weeks</span>
        </div>
        <div className="trend-legend" aria-label="Trend legend">
          <span><i className="observed-line" />Observed count</span>
          <span><i className="expected-line" />Expected baseline</span>
        </div>
      </div>
      {signal ? (
        <>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Observed count history for ${String(signal.properties.name)}. Current ${observed}; expected ${expected}.`}
          />
          <div className="trend-range">
            <span>{firstDate ? shortDate(firstDate) : ""}</span>
            <strong>Selected hour</strong>
            <span>{lastDate ? shortDate(lastDate) : ""}</span>
          </div>
        </>
      ) : (
        <p className="trend-empty">Select a signal</p>
      )}
    </section>
  );
}
