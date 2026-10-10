import type { PriceItem } from "./types";
export const won = (price: number) => `${price.toLocaleString("ko-KR")}원`;
export const changeRate = (current: number, previous: number) => previous > 0 ? (current - previous) / previous * 100 : 0;
export const forecastRate = (item: PriceItem) => changeRate(item.forecast.at(-1)?.price ?? item.currentPrice, item.currentPrice);
export const recommendationLabel = (item: PriceItem) => ({
  BUY_NOW: "지금 구매 추천",
  BUY_LATER: `${item.buyAfterDays ?? 0}일 뒤 구매 추천`,
  HOLD: "구매 보류",
  STABLE: "가격 보합세",
})[item.recommendation];
