import type { DailyPrice } from "./types";

// Reuses the previous home chart's illustrative curve. These are NOT observations,
// daily model outputs, confidence intervals, or factor time series.
export function makeDemoTrend(baseDate: string, currentPrice: number, forecastDate: string, forecastPrice: number): { history: DailyPrice[]; forecast: DailyPrice[] } {
  const dateAt = (offset: number) => {
    const date = new Date(`${baseDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  };
  return {
    history: Array.from({ length: 181 }, (_, i) => {
      const offset = i - 180;
      return { date: dateAt(offset), price: offset === 0 ? currentPrice : Math.round((currentPrice + Math.sin(offset / 6) * 110 + Math.sin(offset / 19) * 180 - offset * 1.5) / 10) * 10 };
    }),
    forecast: Array.from({ length: 7 }, (_, i) => ({
      date: i === 6 ? forecastDate : dateAt(i + 1),
      price: i === 6 ? forecastPrice : Math.round(currentPrice + (forecastPrice - currentPrice) * (i + 1) / 7),
    })),
  };
}
