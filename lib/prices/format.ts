import type { PriceItem } from "./types";
// No host locale/time zone dependencies: SSR and the first client render agree.
export function formatNumber(value: number, decimals = 0) {
  const [integer, fraction] = value.toFixed(decimals).split(".");
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction === undefined ? "" : `.${fraction}`);
}
export const formatWon = (price: number | null | undefined) => price == null ? "-" : `${formatNumber(price)}원`;
export const won = formatWon;
export const formatPercent = (value: number | null) => value === null ? "-" : `${value > 0 ? "+" : ""}${formatNumber(value, 1)}%`;
/** 연도가 필요한 날짜: "2025-11-13" → "2025년 11월 13일". 기준일(요일 포함)은 longDate, 차트 축은 shortDate. */
export const formatDate = (date: string | null) => {
  if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return "-";
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
};
/** 기간 표기: "2018-01-05" → "2018년 1월". */
export const yearMonth = (date: string | null) => date && /^\d{4}-\d{2}/.test(date) ? `${Number(date.slice(0, 4))}년 ${Number(date.slice(5, 7))}월` : "-";
export const formatFactorValue = (value: number, unit = "") => `${formatNumber(value, Number.isInteger(value) ? 0 : 2)}${unit}`;
export const changeRate = (current: number, previous: number) => previous > 0 ? (current - previous) / previous * 100 : 0;
export const forecastRate = (item: PriceItem) => changeRate(item.forecast.at(-1)?.price ?? item.currentPrice, item.currentPrice);
/** 화면의 짧은 날짜: "2026-11-20" → "11.20". 연도는 가격 기준일에만 붙인다(formatDate). */
export const shortDate = (date: string | null) => date ? `${date.slice(5, 7)}.${date.slice(8, 10)}` : "-";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
/** 기준일 표기: "2026-10-30" → "2026년 10월 30일(금)". 요일은 UTC로 계산해 서버·브라우저가 같다. */
export function longDate(date: string | null | undefined) {
  if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return null;
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return `${y}년 ${m}월 ${d}일(${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]})`;
}
