"use client";

import { useId, useState } from "react";
import type { SeasonalCard } from "@/lib/prices/model";
import { formatNumber, formatWon } from "@/lib/prices/format";
import { SEASONAL_BAND, seasonalState } from "@/lib/analysis/compute";
import { toneClass } from "@/components/prices/indicator-ui";
import { Ruler, SEASONAL_LABEL, diffToPosition } from "./judgment-flow";

const pct = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value * 100), 1)}%`;

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

export function WhatIf({ seasonal, unit }: { seasonal: SeasonalCard; unit: string }) {
  return <>
    <div className="an-whatifs is-one"><SeasonalWhatIf card={seasonal} /></div>
    <p className="fv-cap">가격 단위: {unit}. 슬라이더는 화면에서만 다시 계산해요. 실제 판단은 바뀌지 않아요.</p>
  </>;
}
