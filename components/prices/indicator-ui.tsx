import type { IndicatorSignal, IndicatorState, LivePrice } from "@/lib/prices/model";
import { won } from "@/lib/prices/format";

/**
 * 홈과 상세가 함께 쓰는 지표 표현. 색 의미는 한 곳(globals.css 의 --color-price-* 토큰)에서 정한다:
 * 낮음·하락 = 파랑(tone-down), 높음·상승 = 빨강(tone-up), 보통·보합 = 회색(tone-flat). 방향은 서버 state를 그대로 쓴다.
 */
export function toneClass(state: IndicatorState | "flat" | null | undefined) {
  return state === "up" ? "tone-up" : state === "down" ? "tone-down" : "tone-flat";
}

/** 숫자 변화(주간 변동 등)의 색. 0이나 값 없음은 보통. */
export function changeTone(value: number | null) {
  return value === null || value === 0 ? "tone-flat" : value > 0 ? "tone-up" : "tone-down";
}

/** 상태 문구("싼 편")를 상태 색으로. 표 셀처럼 좁은 곳에 쓴다. 의미는 문구가 전하므로 장식 점은 두지 않는다. */
export function StateText({ signal }: { signal: IndicatorSignal | null }) {
  if (!signal) return <span className="ind-state tone-flat">—</span>;
  return <span className={`ind-state ${toneClass(signal.state)}`}>{signal.stateLabel}</span>;
}

/** 최저~최고 범위에서 현재 위치. mark는 평균 같은 기준선. compact는 라벨 없이 막대만. */
export function RangeBar({ low, high, current, mark = null, lowLabel, highLabel, label, compact = false }: {
  low: number; high: number; current: number; mark?: number | null; lowLabel?: string; highLabel?: string; label: string; compact?: boolean;
}) {
  const at = (value: number) => `${Math.min(100, Math.max(0, (value - low) / Math.max(1e-9, high - low) * 100))}%`;
  return <div className={compact ? "indicator-range is-compact" : "indicator-range"} role="img" aria-label={label}>
    <div className="range-track">{mark !== null && <i className="range-mark" style={{ left: at(mark) }} />}<b className="range-dot" style={{ left: at(current) }} /></div>
    {!compact && (lowLabel || highLabel) && <div className="range-labels"><span>{lowLabel}</span><span>{highLabel}</span></div>}
  </div>;
}

/**
 * 목록 응답의 1년 범위로 그린 compact 막대(시세표). 상세의 1년 위치 카드와 같은 RangeBar를 쓴다.
 * compact에서는 현재 위치를 원 대신 세로 눈금으로 그리고, 눈금 색은 부모의 상태 색(currentColor)을 따른다.
 */
export function YearRangeBar({ item }: { item: LivePrice }) {
  const range = item.listIndicators?.yearRange;
  if (!range || range.low === null || range.high === null || item.currentPrice === null || range.high <= range.low) return null;
  return <RangeBar compact low={range.low} high={range.high} current={item.currentPrice}
    label={`1년 최저 ${won(range.low)}, 최고 ${won(range.high)} 사이에서 현재 ${won(item.currentPrice)}`} />;
}

const FORECAST_WORD = { up: "상승", down: "하락", flat: "보합" } as const;

/** 예측가 · 방향. 방향은 ±3% 기준(lib/prices/indicator.ts)이라 보합에는 화살표를 붙이지 않는다. */
export function ForecastLabel({ item }: { item: LivePrice }) {
  if (item.forecastPrice === null) return <span className="forecast-label">—</span>;
  return <span className="forecast-label">{won(item.forecastPrice)}{item.forecastDirection && ` · ${FORECAST_WORD[item.forecastDirection]}`}</span>;
}
