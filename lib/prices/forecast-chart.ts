import { dateNumber, historyForPeriod } from "./history";
import type { PriceChartData } from "./model";

export type ChartPointKind = "actual" | "forecast";
/** One slot on the x-axis. Only days with a value get a slot (like a stock chart skipping weekends). */
export interface ChartPoint {
  date: string;
  price: number;
  kind: ChartPointKind;
  x: number;
  y: number;
  /** Previous slot (the last actual for the first forecast), for "vs previous" in tooltips. */
  previous: { date: string; price: number } | null;
}

/**
 * Trading-day axis: observed prices are placed in order with equal spacing and joined directly, so days without a KAMIS
 * survey (weekends, holidays, gaps) take no space and are never drawn or labeled. No price is created for those days.
 * Daily WAS forecasts follow the last observation, also one slot per day.
 */
export function forecastChart(item: PriceChartData, days: number, bounds: { left: number; right: number; top: number; bottom: number }) {
  const reference = item.historyEndDate ?? item.baseDate ?? item.priceDate ?? item.forecastDate;
  const past = reference ? historyForPeriod(item.priceHistory, reference, days) : [];
  const start = reference ? dateNumber(reference) - (days - 1) * 86_400_000 : 0;
  const observed = past.filter((point): point is { date: string; price: number } => point.price !== null);
  // Only legacy fixtures lack forecastPoints. Live summaries explicitly contain [].
  const forecastRaw = item.forecastPoints ?? (item.forecastDate ? [{ date: item.forecastDate, price: item.forecastPrice }] : []);
  const forecast = forecastRaw.flatMap(point => point.price === null ? [] : [{ date: point.date, price: point.price }]);
  // The current price is a real observation; include it when the history window did not.
  const currentDate = item.priceDate ?? item.baseDate ?? reference;
  const anchorNeeded = !!currentDate && item.currentPrice !== null && dateNumber(currentDate) >= start
    && !observed.some(point => point.date === currentDate) && (!forecast.length || currentDate < forecast[0].date);
  const actual = anchorNeeded
    ? [...observed, { date: currentDate!, price: item.currentPrice! }].toSorted((a, b) => a.date.localeCompare(b.date)) : observed;
  const lastActual = actual.at(-1) ?? null;
  const future = forecast.filter(point => !lastActual || point.date > lastActual.date);

  const values = [...actual.map(point => point.price), ...future.map(point => point.price)];
  const low = values.length ? Math.min(...values) : 0, high = values.length ? Math.max(...values) : 100;
  const padding = (high - low || 100) * .25;
  const min = low - padding, max = high + padding;
  const slots = actual.length + future.length;
  const xAt = (index: number) => slots <= 1 ? (bounds.left + bounds.right) / 2 : bounds.left + index / (slots - 1) * (bounds.right - bounds.left);
  const y = (price: number) => bounds.bottom - (price - min) / (max - min) * (bounds.bottom - bounds.top);

  const points: ChartPoint[] = [
    ...actual.map((point, index) => ({ ...point, kind: "actual" as const, x: xAt(index), y: y(point.price), previous: actual[index - 1] ?? null })),
    ...future.map((point, index) => ({ ...point, kind: "forecast" as const, x: xAt(actual.length + index), y: y(point.price),
      previous: index ? future[index - 1] : lastActual })),
  ];
  const slotOf = new Map(points.map(point => [point.date, point.x]));
  /** x of a date with a slot; a date without a value falls back to the next slot. */
  const x = (date: string) => slotOf.get(date) ?? points.find(point => point.date >= date)?.x ?? bounds.right;
  const line = (list: ChartPoint[]) => list.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const actualPoints = points.filter(point => point.kind === "actual");
  const forecastPoints = points.filter(point => point.kind === "forecast");
  // Nothing observed in the window → currentX < left, which hides the observation marker.
  const currentX = lastActual ? x(lastActual.date) : bounds.left - 1;
  const forecastX = item.forecastDate ? x(item.forecastDate) : bounds.right;
  return { past, actual, forecast: future, points, min, max, x, y, currentX, forecastX,
    actualPath: line(actualPoints),
    forecastPath: line(actualPoints.length && forecastPoints.length ? [actualPoints.at(-1)!, ...forecastPoints] : forecastPoints) };
}

/** Nearest slot to a pointer x (SVG units). */
export function nearestPoint<T extends { x: number }>(points: T[], pointerX: number): T | null {
  let best: T | null = null;
  for (const point of points) if (!best || Math.abs(point.x - pointerX) < Math.abs(best.x - pointerX)) best = point;
  return best;
}
