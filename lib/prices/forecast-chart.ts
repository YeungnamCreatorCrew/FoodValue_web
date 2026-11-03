import { dateNumber, historyForPeriod } from "./history";
import type { PriceRecord } from "./poc-types";

/** Shared geometry: observed history and exactly two forecast endpoints. */
export function forecastChart(item: PriceRecord, days: number, bounds: { left: number; right: number; top: number; bottom: number }) {
  const past = historyForPeriod(item.priceHistory, item.baseDate, days);
  const values = [...past.map(point => point.price), item.currentPrice, item.forecastPrice];
  const low = Math.min(...values), high = Math.max(...values);
  const padding = (high - low || 100) * .25;
  const min = low - padding, max = high + padding;
  const start = dateNumber(item.baseDate) - (days - 1) * 86_400_000;
  const end = dateNumber(item.forecastDate);
  const x = (date: string) => bounds.left + (dateNumber(date) - start) / Math.max(1, end - start) * (bounds.right - bounds.left);
  const y = (price: number) => bounds.bottom - (price - min) / (max - min) * (bounds.bottom - bounds.top);
  const currentX = x(item.baseDate), forecastX = x(item.forecastDate);
  const actualPath = past.map((point, index) => `${index ? "L" : "M"}${x(point.date).toFixed(2)},${y(point.price).toFixed(2)}`).join(" ");
  const forecastPath = `M${currentX.toFixed(2)},${y(item.currentPrice).toFixed(2)} L${forecastX.toFixed(2)},${y(item.forecastPrice).toFixed(2)}`;
  return { past, min, max, x, y, currentX, forecastX, actualPath, forecastPath };
}
