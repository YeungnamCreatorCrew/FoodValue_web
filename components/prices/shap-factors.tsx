"use client";

import { useEffect, useRef, useState } from "react";
import type { LivePrice } from "@/lib/prices/model";
import { categoryLabels, unavailableText, type ShapAnalysis, type ShapFactor } from "@/lib/prices/shap";
import { formatDate, formatNumber } from "@/lib/prices/format";
import { dateNumber } from "@/lib/prices/history";
import { useFactorTrend, usePriceFactors } from "@/lib/prices/use-prices";
import { DataFactorPanel } from "./data-factors";

const TOP_COUNT = 8;
const PERIODS = [14, 30, 90] as const;
const caveat = "SHAP은 모델의 7일 후 가격 예측에 대한 기여입니다. 실제 가격 변동액이나 인과관계를 뜻하지 않으며, 비교값은 기준일과 정확히 7일 전의 같은 지표입니다.";

const decimals = (unit: string, value: number) => unit === "원" ? 0 : unit === "%" ? 1 : Number.isInteger(value) ? 0 : 2;
export const factorValue = (value: number | null, unit: string) => value === null ? "-" : `${formatNumber(value, decimals(unit, value))}${unit}`;
const signed = (value: number, digits: number) => `${value > 0 ? "+" : ""}${formatNumber(value, digits)}`;
const contributionText = (value: number) => `${signed(value, 1)}원`;
const toneClass = (direction: ShapFactor["direction"]) => direction === "down" ? "text-blue-700" : direction === "up" ? "text-red-600" : "text-slate-500";

function FactorTrendChart({ itemId, factor }: { itemId: string; factor: ShapFactor }) {
  const { data, error, loading, reload } = useFactorTrend(itemId, factor.id);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(30);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const heading = <div className="factor-history-heading"><h4>{factor.label} 과거 추이</h4>
    <div role="group" aria-label={`${factor.label} 조회 기간`} className="chart-periods">{PERIODS.map(days => <button key={days} type="button" aria-pressed={period === days} onClick={() => setPeriod(days)}>{days}일</button>)}</div></div>;
  if (loading) return <div className="factor-history-chart" ref={container}>{heading}<p className="factor-history-placeholder">추이를 불러오는 중입니다.</p></div>;
  if (error || !data) return <div className="factor-history-chart" ref={container}>{heading}<p className="factor-history-placeholder">추이를 불러오지 못했습니다. <button type="button" className="underline" onClick={reload}>다시 시도</button></p></div>;
  const end = dateNumber(data.baseDate);
  const start = end - (period - 1) * 86_400_000;
  const points = data.points.filter(point => dateNumber(point.date) >= start && dateNumber(point.date) <= end);
  if (!points.length) return <div className="factor-history-chart" ref={container}>{heading}<p className="factor-history-placeholder">이 기간의 값이 없습니다.</p></div>;
  const values = points.map(point => point.value);
  const low = Math.min(...values), high = Math.max(...values);
  const pad = (high - low || Math.abs(high) * .1 || 1) * .2;
  const min = low - pad, max = high + pad;
  const right = width - 16;
  const x = (date: string) => 58 + (dateNumber(date) - start) / Math.max(1, end - start) * (right - 58);
  const y = (value: number) => 152 - (value - min) / (max - min) * 116;
  // Consecutive days are solid; a day without a value is bridged with a faint dotted line (no value is created).
  const coord = (point: { date: string; value: number }) => `${x(point.date).toFixed(2)},${y(point.value).toFixed(2)}`;
  const isGap = (index: number) => index > 0 && dateNumber(points[index].date) - dateNumber(points[index - 1].date) > 86_400_000;
  const path = points.map((point, index) => `${index && !isGap(index) ? "L" : "M"}${coord(point)}`).join(" ");
  const gapPath = points.flatMap((point, index) => isGap(index) ? [`M${coord(points[index - 1])} L${coord(point)}`] : []).join(" ");
  const last = points.at(-1)!;
  const tick = (value: number) => formatNumber(value, data.unit === "원" ? 0 : 1);
  return <div className="factor-history-chart" ref={container}>
    {heading}
    <svg viewBox={`0 0 ${width} 186`} role="img" aria-label={`${factor.label} 과거 추이`} className="factor-history-svg">
      <title>{`${factor.label} 과거 추이`}</title>
      <desc>{`${formatDate(points[0].date)}부터 ${formatDate(last.date)}까지 ${points.length}개 값. 마지막 값 ${factorValue(last.value, data.unit)}.`}</desc>
      <text x="50" y="17" textAnchor="end" fontSize="10" fill="#65776b">{data.unit || "지표값"}</text>
      {[max, (min + max) / 2, min].map(value => <g key={value}><line x1="58" x2={right} y1={y(value)} y2={y(value)} stroke="#e4ece2" /><text x="50" y={y(value) + 4} textAnchor="end" fill="#65776b" fontSize="10">{tick(value)}</text></g>)}
      {gapPath && <path data-series="gap" d={gapPath} fill="none" stroke="#23804d" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round" />}
      <path d={path} fill="none" stroke="#23804d" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(last.date)} cy={y(last.value)} r="4" fill="#14532d" stroke="white" strokeWidth="2" />
      <text x="58" y="178" fontSize="10" fill="#65776b">{points[0].date.slice(5)}</text><text x={right} y="178" textAnchor="end" fontSize="10" fill="#65776b">{last.date.slice(5)}</text>
    </svg>
    <p className="chart-footnote">{formatDate(last.date)} · 마지막 값 {factorValue(last.value, data.unit)} · 값 {points.length}건{gapPath ? " · 값이 없는 날은 옅은 점선으로 이음" : ""} · 예측 시점에 모델이 받은 값</p>
  </div>;
}

