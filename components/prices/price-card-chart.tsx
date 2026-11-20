"use client";

import type { LivePrice } from "@/lib/prices/model";
import { withForecast } from "@/lib/prices/mapper";
import { usePriceChart } from "@/lib/prices/use-prices";
import { ForecastSparkline } from "./forecast-sparkline";

export function PriceCardChart({ item, variant = "card" }: { item: LivePrice; variant?: "card" | "hero" }) {
  const { data, loading, error } = usePriceChart(item.id, 14);
  if (loading) return <p role="status" className="py-6 text-xs text-muted">가격 추이를 불러오는 중입니다.</p>;
  if (error || !data) return <p className="py-6 text-xs text-muted">가격 추이를 불러오지 못했습니다.</p>;
  const chartItem = withForecast({ ...item, priceHistory: data.priceHistory, historyEndDate: data.historyEndDate }, data.forecast, data.forecastBaseDate);
  return <ForecastSparkline item={chartItem} variant={variant} />;
}
