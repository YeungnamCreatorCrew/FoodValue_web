"use client";

import { useEffect, useRef, useState } from "react";
import type { LivePrice } from "@/lib/prices/model";
import { categoryLabels, unavailableText, type ShapAnalysis, type ShapFactor } from "@/lib/prices/shap";
import { formatNumber, shortDate } from "@/lib/prices/format";
import { dateNumber } from "@/lib/prices/history";
import { useFactorTrend } from "@/lib/prices/use-prices";
import { LoadingRegion, Notice, Skeleton } from "@/components/fv/state";
import { josa } from "@/components/fv/text";
import { niceScale } from "@/lib/prices/ticks";
import { ChartHover } from "./chart-hover";

const TOP_COUNT = 8;
const PERIODS = [14, 30, 90] as const;
const caveat = "영향 값은 각 요인이 모델 예측에 보탠 값이에요. 가격이 움직인 원인은 아니에요.";

// 배수(예: 1.29배)는 0.01 단위로 움직여서 소수 첫째 자리로는 7일 차이가 "0배"로 사라진다.
const decimals = (unit: string, value: number) => unit === "원" || unit === "주차" ? 0 : Number.isInteger(value) ? 0 : unit === "배" ? 2 : 1;
/** 값이 없는 것이 정상인 요인(모델 내부 항목)의 이름. "정보 없음"으로 보이면 자료가 빠진 것처럼 읽힌다. */
const BUILT_IN: Record<string, string> = { arima_trend: "모델 추세", seriesProfile: "품목 특성", targetSeason: "계절 값" };
const WEEKDAYS = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
/** 예/아니요(0·1) 요인. 숫자 0·1로 두면 뜻을 알 수 없다. */
const isFlag = (factor: ShapFactor) => factor.label.endsWith("여부");
/** 화면에 쓰는 요인 값. 여부는 예/아니요, 요일은 이름, 단위 없는 지수는 소수 둘째 자리까지. */
export function displayValue(factor: ShapFactor, value: number | null, priceUnit?: string) {
  if (value === null) return BUILT_IN[factor.id] ?? "정보 없음";
  if (isFlag(factor)) return value >= 0.5 ? "예" : "아니요";
  if (factor.id === "target_weekday") return WEEKDAYS[Math.round(value)] ?? formatNumber(value);
  if (factor.unit === "" && !Number.isInteger(value)) return formatNumber(value, 2);
  return factorValue(value, factor.unit, factor.category === "PRICE" ? priceUnit : undefined);
}
/** 7일 전 대비를 말할 수 있는 요인인지(여부·요일·달력 값은 차이가 뜻이 없다). */
const comparable = (factor: ShapFactor) => factor.category !== "CALENDAR" && !isFlag(factor) && factor.unit !== "";

/** 요인 값. 가격(원)이면 품목 단위를 붙인다: "12,150원(1kg)". */
/** % 단위 요인은 변화율이라 부호를 붙인다("+6.8%"). 값이 없으면 "정보 없음". */
export const factorValue = (value: number | null, unit: string, priceUnit?: string) => value === null ? "정보 없음"
  : `${unit === "%" && value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value), decimals(unit, value))}${unit === "주차" ? "주 차" : unit}${unit === "원" && priceUnit ? `(${priceUnit})` : ""}`;