function FactorRow({ itemId, factor, maximum, open, onToggle }: { itemId: string; factor: ShapFactor; maximum: number; open: boolean; onToggle: () => void }) {
  const difference = factor.value !== null && factor.previousValue !== null ? factor.value - factor.previousValue : null;
  const tone = toneClass(factor.direction);
  const width = `${Math.abs(factor.contribution) / maximum * 48}%`;
  const verb = factor.direction === "down" ? "가격을 낮추는 방향" : factor.direction === "up" ? "가격을 높이는 방향" : "뚜렷한 방향 없이";
  return <div className="dashboard-factor-row">
    <h3><button type="button" id={`factor-${factor.id}`} aria-expanded={open} aria-controls={`factor-content-${factor.id}`} className="dashboard-factor-toggle" onClick={onToggle}>
      <span className="dashboard-factor-name">{factor.label}</span>
      <span className="dashboard-factor-value"><strong>{factorValue(factor.value, factor.unit)}</strong>{difference !== null && <small>7일 전 대비 {signed(difference, decimals(factor.unit, difference))}{factor.unit}</small>}</span>
      <span className="dashboard-factor-impact"><span className="shap-bar" aria-hidden="true"><i className="shap-zero" />{factor.direction !== "neutral" && <i className={factor.direction === "down" ? "shap-down" : "shap-up"} style={{ width, [factor.direction === "down" ? "right" : "left"]: "50%" }} />}</span><strong className={tone}>{contributionText(factor.contribution)}</strong></span>
      <span className={`dashboard-factor-badge ${factor.direction === "up" ? "is-up" : factor.direction === "down" ? "is-down" : ""}`}>{factor.direction === "down" ? "하락 요인" : factor.direction === "up" ? "상승 요인" : "중립"}</span>
      <svg className={`dashboard-factor-chevron ${open ? "is-open" : ""}`} viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 7 5 5 5-5" /></svg>
    </button></h3>
    <div id={`factor-content-${factor.id}`} role="region" aria-labelledby={`factor-${factor.id}`} hidden={!open}>
      {open && <div className="dashboard-factor-expanded">
        {factor.hasHistory ? <FactorTrendChart itemId={itemId} factor={factor} /> : <p className="factor-history-placeholder">이 요인은 예측 대상일의 시기(계절)를 나타내는 값이라 추이를 제공하지 않습니다.</p>}
        <div className="dashboard-factor-interpretation"><h4>요인 해석</h4>
          <p>{factor.label}은(는) 이번 모델의 7일 후 가격 예측에서 <strong className={tone}>{verb}</strong>으로 작용했습니다.</p>
          {factor.previousValue !== null && factor.previousDate && factor.value !== null && <p className="factor-comparison-detail">{formatDate(factor.previousDate)}의 같은 지표 {factorValue(factor.previousValue, factor.unit)}에서 현재 {factorValue(factor.value, factor.unit)}로 변했습니다.</p>}
          <p className="factor-interpretation-note">SHAP {contributionText(factor.contribution)}은 모델 예측에 대한 기여입니다. 실제 가격 변동액이나 인과관계를 뜻하지 않습니다.</p>
        </div>
      </div>}
    </div>
  </div>;
}

