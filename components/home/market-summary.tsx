"use client";

import type { LivePrice } from "@/lib/prices/model";
import { formatDate } from "@/lib/prices/format";
import { FILTERS, type FilterId } from "./indicator-price-table";

/**
 * 전체 품목을 지표별로 센 숫자. 표의 행을 반복하지 않고 "오늘 시장이 어떤지"만 보여준다.
 * 지표 숫자를 누르면 아래 시세표가 그 조건으로 걸러진다. 구매 판정은 하지 않는다.
 */
export function MarketSummary({ items, onPick }: { items: LivePrice[]; onPick: (filter: FilterId) => void }) {
  const priceDate = items.map(item => item.priceDate).filter((date): date is string => Boolean(date)).toSorted().at(-1) ?? null;
  const up = items.filter(item => (item.weeklyChangeRate ?? 0) > 0).length;
  const down = items.filter(item => (item.weeklyChangeRate ?? 0) < 0).length;
  const hasIndicators = items.some(item => item.listIndicators);
  const indicatorStats = FILTERS.filter(entry => entry.id !== "all").map(entry => ({ ...entry, count: items.filter(entry.test).length }));

  return <section className="market-summary" aria-labelledby="market-summary-title">
    <h2 id="market-summary-title" className="market-summary-title">오늘 시세 한눈에 · 품목 {items.length}개 · 가격 기준일 {formatDate(priceDate)}</h2>
    <dl className="market-stats">
      <div className="market-stat"><dt>지난주보다 오른 품목</dt><dd className="ind-up">{up}</dd></div>
      <div className="market-stat"><dt>지난주보다 내린 품목</dt><dd className="ind-down">{down}</dd></div>
      {hasIndicators && indicatorStats.map(stat => <div key={stat.id} className="market-stat">
        <dt><button type="button" className="market-stat-link" onClick={() => onPick(stat.id)}>{stat.label}<span aria-hidden="true"> →</span></button></dt>
        <dd>{stat.count}</dd>
      </div>)}
    </dl>
  </section>;
}
