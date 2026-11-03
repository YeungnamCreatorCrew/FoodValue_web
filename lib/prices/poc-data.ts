import rawPoc from "./data/green-onion-poc.json";
import { forecastMetrics, type AnalysisFactor, type FactorHistoryPoint, type FactorKey, type PriceRecord } from "./poc-types";

const factorKeys: FactorKey[] = ["temp_ma7", "humidity_ma7", "price_ma3", "price_std7", "price_lag7", "price_now"];
const factors: AnalysisFactor[] = rawPoc.factors.map(factor => {
  if (!factorKeys.includes(factor.id as FactorKey)
    || (factor.category !== "weather" && factor.category !== "price")
    || (factor.direction !== "up" && factor.direction !== "down")) {
    throw new Error(`Unsupported PoC factor: ${factor.id}`);
  }
  return { ...factor, category: factor.category, direction: factor.direction, historyKey: factor.id as FactorKey };
});
const factorHistory: FactorHistoryPoint[] = rawPoc.factorHistory;
const metrics = forecastMetrics(rawPoc.currentPrice, rawPoc.forecastPrice);
if (metrics.forecastDelta !== rawPoc.forecastDelta || metrics.forecastPercent !== rawPoc.forecastPercent) {
  throw new Error("PoC forecast totals do not match the JSON endpoints");
}
// Explicit projection: backtest actualAfter7Days is never included in UI props.
// The JSON remains untouched; no observations or intermediate forecasts are created.
export const greenOnionPoc: PriceRecord = {
  id: rawPoc.id, name: rawPoc.name, aliases: ["흙대파", "파", "다진 파"],
  category: rawPoc.category, categoryCode: "VEGETABLE", unit: rawPoc.unit,
  image: "/figma/home/green-onion.png", isPoc: true, isDemo: false,
  baseDate: rawPoc.baseDate, currentPrice: rawPoc.currentPrice,
  forecastDate: rawPoc.forecastDate, forecastPrice: rawPoc.forecastPrice,
  forecastDelta: rawPoc.forecastDelta, forecastPercent: rawPoc.forecastPercent,
  forecastDirection: metrics.forecastDirection,
  factors, priceHistory: rawPoc.priceHistory, factorHistory,
};

export function factorSummary(item: PriceRecord) {
  return (["weather", "price"] as const).flatMap(category => {
    const factors = item.factors.filter(factor => factor.category === category);
    if (!factors.length) return [];
    const total = factors.reduce((sum, factor) => sum + factor.shapValue, 0);
    return [{ category, label: category === "weather" ? "기상 조건" : "최근 가격 흐름", direction: total < 0 ? "down" as const : "up" as const, total }];
  });
}
