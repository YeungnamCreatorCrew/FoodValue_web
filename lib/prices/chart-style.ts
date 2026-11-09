import type { CSSProperties } from "react";
import type { PriceRecord } from "./poc-types";

/** Presentation only: one direction color for both observed and forecast prices. */
export function priceChartStyle(item: Pick<PriceRecord, "currentPrice" | "forecastPrice">): CSSProperties {
  const direction = item.forecastPrice > item.currentPrice ? "up"
    : item.forecastPrice < item.currentPrice ? "down" : "flat";
  return { "--price-chart-color": `var(--color-price-${direction})` } as CSSProperties;
}
