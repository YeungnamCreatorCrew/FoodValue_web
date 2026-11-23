// FoodValue_was app/schemas/price.py + common.py (camelCase responses).
export type PriceCategoryDto = "VEGETABLE" | "GRAIN" | "FRUIT" | "MEAT" | "SEAFOOD" | "ETC";
export type PriceMarketDto = "RETAIL" | "WHOLESALE";
export type PriceSortDto = "name" | "change" | "forecast";
export interface PriceSummaryDto {
  id: number;
  name: string;
  /** WAS PR #61부터 제공(검색용 별칭). 이전 응답에는 없을 수 있다. */
  aliases?: string[];
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
  /** 모델 채택을 정한 최종 평가(과거 검증) 구간. 없을 수 있다. */
  evaluationStart?: string | null;
  evaluationEnd?: string | null;
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

/**
 * DRAFT contract (팀 합의 전): GET /prices/items/{id}/indicators?market=RETAIL.
 * key / state / verdict / chart.type stay strings so unknown values reach the mapper and are skipped there.
 * Rates are fractions (-0.149 = -14.9%).
 */
export interface IndicatorSignalDto { key: string; label: string; state: string | null; stateLabel: string | null }
export interface SeasonalOverlayChartDto {
  type: "SEASONAL_OVERLAY";
  currentYear: number;
  years: { year: number; points: { week: number; price: number | null }[] }[];
}
export interface IndexedLinesChartDto {
  type: "INDEXED_LINES";
  baseDate: string;
  points: { date: string; wholesale: number | null; retail: number | null }[];
}
export interface IndicatorCardDto {
  key: string;
  verdict: string;
  state: string | null;
  available?: boolean | null;
  fact: Record<string, unknown> | null;
  evidence?: Record<string, unknown> | null;
  chart?: ({ type: string } & Record<string, unknown>) | null;
}
/** 카드를 만들지 않은 이유(예: 작형 전환 직후). text는 서버가 쓴 사용자용 문장. */
export interface IndicatorNoticeDto { key: string; reason: string; text: string }
export interface PriceIndicatorsDto {
  itemId: number;
  market: PriceMarketDto;
  /** READY | STALE | NO_DATA | INSUFFICIENT_HISTORY (mock에는 없음) */
  status?: string;
  specVersion?: string | null;
  asOfDate: string | null;
  unavailableReason: string | null;
  summary: { headline: string; signals: IndicatorSignalDto[] } | null;
  cards: IndicatorCardDto[];
  notices?: IndicatorNoticeDto[];
}