function ShapTable({ item, analysis }: { item: LivePrice; analysis: ShapAnalysis }) {
  const [category, setCategory] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(analysis.factors[0]?.id ?? null);
  const present = [...new Set(analysis.factors.map(factor => factor.category))];
  const filtered = analysis.factors.filter(factor => category === "all" || factor.category === category);
  const visible = showAll ? filtered : filtered.slice(0, TOP_COUNT);
  const maximum = Math.max(1, ...analysis.factors.map(factor => Math.abs(factor.contribution)));
  return <section className="dashboard-factors" aria-labelledby="factor-details-title">
    <div className="dashboard-factor-heading"><h2 id="factor-details-title">예측에 영향을 준 요인</h2>
      <div className="factor-filter" role="group" aria-label="영향 요인 분류">{[{ key: "all", label: "전체" }, ...present.map(key => ({ key, label: categoryLabels[key] ?? key }))].map(filter =>
        <button key={filter.key} type="button" aria-pressed={category === filter.key} onClick={() => { setCategory(filter.key); setShowAll(false); }}>{filter.label}</button>)}</div></div>
    <div className="dashboard-factor-columns" aria-hidden="true"><span>요인</span><span>현재 상태</span><span>예측에 미친 영향 <small>← 하락 · 0 · 상승 →</small></span><span>상태</span><span /></div>
    {visible.map(factor => <FactorRow key={factor.id} itemId={item.id} factor={factor} maximum={maximum} open={expanded === factor.id} onToggle={() => setExpanded(expanded === factor.id ? null : factor.id)} />)}
    {filtered.length > TOP_COUNT && <button type="button" className="dashboard-factor-note w-full text-left font-semibold text-primary" onClick={() => setShowAll(value => !value)}>
      {showAll ? "주요 요인만 보기" : `영향이 작은 요인 ${filtered.length - TOP_COUNT}개 더 보기`}</button>}
    <p className="dashboard-factor-note">{caveat}{analysis.basePrice !== null && analysis.predictedPrice !== null && ` 모델 기대값 ${formatNumber(analysis.basePrice)}원에 요인 기여를 더하면 7일 후 예측가 ${formatNumber(analysis.predictedPrice)}원이 됩니다.`}</p>
  </section>;
}

/** Detail page: SHAP table when the published run is explained; otherwise the observation cards from guide.factors.
 * The reason note is skipped when the server summary (shown above) already says why. */
export function ShapFactorPanel({ item }: { item: LivePrice }) {
  const { data, error, loading } = usePriceFactors(item.id);
  if (loading) return <section className="dashboard-factors"><div className="dashboard-factor-heading"><h2>예측에 영향을 준 요인</h2></div><p className="dashboard-factor-empty">요인을 불러오는 중입니다.</p></section>;
  if (data?.explained) return <ShapTable item={item} analysis={data} />;
  return <>
    {!error && data && !item.aiSummary && <p className="mb-3 rounded-xl border border-[var(--color-brand-border)] bg-white px-5 py-4 text-sm text-muted">{unavailableText(data.unavailableReason)}</p>}
    <DataFactorPanel item={item} variant="detail" />
  </>;
}

/** Home AI INSIGHT: category totals with server sentences; falls back to observation cards. */
export function ShapInsight({ item }: { item: LivePrice }) {
  const { data, loading } = usePriceFactors(item.id);
  if (loading) return <section className="home-factor-panel" aria-busy="true"><p className="home-eyebrow">AI INSIGHT · {item.name}</p><p className="mt-4 text-sm text-muted">분석을 불러오는 중입니다.</p></section>;
  if (!data?.explained) return <DataFactorPanel item={item} variant="home" />;
  const total = data.categories.reduce((sum, row) => sum + row.contribution, 0);
  return <section className="home-factor-panel" aria-label={`${item.name} AI 분석 요약`}>
    <p className="home-eyebrow">AI INSIGHT · {item.name}</p>
    <h2>{total < 0 ? "AI는 왜 가격 하락을 예상했나요?" : total > 0 ? "AI는 왜 가격 상승을 예상했나요?" : "AI는 가격 흐름을 어떻게 해석했나요?"}</h2>
    <div className="factor-summary-grid">{data.categories.map(row => <article key={row.category} className="factor-category-card">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3>{row.label}</h3>
        <span className={`price-direction ${row.direction === "down" ? "price-down" : row.direction === "up" ? "price-up" : "bg-slate-100 text-slate-600"}`}>{row.direction === "down" ? "하락 방향" : row.direction === "up" ? "상승 방향" : "중립"}</span></div>
      <p>{row.description}</p>
    </article>)}</div>
    <p className="factor-caveat">요인들의 SHAP 값을 분류별로 합산한 설명입니다. 인과관계를 뜻하지 않으며, 표시된 합은 현재가 대비 변동액과 다를 수 있습니다.</p>
  </section>;
}
