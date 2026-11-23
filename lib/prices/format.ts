import type { PriceItem } from "./types";
// No host locale/time zone dependencies: SSR and the first client render agree.
export function formatNumber(value: number, decimals = 0) {
  const [integer, fraction] = value.toFixed(decimals).split(".");
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction === undefined ? "" : `.${fraction}`);
}
export const formatWon = (price: number | null | undefined) => price == null ? "-" : `${formatNumber(price)}원`;
export const won = formatWon;
export const formatPercent = (value: number | null) => value === null ? "-" : `${value > 0 ? "+" : ""}${formatNumber(value, 1)}%`;
export const formatDate = (date: string | null) => date ? date.replaceAll("-", ".") : "-";
export const formatFactorValue = (value: number, unit = "") => `${formatNumber(value, Number.isInteger(value) ? 0 : 2)}${unit}`;
export const changeRate = (current: number, previous: number) => previous > 0 ? (current - previous) / previous * 100 : 0;
export const forecastRate = (item: PriceItem) => changeRate(item.forecast.at(-1)?.price ?? item.currentPrice, item.currentPrice);
