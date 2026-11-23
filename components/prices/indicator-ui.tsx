import type { LivePrice } from "@/lib/prices/model";
import { won } from "@/lib/prices/format";

/** 1년 최저~최고 범위에서 현재가 위치. compact는 라벨 없이 막대만 그린다. */
export function YearRangeBar({ item, compact = false }: { item: LivePrice; compact?: boolean }) {
  const range = item.listIndicators?.yearRange;
  if (!range || range.low === null || range.high === null || item.currentPrice === null || range.high <= range.low) return null;
  const ratio = Math.min(1, Math.max(0, (item.currentPrice - range.low) / (range.high - range.low)));
  return <div className={compact ? "year-bar year-bar-compact" : "year-bar"} role="img"
    aria-label={`1년 최저 ${won(range.low)}, 최고 ${won(range.high)} 사이에서 현재 ${won(item.currentPrice)}`}>
    <span className="year-bar-track"><span className="year-bar-mark" style={{ left: `${ratio * 100}%` }} /></span>
    {!compact && <span className="year-bar-ends"><span>1년 최저 {won(range.low)}</span><span>최고 {won(range.high)}</span></span>}
  </div>;
}

const FORECAST_WORD = { up: "상승", down: "하락", flat: "보합" } as const;

/** 예측가 · 방향. 방향은 ±3% 기준(lib/prices/indicator.ts)이라 보합에는 화살표를 붙이지 않는다. */
export function ForecastLabel({ item }: { item: LivePrice }) {
  if (item.forecastPrice === null) return <span className="forecast-label">—</span>;
  return <span className="forecast-label">{won(item.forecastPrice)}{item.forecastDirection && ` · ${FORECAST_WORD[item.forecastDirection]}`}</span>;
}
