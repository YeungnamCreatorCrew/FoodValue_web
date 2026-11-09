import { dateNumber, historyForPeriod } from "./history";
import type { PriceChartData, PricePoint } from "./model";

/** Null observations break the path. Daily WAS forecasts are never interpolated. */
export function forecastChart(item: PriceChartData, days: number, bounds: { left: number; right: number; top: number; bottom: number }) {
  const reference = item.historyEndDate ?? item.baseDate ?? item.priceDate ?? item.forecastDate;
  const past = reference ? historyForPeriod(item.priceHistory, reference, days) : [];
  const actual = past.filter((point): point is { date: string; price: number } => point.price !== null);
  // Only legacy fixtures lack forecastPoints. Live summaries explicitly contain [].
  const forecast = item.forecastPoints ?? (item.forecastDate ? [{ date: item.forecastDate, price: item.forecastPrice }] : []);
  const values = [...actual.map(point => point.price), ...forecast.flatMap(point => point.price === null ? [] : [point.price]),
    ...(item.currentPrice === null ? [] : [item.currentPrice])];
  const low = values.length ? Math.min(...values) : 0, high = values.length ? Math.max(...values) : 100;
  const padding = (high - low || 100) * .25;
  const min = low - padding, max = high + padding;
  const referenceTime = reference ? dateNumber(reference) : 0;
  const start = referenceTime - (days - 1) * 86_400_000;
  const end = Math.max(referenceTime, ...forecast.map(point => dateNumber(point.date)));
  const x = (date: string) => bounds.left + (dateNumber(date) - start) / Math.max(1, end - start) * (bounds.right - bounds.left);
  const y = (price: number) => bounds.bottom - (price - min) / (max - min) * (bounds.bottom - bounds.top);
  const currentDate = item.priceDate ?? item.baseDate ?? reference;
  const currentX = currentDate ? x(currentDate) : bounds.left;
  const forecastX = item.forecastDate ? x(item.forecastDate) : bounds.right;
  function path(points: PricePoint[]) {
    let connected = false;
    return points.map(point => {
      if (point.price === null) { connected = false; return ""; }
      const command = `${connected ? "L" : "M"}${x(point.date).toFixed(2)},${y(point.price).toFixed(2)}`;
      connected = true; return command;
    }).join(" ");
  }
  const anchor = currentDate && dateNumber(currentDate) >= start && item.currentPrice !== null && forecast.length && currentDate < forecast[0].date
    ? [{ date: currentDate, price: item.currentPrice }] : [];
  return { past, actual, forecast, min, max, x, y, currentX, forecastX,
    actualPath: path(past), forecastPath: path([...anchor, ...forecast]) };
}
