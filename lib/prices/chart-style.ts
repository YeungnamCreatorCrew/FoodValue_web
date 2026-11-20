import type { CSSProperties } from "react";
import type { PriceChartData } from "./model";

/** Presentation only: one direction color for both observed and forecast prices. */
export function priceChartStyle(item: Pick<PriceChartData, "currentPrice" | "forecastPrice">): CSSProperties {
  const direction = item.forecastPrice === null || item.currentPrice === null ? "flat" : item.forecastPrice > item.currentPrice ? "up"
    : item.forecastPrice < item.currentPrice ? "down" : "flat";
  return { "--price-chart-color": `var(--color-price-${direction})` } as CSSProperties;
}
