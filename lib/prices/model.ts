import type { Category, Period, PriceSort } from "./types";
import type { DataFactor } from "./factors";

export interface PricePoint { date: string; price: number | null }
export interface ForecastPoint extends PricePoint { lower: number | null; upper: number | null }
export interface PriceChartData {
  baseDate: string | null;
  priceDate?: string | null;
  currentPrice: number | null;
  forecastDate: string | null;
  forecastPrice: number | null;
  priceHistory: PricePoint[];
  historyEndDate?: string | null;
  forecastPoints?: ForecastPoint[];
}
export interface BuyingGuide {
  title: string;
  description: string;
  buyAfterDays: number | null;
  expectedSaving: number | null;
  mape: number | null;
}
export interface LivePrice extends PriceChartData {
  forecastPoints: ForecastPoint[];
  id: string;
  name: string;
  category: string;
  categoryCode: Category;
  unit: string;
  image: string | null;
  source: string;
  status: string;
  quality: string | null;
  weeklyChangeRate: number | null;
  forecastDelta: number | null;
  forecastPercent: number | null;
  forecastDirection: "up" | "down" | "flat" | null;
  guide: BuyingGuide | null;
  /** Detail only: forecast.status from WAS (null on list summaries). */
  forecastStatus: string | null;
  /** Detail only: guide.factors observations/model info. Not SHAP. */
  dataFactors: DataFactor[];
}
export interface PriceListQuery {
  category?: Category | "ALL";
  keyword?: string;
  sort?: PriceSort;
  page?: number;
  size?: number;
}
export interface PriceListPage { items: LivePrice[]; page: number; size: number; total: number }
export interface PriceChartResult { priceHistory: PricePoint[]; historyEndDate: string; forecast: ForecastPoint[]; forecastBaseDate: string | null }
export type HistoryPeriod = Period;
