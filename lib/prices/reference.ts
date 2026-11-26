import type { PricePoint } from "./model";

/**
 * 상세 '기준 가격' 줄: 지난주 · 한 달 전 · 작년 이맘때 가격을 가격 이력(365일)에서 찾는다.
 * 그날 값이 없으면(주말·휴일) 앞뒤 7일 안에서 가장 가까운 날을 쓰고, 그래도 없으면 null.
 */
const DAY = 86_400_000;
const time = (date: string) => Date.parse(`${date.slice(0, 10)}T00:00:00Z`);

export function priceNear(history: PricePoint[], baseDate: string, daysBack: number) {
  const target = time(baseDate) - daysBack * DAY;
  let best: { date: string; price: number; gap: number } | null = null;
  for (const point of history) {
    if (point.price === null) continue;
    const gap = Math.abs(time(point.date) - target) / DAY;
    if (gap <= 7 && (!best || gap < best.gap || (gap === best.gap && point.date < best.date))) best = { date: point.date, price: point.price, gap };
  }
  return best ? { date: best.date, price: best.price } : null;
}

export const REFERENCES = [
  { key: "week", label: "지난주", daysBack: 7 },
  { key: "month", label: "한 달 전", daysBack: 30 },
  { key: "year", label: "작년 이맘때", daysBack: 364 },
] as const;