/** 부호는 +와 −(빼기 기호)로 통일한다. */
const signed = (value: number, digits: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value), digits)}`;
/** 영향 값은 원 단위로 반올림한다(원에는 소수를 쓰지 않는다). */
const contributionText = (value: number) => `${signed(Math.round(value), 0)}원`;
const toneClass = (direction: ShapFactor["direction"]) => direction === "down" ? "tone-down" : direction === "up" ? "tone-up" : "tone-flat";

function FactorTrendChart({ itemId, factor, priceUnit }: { itemId: string; factor: ShapFactor; priceUnit: string }) {
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
    <div role="group" aria-label={`${factor.label} 조회 기간`} className="fv-chips">{PERIODS.map(days => <button key={days} type="button" className="fv-chip" aria-pressed={period === days} onClick={() => setPeriod(days)}>{days}일</button>)}</div></div>;
  if (loading) return <div className="factor-history-chart" ref={container}>{heading}<p className="factor-history-placeholder">추이를 불러오는 중이에요.</p></div>;
  if (error || !data) return <div className="factor-history-chart" ref={container}>{heading}<p className="factor-history-placeholder">추이를 불러오지 못했어요. <button type="button" className="fv-link" onClick={reload}>다시 시도</button></p></div>;
  const end = dateNumber(data.baseDate);
  const start = end - (period - 1) * 86_400_000;
  const points = data.points.filter(point => dateNumber(point.date) >= start && dateNumber(point.date) <= end);
  if (!points.length) return <div className="factor-history-chart" ref={container}>{heading}<p className="factor-history-placeholder">이 기간의 값이 없어요.</p></div>;
  const values = points.map(point => point.value);
  const low = Math.min(...values), high = Math.max(...values);
  const { min, max, ticks } = niceScale(low, high, 3);
  const right = width - 16;
  // Only days with a value get a slot (equal spacing), like a stock chart; days without a value are not drawn.
  const xAt = (index: number) => points.length <= 1 ? (58 + right) / 2 : 58 + index / (points.length - 1) * (right - 58);
  const y = (value: number) => 152 - (value - min) / (max - min) * 116;
  const slots = points.map((point, index) => ({ ...point, x: xAt(index), y: y(point.value), previous: points[index - 1] ?? null }));
  const path = slots.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const last = points.at(-1)!;
  const tick = (value: number) => formatNumber(value, data.unit === "원" ? 0 : 1);
  const show = (value: number) => factorValue(value, data.unit, factor.category === "PRICE" ? priceUnit : undefined);
  // 글로 된 흐름 요약(화면 낭독기와 그래프 아래 한 줄 공통).
  const flow = `${shortDate(points[0].date)} ${show(points[0].value)} → ${shortDate(last.date)} ${show(last.value)}.`;
  return <div className="factor-history-chart" ref={container}>
    {heading}
    <svg viewBox={`0 0 ${width} 186`} role="img" aria-label={`${factor.label} 과거 추이`} className="factor-history-svg">
      <title>{`${factor.label} 과거 추이`}</title>
      <desc>{flow}</desc>
      <text x="50" y="17" textAnchor="end" fontSize="12" fill="var(--fv-text-3)">{data.unit || "지표값"}</text>
      {ticks.map(value => <g key={value}><line x1="58" x2={right} y1={y(value)} y2={y(value)} stroke="var(--fv-chart-grid)" /><text x="50" y={y(value) + 4} textAnchor="end" fill="var(--fv-text-3)" fontSize="12">{tick(value)}</text></g>)}
      <path d={path} fill="none" stroke="var(--fv-chart-actual)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={slots.at(-1)!.x} cy={slots.at(-1)!.y} r="4" fill="var(--fv-chart-actual)" stroke="var(--fv-bg)" strokeWidth="2" />
      <text x="58" y="178" fontSize="12" fill="var(--fv-text-3)">{shortDate(points[0].date)}</text><text x={right} y="178" textAnchor="end" fontSize="12" fill="var(--fv-text-3)">{shortDate(last.date)}</text>
      <ChartHover points={slots} left={58} right={right} top={36} bottom={152} unit={data.unit} digits={data.unit === "원" ? 0 : data.unit === "%" ? 1 : 2} color="var(--fv-chart-actual)" />
    </svg>
    <p className="chart-footnote">{flow} 예측할 때 모델이 받은 값이에요.</p>
  </div>;
}

function FactorRow({ itemId, factor, maximum, open, onToggle, priceUnit }: { itemId: string; factor: ShapFactor; maximum: number; open: boolean; onToggle: () => void; priceUnit: string }) {
  // 화면에 보이는 두 값(반올림)의 차이로 계산해야 "11,786 → 12,150"과 "+364원"이 서로 맞는다.
  const shown = (value: number) => Number(value.toFixed(decimals(factor.unit, value)));
  const difference = factor.value !== null && factor.previousValue !== null ? shown(factor.value) - shown(factor.previousValue) : null;
  // 반올림하면 0원인 영향(±0.5원 미만)은 "하락 요인"이라 부르면 숫자와 어긋난다. 중립으로 둔다.
  const direction = Math.abs(factor.contribution) < 0.5 ? "neutral" : factor.direction;
  const tone = toneClass(direction);
  const width = `${Math.abs(factor.contribution) / maximum * 48}%`;
  const verb = direction === "down" ? "낮추는 쪽" : direction === "up" ? "높이는 쪽" : null;
  return <div className="dashboard-factor-row">
    <h3><button type="button" id={`factor-${factor.id}`} aria-expanded={open} aria-controls={`factor-content-${factor.id}`} className="dashboard-factor-toggle" onClick={onToggle}>
      <span className="dashboard-factor-name">{factor.label}</span>
      <span className="dashboard-factor-value"><strong>{displayValue(factor, factor.value, priceUnit)}</strong>{difference !== null && comparable(factor) && <small>7일 전 대비 {signed(difference, decimals(factor.unit, difference))}{factor.unit === "%" ? "%p" : factor.unit}</small>}</span>
      <span className="dashboard-factor-impact"><span className="shap-bar" aria-hidden="true"><i className="shap-zero" />{direction !== "neutral" && <i className={direction === "down" ? "shap-down" : "shap-up"} style={{ width, [direction === "down" ? "right" : "left"]: "50%" }} />}</span><strong className={tone}>{contributionText(factor.contribution)}</strong></span>
      <span className={`dashboard-factor-badge ${direction === "up" ? "is-up" : direction === "down" ? "is-down" : ""}`}>{direction === "down" ? "하락 요인" : direction === "up" ? "상승 요인" : "중립"}</span>
      <svg className={`dashboard-factor-chevron ${open ? "is-open" : ""}`} viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 7 5 5 5-5" /></svg>
    </button></h3>
    <div id={`factor-content-${factor.id}`} role="region" aria-labelledby={`factor-${factor.id}`} hidden={!open}>
      {open && <div className="dashboard-factor-expanded">
        {factor.hasHistory ? <FactorTrendChart itemId={itemId} factor={factor} priceUnit={priceUnit} /> : <p className="factor-history-placeholder">{factor.category === "CALENDAR" ? "예측 대상일의 시기(계절)를 나타내는 값이라 추이가 없어요." : factor.id === "arima_trend" ? "시계열 모델(AutoARIMA)이 본 가격 추세라 따로 값과 추이가 없어요." : "이 요인은 과거 추이를 제공하지 않아요."}</p>}
        <div className="dashboard-factor-interpretation"><h4>요인 해석</h4>
          <p>{josa(factor.label, "은", "는")} {verb ? <>예측을 <strong className={tone}>{verb}</strong>으로 작용했어요.</> : "예측에 뚜렷하게 작용하지 않았어요."}</p>
          {factor.previousValue !== null && factor.previousDate && factor.value !== null && <p className="factor-comparison-detail">{shortDate(factor.previousDate)} {displayValue(factor, factor.previousValue, priceUnit)} → 지금 {displayValue(factor, factor.value, priceUnit)}</p>}
          
        </div>
      </div>}
    </div>
  </div>;
}

function ShapTable({ item, analysis }: { item: LivePrice; analysis: ShapAnalysis }) {
  const [category, setCategory] = useState("all");
  const [showAll, setShowAll] = useState(false);
  // 처음에는 모두 접어 요인 목록 전체가 한눈에 보이게 한다.
  const [expanded, setExpanded] = useState<string | null>(null);
  const present = [...new Set(analysis.factors.map(factor => factor.category))];
  const filtered = analysis.factors.filter(factor => category === "all" || factor.category === category);
  const visible = showAll ? filtered : filtered.slice(0, TOP_COUNT);
  const maximum = Math.max(1, ...analysis.factors.map(factor => Math.abs(factor.contribution)));
  return <section className="dashboard-factors" aria-labelledby="factor-details-title">
    <div className="dashboard-factor-heading"><div><h2 id="factor-details-title">예측에 영향을 준 요인</h2><p className="fv-cap">요인 값은 모델 입력용이라 근거 표 숫자와 다를 수 있어요.</p></div>
      <div className="fv-chips factor-filter" role="group" aria-label="영향 요인 분류">{[{ key: "all", label: "전체" }, ...present.map(key => ({ key, label: categoryLabels[key] ?? key }))].map(filter =>
        <button key={filter.key} type="button" className="fv-chip" aria-pressed={category === filter.key} onClick={() => { setCategory(filter.key); setShowAll(false); }}>{filter.label}</button>)}</div></div>
    <div className="dashboard-factor-columns" aria-hidden="true"><span>요인</span><span>현재 값</span><span>예측에 미친 영향 <small>← 하락 · 0 · 상승 →</small></span><span>상태</span><span /></div>
    {visible.map(factor => <FactorRow key={factor.id} priceUnit={item.unit} itemId={item.id} factor={factor} maximum={maximum} open={expanded === factor.id} onToggle={() => setExpanded(expanded === factor.id ? null : factor.id)} />)}
    {filtered.length > TOP_COUNT && <button type="button" className="fv-link" onClick={() => setShowAll(value => !value)}>
      {showAll ? "주요 요인만 보기" : `영향이 작은 요인 ${filtered.length - TOP_COUNT}개 더 보기`}</button>}
    <p className="dashboard-factor-note">{analysis.factors.some(factor => factor.value === null) && "‘정보 없음’ 요인은 보여줄 숫자를 받지 못한 요인이에요. "}{caveat}{analysis.basePrice !== null && analysis.predictedPrice !== null && ` 기준값은 모델이 평소 값으로 잡은 출발점이에요. 예측가 ${formatNumber(analysis.predictedPrice)}원 = 기준값 ${formatNumber(analysis.basePrice)}원 + 영향 합. 반올림 때문에 몇 원 다를 수 있어요.`}</p>
  </section>;
}

/** 모델 의견 탭의 요인 표. 설명이 있는 예측(검증된 모델)일 때만 표를 그리고, 아니면 이유 한 줄. */
export function ShapFactorView({ item, data, error, loading }: { item: LivePrice; data?: ShapAnalysis; error?: string; loading: boolean }) {
  if (loading) return <LoadingRegion label="예측 요인을 불러오는 중이에요"><Skeleton className="shap-skel" /></LoadingRegion>;
  if (error) return <Notice>예측 요인을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</Notice>;
  if (data?.explained) return <ShapTable item={item} analysis={data} />;
  return <Notice>{unavailableText(data?.unavailableReason ?? null)}</Notice>;
}
