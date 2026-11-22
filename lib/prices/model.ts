import type { Category, Period, PriceSort } from "./types";
import type { DataFactor } from "./factors";
import type { AiSummary } from "./shap";

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
  /** Detail only: server-stored forecast sentences (headline template + optional Gemini-edited detail). */
  aiSummary: AiSummary | null;
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
/** Price history windows for the 가격 흐름 chart. WAS /history accepts 14·30·90·180·365 (180·365 added on feature/history-long-periods). */
export type PriceHistoryPeriod = 14 | 30 | 90 | 180 | 365;
export const PRICE_CHART_PERIODS: { days: PriceHistoryPeriod; label: string }[] = [
  { days: 90, label: "90일" }, { days: 180, label: "180일" }, { days: 365, label: "1년" },
];

/** Judgement-aid indicators (draft contract). state/verdict come from the server and are never recomputed from prices. */
export type IndicatorState = "up" | "neutral" | "down";
export type IndicatorVerdict = "FACT" | "PASS" | "CONDITIONAL" | "WEAK";
export interface IndicatorSignal { key: string; label: string; state: IndicatorState | null; stateLabel: string }
interface IndicatorCardBase { verdict: IndicatorVerdict; state: IndicatorState | null; stateLabel: string | null }
export interface SeasonalCard extends IndicatorCardBase {
  key: "SEASONAL";
  fact: { currentPrice: number | null; month: number | null; monthAvg: number | null; normalAvg: number | null; normalYears: number[];
    diffRate: number | null; cheaperThanCount: number | null; historyYears: number | null };
  evidenceText: string | null;
  chart: { currentYear: number; years: { year: number; points: { week: number; price: number }[] }[] } | null;
}
export interface WholesaleLeadCard extends IndicatorCardBase {
  key: "WHOLESALE_LEAD";
  fact: { wholesaleChange2w: number | null; retailChange2w: number | null };
  evidence: { upAfterRate: number | null; baseUpRate: number | null; downAfterRate: number | null; baseDownRate: number | null;
    threshold: number | null; sampleUp: number | null; sampleDown: number | null; periodStart: string | null; periodEnd: string | null } | null;
  chart: { baseDate: string; points: { date: string; wholesale: number | null; retail: number | null }[] } | null;
}
export interface HarvestWeatherCard extends IndicatorCardBase {
  key: "HARVEST_WEATHER";
  available: boolean;
  fact: { region: string | null; rain4w: number | null; normalRain4w: number | null };
  evidence: { threshold: number | null; upRateWhenHeavy: number | null; upRateOtherwise: number | null } | null;
}
export interface ArrivalsCard extends IndicatorCardBase {
  key: "ARRIVALS";
  fact: { market: string | null; avgTon4w: number | null; normalTon: number | null; diffRate: number | null };
}
export type IndicatorCard = SeasonalCard | WholesaleLeadCard | HarvestWeatherCard | ArrivalsCard;
export interface PriceIndicators {
  asOfDate: string | null;
  unavailableReason: string | null;
  headline: string | null;
  signals: IndicatorSignal[];
  cards: IndicatorCard[];
}
