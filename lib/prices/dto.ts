// FoodValue_was app/schemas/price.py + common.py (camelCase responses).
export type PriceCategoryDto = "VEGETABLE" | "GRAIN" | "FRUIT" | "MEAT" | "SEAFOOD" | "ETC";
export type PriceMarketDto = "RETAIL" | "WHOLESALE";
export type PriceSortDto = "name" | "change" | "forecast";
export interface PriceSummaryDto {
  id: number;
  name: string;
  category: PriceCategoryDto;
  market: PriceMarketDto;
  seriesId: number;
  unitLabel: string | null;
  source: string;
  priceDate: string | null;
  currentPrice: number | null;
  weeklyChangePercent: number | null;
  forecastPrice: number | null;
  forecastChangePercent: number | null;
  forecastBaseDate: string | null;
  forecastTargetDate: string | null;
  quality: string | null;
  status: string;
}
export interface PricePageDto { items: PriceSummaryDto[]; page: number; size: number; total: number }
export interface PriceHistoryDto {
  itemId: number;
  market: PriceMarketDto;
  region: string;
  days: number;
  startDate: string;
  endDate: string;
  points: { date: string; price: number | null }[];
}
export interface PriceForecastDto {
  itemId: number;
  market: PriceMarketDto;
  seriesId: number;
  status: string;
  baseDate: string | null;
  dataDate: string | null;
  modelRunId: number | null;
  modelName: string | null;
  modelVersion: string | null;
  quality: string | null;
  points: { targetDate: string; predictedPrice: number; lowerPrice: number | null; upperPrice: number | null }[];
  metrics: Record<string, unknown> | null;
  latestAttemptStatus: string | null;
  updatedAt: string | null;
}
export interface PriceGuideDto {
  recommendation: string;
  buyAfterDays: number | null;
  expectedSaving: number | null;
  mape: number | null;
  factors: Record<string, unknown>[];
}
export interface PriceDetailDto {
  item: PriceSummaryDto;
  forecast: PriceForecastDto;
  guide: PriceGuideDto | null;
  fridge: { ingredientCount: number; quantities: Record<string, string> } | null;
}
