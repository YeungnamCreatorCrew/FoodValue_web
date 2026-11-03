import type { Category, DailyPrice } from "./types";

export type PriceDirection = "up" | "down" | "flat";
export type FactorKey = "temp_ma7" | "humidity_ma7" | "price_ma3" | "price_std7" | "price_lag7" | "price_now";
export type FactorHistoryPoint = { date: string } & Record<FactorKey, number>;
export interface AnalysisFactor {
  id: string;
  category: "weather" | "price";
  label: string;
  value: number;
  unit?: string;
  shapValue: number;
  direction: "up" | "down";
  historyKey?: FactorKey;
}
export interface PriceRecord {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  categoryCode: Category;
  unit: string;
  image: string | null;
  isPoc: boolean;
  isDemo: boolean;
  baseDate: string;
  currentPrice: number;
  forecastDate: string;
  forecastPrice: number;
  forecastDelta: number;
  forecastPercent: number;
  forecastDirection: PriceDirection;
  factors: AnalysisFactor[];
  priceHistory: DailyPrice[];
  factorHistory: FactorHistoryPoint[];
}
export function forecastMetrics(currentPrice: number, forecastPrice: number) {
  const forecastDelta = forecastPrice - currentPrice;
  return {
    forecastDelta,
    forecastPercent: Number((forecastDelta / currentPrice * 100).toFixed(1)),
    forecastDirection: (forecastDelta < 0 ? "down" : forecastDelta > 0 ? "up" : "flat") as PriceDirection,
  };
}
