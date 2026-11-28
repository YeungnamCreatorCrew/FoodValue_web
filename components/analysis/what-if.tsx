"use client";

import { useId, useMemo, useState } from "react";
import type { PricePositionCard, PricePoint } from "@/lib/prices/model";
import { formatNumber, formatWon } from "@/lib/prices/format";
import { POSITION_HIGH, POSITION_LOW, lastYearPrices, percentileOf, positionState } from "@/lib/analysis/compute";
import { toneClass } from "@/components/prices/indicator-ui";

const POSITION_LABEL = { down: "싼 편", neutral: "중간", up: "비싼 편" } as const;

export function Slider({ label, value, min, max, step, onChange, original }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; original: number }) {
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

const BINS = 24;

/**
 * 1년 중 위치: 1년 가격 분포(막대) + 25%·75% 경계 + 지금 값, 슬라이더로 오늘 가격을 바꿔 볼 수 있다.
 * 실제 값일 때는 서버 백분위를 그대로 보여준다(화면 이력은 오늘까지 1년이라 직접 세면 기준일 1년과 조금 달라진다).
 */
export function PositionCard({ history, asOf, server }: { history: PricePoint[]; asOf: string | null; server: PricePositionCard | null }) {
  const year = useMemo(() => lastYearPrices(history, asOf), [history, asOf]);
  const actual = year.at(-1)?.price ?? 0;
  const [value, setValue] = useState(actual);
  const prices = useMemo(() => year.map(p => p.price), [year]);
  const low = Math.min(...prices), high = Math.max(...prices);
  const step = high >= 5000 ? 50 : 10;
  const round = (v: number) => Math.round(v / step) * step;
  const min = round(low * 0.85), max = round(high * 1.15);
  const values = [...prices.slice(0, -1), value];
  const changed = value !== actual;
  const p = !changed && server?.fact.percentile != null ? server.fact.percentile : percentileOf(values, value) ?? 0;
  const state = positionState(p);
  const actualState = server?.fact.percentile != null ? positionState(server.fact.percentile) : positionState(percentileOf(prices, actual) ?? 0);
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
  const fact = server?.fact;
  return <article className="fv-card an-pcalc">
    <h3 className="an-card-title">1년 중 위치 <span className="fv-cap">지난 1년 가격 중 어디쯤인가</span></h3>
    <p className="an-formula">최근 1년 중 {formatWon(value)}보다 싼 날의 비율</p>
    <p className="an-step-v fv-num">= {formatNumber(p * 100, 1)}%<span className={`an-pcalc-state ${toneClass(state)}`}> → {POSITION_LABEL[state]}</span>
      {state !== actualState && <span className="fv-badge is-brand">실제와 달라져요</span>}</p>
    <figure className="an-hist">
      <div className="an-hist-plot" role="img" aria-label={`최근 1년 ${prices.length}일 가격 분포. 하위 25% 경계 ${formatWon(q(POSITION_LOW))}, 상위 25% 경계 ${formatWon(q(POSITION_HIGH))}`}>
        {bins.map((count, i) => <span key={i} className="an-hist-bar" style={{ height: `${(count / peak) * 100}%` }} title={`${formatWon(Math.round(min + (i * (max - min)) / BINS))}~ : ${count}일`} />)}
        <span className="an-hist-cut" style={{ left: at(q(POSITION_LOW)) }}><span className="fv-cap">25%</span></span>
        <span className="an-hist-cut" style={{ left: at(q(POSITION_HIGH)) }}><span className="fv-cap">75%</span></span>
        <span className={`an-hist-now ${toneClass(state)}`} style={{ left: at(value) }} aria-hidden="true" />
      </div>
      <figcaption className="fv-cap">막대 = 그 가격대였던 날 수 (최근 1년 {formatNumber(prices.length)}일). <b className="fv-num">{formatWon(q(POSITION_LOW))}</b> 언저리 아래면 싼 편, <b className="fv-num">{formatWon(q(POSITION_HIGH))}</b> 언저리 위면 비싼 편.</figcaption>
    </figure>
    {fact && <p className="fv-cap">1년 최저 {formatWon(fact.low)} · 평균 {formatWon(fact.avg)} · 최고 {formatWon(fact.high)}</p>}
    <Slider label="오늘 가격이 이 값이라면?" value={value} min={min} max={max} step={step} onChange={setValue} original={actual} />
  </article>;
}
