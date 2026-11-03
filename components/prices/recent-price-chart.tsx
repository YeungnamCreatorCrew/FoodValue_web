import type { PriceRecord } from "@/lib/prices/poc-types";
import { historyForPeriod } from "@/lib/prices/history";
import { formatDate } from "@/lib/prices/format";
import { ForecastSparkline } from "./forecast-sparkline";

export function RecentPriceChart({ item }: { item: PriceRecord }) {
  const points = historyForPeriod(item.priceHistory, item.baseDate, 30);
  if (!points.length) return <p className="recent-price-empty">최근 가격 이력이 없습니다.</p>;
  return <div className="recent-price-chart">
    <div className="recent-price-heading"><h3>최근 가격 및 7일 예측</h3><span>{item.isPoc ? "KAMIS" : "DEMO"}</span></div>
    <ForecastSparkline item={item} historyDays={30} variant="detail" />
    <p>{formatDate(item.baseDate)} 기준 · 관측 {points.length}건{item.isDemo ? " (DEMO)" : ""}</p>
  </div>;
}
