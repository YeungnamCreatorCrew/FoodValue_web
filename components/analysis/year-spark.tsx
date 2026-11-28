import type { IndicatorState, PricePoint } from "@/lib/prices/model";
import { formatWon } from "@/lib/prices/format";
import { toneClass } from "@/components/prices/indicator-ui";

const W = 320, H = 72, PAD = 4;

/** 고른 품목의 1년 가격 그래프. 세로 눈금은 그 품목의 최저~최고. 끝점(지금)만 판단 색. */
export function YearSpark({ history, state, name }: { history: PricePoint[]; state: IndicatorState | null; name: string }) {
  const points = history.flatMap(p => p.price === null ? [] : [{ date: p.date, price: p.price }]);
  if (points.length < 2) return <div className="an-mini is-empty fv-cap">가격 기록이 모자라요</div>;
  const low = Math.min(...points.map(p => p.price)), high = Math.max(...points.map(p => p.price));
  const span = high - low || 1;
  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const y = (price: number) => PAD + (1 - (price - low) / span) * (H - PAD * 2);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join("");
  const last = points.at(-1)!;
  return <div className="an-mini">
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${name} 최근 1년: 최저 ${formatWon(low)}, 최고 ${formatWon(high)}, 지금 ${formatWon(last.price)}`}>
      <path d={d} fill="none" stroke="var(--fv-spark-line)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
    <span className={`an-mini-dot ${toneClass(state)}`} style={{ left: `${(x(points.length - 1) / W) * 100}%`, top: `${(y(last.price) / H) * 100}%` }} aria-hidden="true" />
    <span className="an-mini-scale fv-cap fv-num"><span>최고 {formatWon(high)}</span><span>최저 {formatWon(low)}</span></span>
  </div>;
}
