import Link from "next/link";
import type { IndicatorSignal } from "@/lib/prices/model";
import { formatWon } from "@/lib/prices/format";
import { StateText, toneClass } from "@/components/prices/indicator-ui";
import type { OverviewItem } from "./analysis-room";

const W = 240, H = 64, PAD = 4;

/** 1년 가격 작은 그래프. 품목마다 가격대가 달라 세로 눈금은 품목별로 잡는다(최저~최고). 끝점만 판단 색. */
function Mini({ history, signal, name }: { history: OverviewItem["history"]; signal: IndicatorSignal | null; name: string }) {
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
    <span className={`an-mini-dot ${toneClass(signal?.state)}`} style={{ left: `${(x(points.length - 1) / W) * 100}%`, top: `${(y(last.price) / H) * 100}%` }} aria-hidden="true" />
    <span className="an-mini-scale fv-cap"><span>최고 {formatWon(high)}</span><span>최저 {formatWon(low)}</span></span>
  </div>;
}

export function OverviewGrid({ rows, selectedId }: { rows: OverviewItem[]; selectedId: string }) {
  return <ul className="an-overview">
    {rows.map(({ item, history }) => {
      const signal = item.listIndicators?.signals.find(s => s.key === "SEASONAL") ?? null;
      return <li key={item.id}>
        <Link href={`/analysis?item=${item.id}`} scroll={false} prefetch={false} className="fv-card an-ov-card" aria-current={item.id === selectedId ? "page" : undefined}>
          <span className="an-ov-top">
            <strong>{item.name}</strong>
            <span className="fv-num an-ov-price">{formatWon(item.currentPrice)}</span>
          </span>
          <Mini history={history} signal={signal} name={item.name} />
          <span className="an-ov-foot fv-cap">평년 대비 <StateText signal={signal} /></span>
        </Link>
      </li>;
    })}
  </ul>;
}
