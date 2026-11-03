"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate, formatFactorValue, formatNumber } from "@/lib/prices/format";
import { dateNumber, historyForPeriod } from "@/lib/prices/history";
import type { AnalysisFactor, PriceRecord } from "@/lib/prices/poc-types";

export function FactorHistoryChart({ factor, item }: { factor: AnalysisFactor; item: PriceRecord }) {
  const [period, setPeriod] = useState(30);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(300, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const key = factor.historyKey;
  const points = key ? historyForPeriod(item.factorHistory, item.baseDate, period)
    .filter(point => Number.isFinite(point[key])).map(point => ({ date: point.date, value: point[key] })) : [];
  if (!points.length) return <p className="factor-history-placeholder">이 요인의 실제 추이 데이터가 없습니다.</p>;
  const start = dateNumber(item.baseDate) - (period - 1) * 86_400_000;
  const end = dateNumber(item.baseDate);
  const values = points.map(point => point.value);
  const low = Math.min(...values), high = Math.max(...values);
  const pad = (high - low || Math.abs(high) * .1 || 1) * .2;
  const min = low - pad, max = high + pad;
  const right = width - 16;
  const x = (date: string) => 58 + (dateNumber(date) - start) / Math.max(1, end - start) * (right - 58);
  const y = (value: number) => 152 - (value - min) / (max - min) * 116;
  const path = points.map((point, index) => `${index ? "L" : "M"}${x(point.date).toFixed(2)},${y(point.value).toFixed(2)}`).join(" ");
  const last = points.at(-1)!;
  const label = `${factor.label} 실제 과거 추이`;
  const description = `${formatDate(points[0].date)}부터 ${formatDate(last.date)}까지 ${points.length}개 실제 feature 값. 마지막 값 ${formatFactorValue(last.value, factor.unit)}.`;
  return <div className="factor-history-chart" ref={container}>
    <div className="factor-history-heading"><h4>{label}</h4><div role="group" aria-label={`${factor.label} 조회 기간`} className="chart-periods">{[14, 30, 90].map(days => <button key={days} type="button" aria-pressed={period === days} onClick={() => setPeriod(days)}>{`${days}일`}</button>)}</div></div>
    <svg viewBox={`0 0 ${width} 186`} role="img" aria-label={label} className="factor-history-svg">
      <title>{label}</title><desc>{description}</desc>
      <text x="50" y="17" textAnchor="end" fontSize="10" fill="#65776b">{factor.unit || "지표값"}</text>
      {[max, (min + max) / 2, min].map(value => <g key={value}><line x1="58" x2={right} y1={y(value)} y2={y(value)} stroke="#e4ece2" /><text x="50" y={y(value) + 4} textAnchor="end" fill="#65776b" fontSize="10">{formatNumber(value, factor.unit === "원" ? 0 : 1)}</text></g>)}
      <path data-factor-history={key} data-point-count={points.length} d={path} fill="none" stroke="#23804d" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(last.date)} cy={y(last.value)} r="4" fill="#14532d" stroke="white" strokeWidth="2" />
      <text x="58" y="178" fontSize="10" fill="#65776b">{points[0].date.slice(5)}</text><text x={right} y="178" textAnchor="end" fontSize="10" fill="#65776b">{last.date.slice(5)}</text>
    </svg>
    <p className="chart-footnote">{formatDate(last.date)} · 마지막 값 {formatFactorValue(last.value, factor.unit)} · 실제 feature {points.length}건</p>
  </div>;
}
