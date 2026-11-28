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
  /** 서버 원값(BUY_NOW 등). 화면에 판정 문구로 바꿔 보여주지 않는다. */
  recommendation: string;
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
  /** List only: 지표 칩과 1년 가격대(서버 스냅샷). 없으면 null. */
  listIndicators: ListIndicators | null;
  /** Detail only: 7일 뒤 값이 직전 가격(BASELINE)일 때 그렇게 정한 근거(forecast.metrics). 아니면 null. */
  forecastBasis: ForecastBasis | null;
}

/** 후보 모델 하나의 과거 성적. mape = 평균 오차율(%). */
export interface BasisRow { model: string; label: string; ai: boolean; mape: number | null; mae: number | null }
/**
 * 직전 가격으로 정한 근거. WAS 응답 모양이 둘이다:
 * - 후보 비교(v5): 고르는 구간(selection)에서 후보별 오차를 비교해 가장 작은 것을 쓴다. recent = 그 뒤 따로 떼어 둔 검증 구간.
 * - 검증 판정(v2): AI 모델이 검증을 통과하지 못하면 직전 가격. 직전 가격 오차와 AI가 계산했던 값만 온다.
 */
export interface ForecastBasis {
  kind: "compare" | "verdict";
  rows: BasisRow[];
  samples: number | null;
  recent: { start: string | null; end: string | null; rows: BasisRow[] } | null;
  naiveMape: number | null;
  aiPrice: number | null;
}
export interface ListIndicators { asOfDate: string; stale: boolean; headline: string | null; signals: IndicatorSignal[]; yearRange: { low: number | null; high: number | null; percentile: number | null } | null }
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
/** Price history windows for the 가격 흐름 chart. WAS /history accepts 14·30·90·180·365 (180·365 added on feature/service-view). */
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
  fact: { currentPrice: number | null; windowDays: number | null; recentAvg: number | null; normalAvg: number | null; normalYears: number[];
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
export interface LevelEvidence {
  lowAfterRate: number | null; lowBaseRate: number | null; sampleLow: number | null;
  highAfterRate: number | null; highBaseRate: number | null; sampleHigh: number | null;
  aheadWeeks: number | null; weakSide: "low" | "high" | null; periodStart: string | null; periodEnd: string | null;
}
/** 가격 이력만으로 만든 사실 카드. 예측 모델·외부변수와 무관하고 percentile은 0~1(그 값보다 낮았던 날의 비율). */
export interface PricePositionCard extends IndicatorCardBase {
  key: "PRICE_POSITION";
  fact: { currentPrice: number | null; low: number | null; lowDate: string | null; high: number | null; highDate: string | null; avg: number | null;
    diffFromAvg: number | null; percentile: number | null; windowDays: number | null };
  evidenceText: string | null;
  /** 과거 기록 검증(있을 때). lowAfterRate: 하위 25%였던 주 이후 소매가 오른 비율, highAfterRate: 상위 25% 이후 내린 비율. */
  evidence: LevelEvidence | null;
}
export interface RetailWholesaleGapCard extends IndicatorCardBase {
  key: "RETAIL_WHOLESALE_GAP";
  fact: { retailPrice: number | null; wholesalePrice: number | null; ratio: number | null; normalRatio: number | null; low: number | null; high: number | null;
    percentile: number | null; windowDays: number | null };
  evidenceText: string | null;
  evidence: (LevelEvidence & { overlapsLead: boolean; corrWithWholesaleChange: number | null; passed: boolean }) | null;
}
export interface VolatilityCard extends IndicatorCardBase {
  key: "VOLATILITY";
  fact: { windowDays: number | null; recentRange: number | null; normalRange: number | null; percentile: number | null };
  evidenceText: string | null;
}
export type IndicatorCard = SeasonalCard | WholesaleLeadCard | HarvestWeatherCard | ArrivalsCard | PricePositionCard | RetailWholesaleGapCard | VolatilityCard;
export interface IndicatorNotice { key: string; text: string }
export interface PriceIndicators {
  asOfDate: string | null;
  /** 서버 status가 STALE이면 지표 기준일이 오래됐다(카드는 그 기준일 값). */
  stale: boolean;
  unavailableReason: string | null;
  headline: string | null;
  signals: IndicatorSignal[];
  cards: IndicatorCard[];
  /** 카드를 만들지 않은 이유(작형 전환 직후 등). 서버가 쓴 문장을 그대로 보여준다. */
  notices: IndicatorNotice[];
}
