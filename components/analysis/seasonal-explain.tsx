"use client";

import { useState } from "react";
import type { IndicatorState, SeasonalCard } from "@/lib/prices/model";
import { formatNumber, formatWon } from "@/lib/prices/format";
import { SEASONAL_BAND, seasonalState } from "@/lib/analysis/compute";
import { toneClass } from "@/components/prices/indicator-ui";
import { Ruler, SEASONAL_LABEL, diffToPosition, pct } from "./judgment-flow";
import { Slider } from "./what-if";

/**
 * 평년 대비 판단의 계산 ①~④ + 바로 아래 슬라이더. 슬라이더를 움직이면 ①·③·④와 눈금자가 같은 규칙으로 다시 계산된다.
 * 예전에는 계산(섹션 3)과 슬라이더(섹션 4)가 따로 있어 같은 눈금자가 두 번 나왔다.
 */
export function SeasonalExplain({ card }: { card: SeasonalCard }) {
  const { recentAvg, normalAvg, diffRate, normalYears, windowDays, cheaperThanCount, historyYears } = card.fact;
  const [value, setValue] = useState(recentAvg ?? 0);
  if (recentAvg === null || normalAvg === null || diffRate === null) return <p className="fv-notice">평년 대비 계산에 필요한 값이 모자라요.</p>;

  const changed = value !== recentAvg;
  const diff = changed ? value / normalAvg - 1 : diffRate;
  const actualState = card.state ?? seasonalState(diffRate);
  const state = changed ? seasonalState(diff) : actualState;
  const days = windowDays ?? 28;
  const span = normalYears.length ? `${normalYears[0]}~${normalYears.at(-1)}년` : "직전 5년";
  const cheapLine = Math.round(normalAvg * (1 - SEASONAL_BAND)), dearLine = Math.round(normalAvg * (1 + SEASONAL_BAND));
  const step = normalAvg >= 5000 ? 50 : 10;
  const round = (v: number) => Math.round(v / step) * step;
  const branches: { key: IndicatorState; test: string }[] = [
    { key: "down", test: `−${SEASONAL_BAND * 100}% 이하` },
    { key: "neutral", test: `−${SEASONAL_BAND * 100}% ~ +${SEASONAL_BAND * 100}%` },
    { key: "up", test: `+${SEASONAL_BAND * 100}% 이상` },
  ];

  return <article className="fv-card an-judge">
    <ol className="an-steps">
      <li className={`an-stepbox${changed ? " is-changed" : ""}`}>
        <span className="an-stepnum">①</span>
        <p className="an-step-q">최근 {Math.round(days / 7)}주 평균</p>
        <p className="an-step-v fv-num">{formatWon(value)}</p>
        <p className="fv-cap">{changed ? <>바꿔 본 값 (실제 {formatWon(recentAvg)})</> : `기준일까지 ${days}일 동안 조사된 날의 평균`}</p>
      </li>
      <li className="an-stepbox">
        <span className="an-stepnum">②</span>
        <p className="an-step-q">평년 같은 시기 평균</p>
        <p className="an-step-v fv-num">{formatWon(normalAvg)}</p>
        <p className="fv-cap">{span} 같은 시기 {days}일 평균을 다시 평균</p>
      </li>
      <li className="an-stepbox is-calc">
        <span className="an-stepnum">③</span>
        <p className="an-step-q">얼마나 차이 나나</p>
        <p className="an-formula fv-num">({formatNumber(value)} − {formatNumber(normalAvg)}) ÷ {formatNumber(normalAvg)}</p>
        <p className="an-step-v fv-num">= {pct(diff)}</p>
      </li>
      <li className="an-stepbox is-tree">
        <span className="an-stepnum">④</span>
        <p className="an-step-q">기준선과 비교</p>
        <ul className="an-branches">
          {branches.map(b => <li key={b.key} className={b.key === state ? `is-on ${toneClass(b.key)}` : undefined} aria-current={b.key === state ? "step" : undefined}>
            <span className="fv-num">{b.test}</span><span aria-hidden="true">→</span><b>{SEASONAL_LABEL[b.key]}</b>
          </li>)}
        </ul>
      </li>
    </ol>
    <Ruler position={diffToPosition(diff)} cuts={[diffToPosition(-SEASONAL_BAND), diffToPosition(SEASONAL_BAND)]}
      labels={["싼 편", "평년 수준", "비싼 편"]} ends={["−30%", "+30%"]} pin={pct(diff)} />
    <p className="an-judge-foot fv-cap">
      <span><b className="fv-num">{formatWon(cheapLine)}</b> 이하면 싼 편</span>
      <span><b className="fv-num">{formatWon(dearLine)}</b> 이상이면 비싼 편</span>
      {cheaperThanCount !== null && historyYears !== null && <span>기록이 있는 {historyYears}개 연도 중 {cheaperThanCount}개 해가 이번보다 비쌌어요</span>}
    </p>

    <div className="an-try">
      <p className="an-try-title">직접 바꿔 보기 <span className="fv-cap">화면에서만 다시 계산해요. 실제 판단은 안 바뀌어요.</span></p>
      <Slider label="최근 4주 평균이 이 값이라면?" value={value} min={round(normalAvg * 0.6)} max={round(normalAvg * 1.4)} step={step} onChange={setValue} original={recentAvg} />
      <p className="an-whatif-result" aria-live="polite">판단: <b className={toneClass(state)}>{SEASONAL_LABEL[state]}</b>{state !== actualState && <span className="fv-badge is-brand">실제와 달라져요</span>}</p>
    </div>
  </article>;
}
