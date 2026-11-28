"use client";

import { useId, useMemo, useState } from "react";
import type { PricePositionCard, PricePoint, SeasonalCard } from "@/lib/prices/model";
import { formatNumber, formatWon, shortDate } from "@/lib/prices/format";
import { POSITION_HIGH, POSITION_LOW, SEASONAL_BAND, lastYearPrices, percentileOf, positionState, seasonalState } from "@/lib/analysis/compute";
import { toneClass } from "@/components/prices/indicator-ui";
import { Ruler, SEASONAL_LABEL, diffToPosition } from "./judgment-flow";

const pct = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value * 100), 1)}%`;
const POSITION_LABEL = { down: "싼 편", neutral: "중간", up: "비싼 편" } as const;

function Slider({ label, value, min, max, step, onChange, original }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; original: number }) {
  const id = useId();
  return <div className="an-slider">
    <div className="an-slider-head">
      <label htmlFor={id}>{label}</label>
      <output htmlFor={id} className="fv-num an-slider-value">{formatWon(value)}</output>
      {value !== original && <button type="button" className="fv-btn is-quiet an-reset" onClick={() => onChange(original)}>실제 값으로</button>}
    </div>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
      aria-valuetext={formatWon(value)} />
    <div className="an-slider-ends fv-cap fv-num"><span>{formatWon(min)}</span><span>실제 {formatWon(original)}</span><span>{formatWon(max)}</span></div>
  </div>;
}

function SeasonalWhatIf({ card }: { card: SeasonalCard }) {
  const normal = card.fact.normalAvg!, actual = card.fact.recentAvg!;
  const step = normal >= 5000 ? 50 : 10;
  const round = (v: number) => Math.round(v / step) * step;
  const [value, setValue] = useState(actual);
  const diff = value / normal - 1;
  const state = seasonalState(diff);
  const changed = state !== (card.state ?? seasonalState(actual / normal - 1));
  return <article className="fv-card an-whatif">
    <h3 className="an-card-title">평년 대비</h3>
    <Slider label="최근 4주 평균 가격" value={value} min={round(normal * 0.6)} max={round(normal * 1.4)} step={step} onChange={setValue} original={actual} />
    <p className="an-formula fv-num">({formatNumber(value)} − 평년 {formatNumber(normal)}) ÷ {formatNumber(normal)} = {pct(diff)}</p>
    <Ruler position={diffToPosition(diff)} cuts={[diffToPosition(-SEASONAL_BAND), diffToPosition(SEASONAL_BAND)]} labels={["싼 편", "평년 수준", "비싼 편"]} ends={["−30%", "+30%"]} pin={pct(diff)} />
    <p className="an-whatif-result" aria-live="polite">판단: <b className={toneClass(state)}>{SEASONAL_LABEL[state]}</b>{changed && <span className="fv-badge is-brand">실제와 달라져요</span>}</p>
    <p className="fv-cap">평년 {formatWon(normal)} 기준으로 <b className="fv-num">{formatWon(Math.round(normal * (1 - SEASONAL_BAND)))}</b> 이하면 싼 편, <b className="fv-num">{formatWon(Math.round(normal * (1 + SEASONAL_BAND)))}</b> 이상이면 비싼 편이에요.</p>
  </article>;
}

const BINS = 24;

/** 1년 가격 분포(막대) + 25%·75% 경계 + 지금 값. 오늘 가격을 바꾸면 그날 값만 바꿔 다시 센다(서버도 오늘을 분포에 넣는다). */
function PositionWhatIf({ history, asOf, server }: { history: PricePoint[]; asOf: string | null; server: PricePositionCard | null }) {
  const year = useMemo(() => lastYearPrices(history, asOf), [history, asOf]);
  const actual = year.at(-1)?.price ?? 0;
  const [value, setValue] = useState(actual);
  const prices = useMemo(() => year.map(p => p.price), [year]);
  const low = Math.min(...prices), high = Math.max(...prices);
  const step = high >= 5000 ? 50 : 10;
  const round = (v: number) => Math.round(v / step) * step;
  const min = round(low * 0.85), max = round(high * 1.15);
  const values = [...prices.slice(0, -1), value];
  const p = percentileOf(values, value) ?? 0;
  const state = positionState(p);
  const sorted = values.toSorted((a, b) => a - b);
  const q = (r: number) => sorted[Math.min(sorted.length - 1, Math.floor(r * sorted.length))];
  const bins = useMemo(() => {
    const width = (max - min) / BINS;
    const counts = Array.from({ length: BINS }, () => 0);
    for (const v of prices.slice(0, -1)) counts[Math.min(BINS - 1, Math.max(0, Math.floor((v - min) / width)))]++;
    return counts;
  }, [prices, min, max]);
  const peak = Math.max(...bins, 1);
  const at = (v: number) => `${((v - min) / (max - min)) * 100}%`;
  return <article className="fv-card an-whatif">
    <h3 className="an-card-title">1년 중 위치</h3>
    <Slider label="오늘 가격" value={value} min={min} max={max} step={step} onChange={setValue} original={actual} />
    <figure className="an-hist">
      <div className="an-hist-plot" role="img" aria-label={`최근 1년 ${prices.length}일 가격 분포. 하위 25% 경계 ${formatWon(q(POSITION_LOW))}, 상위 25% 경계 ${formatWon(q(POSITION_HIGH))}`}>
        {bins.map((count, i) => <span key={i} className="an-hist-bar" style={{ height: `${(count / peak) * 100}%` }} title={`${formatWon(Math.round(min + (i * (max - min)) / BINS))}~ : ${count}일`} />)}
        <span className="an-hist-cut" style={{ left: at(q(POSITION_LOW)) }}><span className="fv-cap">25%</span></span>
        <span className="an-hist-cut" style={{ left: at(q(POSITION_HIGH)) }}><span className="fv-cap">75%</span></span>
        <span className={`an-hist-now ${toneClass(state)}`} style={{ left: at(value) }} aria-hidden="true" />
      </div>
      <figcaption className="fv-cap">막대 = 최근 1년 {formatNumber(prices.length)}일 가격 분포(그 가격대였던 날 수)</figcaption>
    </figure>
    <p className="an-formula fv-num">{formatWon(value)}보다 싼 날 비율 = {formatNumber(p * 100, 1)}%</p>
    {server?.fact.percentile != null && value === actual && Math.abs(server.fact.percentile - p) >= 0.0005 && <p className="fv-cap">
      서버 계산은 {formatNumber(server.fact.percentile * 100, 1)}%예요. 화면이 받는 가격 이력은 오늘까지 1년이라, 기준일({shortDate(asOf)})까지 1년 중 앞쪽 며칠이 빠져 조금 달라요.</p>}
    <p className="an-whatif-result" aria-live="polite">자리: <b className={toneClass(state)}>{POSITION_LABEL[state]}</b>{state !== positionState(percentileOf(prices, actual) ?? 0) && <span className="fv-badge is-brand">실제와 달라져요</span>}</p>
    <p className="fv-cap"><b className="fv-num">{formatWon(q(POSITION_LOW))}</b> 언저리 아래면 싼 편, <b className="fv-num">{formatWon(q(POSITION_HIGH))}</b> 언저리 위면 비싼 편이에요.</p>
  </article>;
}

export function WhatIf({ seasonal, position, history, asOf, unit }: { seasonal: SeasonalCard | null; position: PricePositionCard | null; history: PricePoint[]; asOf: string | null; unit: string }) {
  const hasSeasonal = seasonal?.fact.normalAvg != null && seasonal.fact.recentAvg != null;
  const hasYear = lastYearPrices(history, asOf).length >= 30;
  if (!hasSeasonal && !hasYear) return <p className="fv-notice">다시 계산할 가격 기록이 모자라요.</p>;
  return <>
    <div className="an-whatifs">
      {hasSeasonal && <SeasonalWhatIf card={seasonal!} />}
      {hasYear && <PositionWhatIf history={history} asOf={asOf} server={position} />}
    </div>
    <p className="fv-cap">가격 단위: {unit}. 슬라이더는 화면에서만 다시 계산해요. 실제 판단은 바뀌지 않아요.</p>
  </>;
}
