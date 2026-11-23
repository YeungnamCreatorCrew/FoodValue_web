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

// 수준 지표(1년 중 위치·평년 대비)는 ↓·↑, 흐름 신호(도매 흐름)는 추세선 ↘·↗, 보통·신호 없음은 —
const ICON_PATHS: Record<"down" | "up" | "fall" | "rise" | "flat", string[]> = {
  down: ["M12 5v14", "m19 12-7 7-7-7"],
  up: ["M12 19V5", "m5 12 7-7 7 7"],
  fall: ["m22 17-8.5-8.5-5 5L2 7", "M16 17h6v-6"],
  rise: ["m22 7-8.5 8.5-5-5L2 17", "M16 7h6v6"],
  flat: ["M5 12h14"],
};
const SIGNAL_KEYS = new Set(["WHOLESALE_LEAD"]);

function StateIcon({ signal }: { signal: IndicatorSignal }) {
  const trend = SIGNAL_KEYS.has(signal.key);
  const shape = signal.state === "down" ? (trend ? "fall" : "down") : signal.state === "up" ? (trend ? "rise" : "up") : "flat";
  return <svg className="ind-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICON_PATHS[shape].map(d => <path key={d} d={d} />)}
  </svg>;
}

/** 방향 아이콘 + 상태 문구("↓ 싼 편"). 색을 못 봐도 모양으로 방향이 읽힌다. */
export function StateText({ signal }: { signal: IndicatorSignal | null }) {
  if (!signal) return <span className="ind-state tone-flat">—</span>;
  return <span className={`ind-state ${toneClass(signal.state)}`}><StateIcon signal={signal} />{signal.stateLabel}</span>;
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
