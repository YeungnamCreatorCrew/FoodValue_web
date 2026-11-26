"use client";

import { useState, type PointerEvent } from "react";
import { formatNumber } from "@/lib/prices/format";
import { nearestPoint } from "@/lib/prices/forecast-chart";

export interface HoverPoint {
  date: string;
  value: number;
  x: number;
  y: number;
  kind?: "actual" | "forecast";
  previous?: { date: string; value: number } | null;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const dayLabel = (date: string) => `${date.slice(5).replace("-", ".")} (${WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]})`;

/**
 * Stock-chart style crosshair: pointer/touch over the plot snaps to the nearest slot and shows its date and value.
 * Only slots with a value exist, so days without data are never shown.
 */
/** Optional custom tooltip body (e.g. week-of-year charts or two series); default is date + value + change. */
export interface HoverTooltip { title: string; lines: { text: string; color?: string; bold?: boolean }[]; markers?: { y: number; color: string }[] }

export function ChartHover<T extends HoverPoint>({ points, left, right, top, bottom, unit = "원", digits = 0, color = "var(--fv-chart-actual)", tooltip }: {
  points: T[]; left: number; right: number; top: number; bottom: number; unit?: string; digits?: number; color?: string; tooltip?: (point: T) => HoverTooltip;
}) {
  const [active, setActive] = useState<T | null>(null);
  // SVG units per screen pixel, so the tooltip keeps a readable on-screen size however much the chart is scaled.
  const [scale, setScale] = useState(1);
  if (!points.length) return null;
  function move(event: PointerEvent<SVGRectElement>) {
    const svg = event.currentTarget.ownerSVGElement;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    setScale(1 / (matrix.a || 1));
    setActive(nearestPoint(points, point.matrixTransform(matrix.inverse()).x));
  }
  const value = (number: number) => `${formatNumber(number, digits)}${unit}`;
  let box = null;
  if (active && tooltip) {
    const content = tooltip(active);
    const k = scale, width = 168 * k, height = (28 + content.lines.length * 19) * k, gap = 12 * k;
    const boxX = Math.max(left - 8, active.x + gap + width > right ? active.x - gap - width : active.x + gap);
    const boxY = Math.max(top - 20, Math.min(active.y - height / 2, bottom - height));
    box = <g className="chart-tip" pointerEvents="none" aria-hidden="true">
      <line x1={active.x} x2={active.x} y1={top - 12} y2={bottom + 6} stroke="var(--fv-text-3)" strokeWidth={k} strokeDasharray={`${3 * k} ${3 * k}`} />
      {(content.markers ?? [{ y: active.y, color }]).map(marker => <circle key={`${marker.color}${marker.y}`} cx={active.x} cy={marker.y} r={4.5 * k} fill={marker.color} stroke="var(--fv-bg)" strokeWidth={2 * k} />)}
      <rect x={boxX} y={boxY} width={width} height={height} rx={8 * k} fill="var(--fv-tooltip-bg)" fillOpacity="0.92" />
      <text x={boxX + 10 * k} y={boxY + 18 * k} fontSize={12 * k} fill="var(--fv-tooltip-sub)">{content.title}</text>
      {content.lines.map((line, index) => <text key={line.text} x={boxX + 10 * k} y={boxY + (38 + index * 19) * k} fontSize={(line.bold ? 14 : 12) * k}
        fontWeight={line.bold ? 700 : 500} fill={line.color ?? "var(--fv-tooltip-text)"}>{line.text}</text>)}
    </g>;
  } else if (active) {
    const forecast = active.kind === "forecast";
    const title = `${dayLabel(active.date)}${forecast ? " · AI 7일 예측" : ""}`;
    const change = active.previous ? active.value - active.previous.value : null;
    const changeText = change === null ? "" : change === 0 ? "변동 없음" : `${change > 0 ? "↑ " : "↓ "}${formatNumber(Math.abs(change), digits)}${unit}`;
    const k = scale, width = (forecast ? 176 : 140) * k, height = (change === null ? 46 : 64) * k, gap = 12 * k;
    const boxX = Math.max(left - 8, active.x + gap + width > right ? active.x - gap - width : active.x + gap);
    const boxY = Math.max(top - 20, Math.min(active.y - height / 2, bottom - height));
    box = <g className="chart-tip" pointerEvents="none" aria-hidden="true">
      <line x1={active.x} x2={active.x} y1={top - 12} y2={bottom + 6} stroke="var(--fv-text-3)" strokeWidth={k} strokeDasharray={`${3 * k} ${3 * k}`} />
      <circle cx={active.x} cy={active.y} r={5 * k} fill={color} stroke="var(--fv-bg)" strokeWidth={2 * k} />
      <rect x={boxX} y={boxY} width={width} height={height} rx={8 * k} fill="var(--fv-tooltip-bg)" fillOpacity="0.92" />
      <text x={boxX + 10 * k} y={boxY + 18 * k} fontSize={12 * k} fill="var(--fv-tooltip-sub)">{title}</text>
      <text x={boxX + 10 * k} y={boxY + 37 * k} fontSize={15 * k} fontWeight="700" fill="var(--fv-tooltip-text)">{value(active.value)}</text>
      {change !== null && <text x={boxX + 10 * k} y={boxY + 54 * k} fontSize={12 * k} fill={change > 0 ? "var(--fv-up-soft)" : change < 0 ? "var(--fv-down-soft)" : "var(--fv-tooltip-sub)"}>
        {changeText} <tspan fill="var(--fv-tooltip-sub)">{active.previous ? `${active.previous.date.slice(5).replace("-", ".")} 대비` : ""}</tspan></text>}
    </g>;
  }
  return <>
    {box}
    <rect x={left - 8} y={top - 20} width={right - left + 16} height={bottom - top + 30} fill="transparent" style={{ touchAction: "pan-y", cursor: "crosshair" }}
      onPointerMove={move} onPointerDown={move} onPointerLeave={() => setActive(null)} />
  </>;
}

/** Live readout for screen readers is the chart's <desc>; this component is visual only. */
export const chartHoverLabel = dayLabel;
