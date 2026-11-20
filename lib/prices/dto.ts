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
/** Server-stored sentences. headline is always a fixed template; detail/categories may be Gemini-edited (generator). */
export interface PriceSummaryTextDto {
  headline: string;
  detail: string;
  categories: Record<string, string>;
  generator: string | null;
}
export interface PriceDetailDto {
  item: PriceSummaryDto;
  forecast: PriceForecastDto;
  guide: PriceGuideDto | null;
  summary?: PriceSummaryTextDto | null;
  fridge: { ingredientCount: number; quantities: Record<string, string> } | null;
}
export type FactorDirectionDto = "UP" | "DOWN" | "NEUTRAL";
/** GET /prices/items/{id}/factors — TreeSHAP contributions (won) of the published 7-day forecast. */
export interface PriceFactorDto {
  id: string;
  label: string;
  category: string;
  value: number | null;
  unit: string;
  previousValue: number | null;
  previousDate: string | null;
  contribution: number;
  direction: FactorDirectionDto;
  hasHistory: boolean;
}
export interface FactorCategoryDto {
  category: string;
  label: string;
  contribution: number;
  direction: FactorDirectionDto;
  description: string | null;
}
export interface PriceFactorsDto {
  itemId: number;
  market: PriceMarketDto;
  baseDate: string | null;
  status: string;
  explained: boolean;
  unavailableReason: string | null;
  modelName: string | null;
  method: string | null;
  horizonDays: number | null;
  targetDate: string | null;
  currentPrice: number | null;
  basePrice: number | null;
  predictedPrice: number | null;
  summary: PriceSummaryTextDto | null;
  categories: FactorCategoryDto[];
  factors: PriceFactorDto[];
}
export interface FactorHistoryDto {
  itemId: number;
  market: PriceMarketDto;
  factorId: string;
  label: string;
  unit: string;
  baseDate: string;
  days: number;
  points: { date: string; value: number | null }[];
}
