// WAS GET /prices/items/{id}/factors → view model. SHAP is a contribution to the model's 7-day forecast, not a cause.
import type { FactorHistoryDto, PriceFactorsDto, PriceSummaryTextDto, ValidationDto } from "./dto";

export type ShapDirection = "up" | "down" | "neutral";
export interface AiSummary { headline: string; detail: string; categories: Record<string, string>; generator: string | null }
export interface ShapFactor {
  id: string;
  label: string;
  category: string;
  categoryLabel: string;
  value: number | null;
  unit: string;
  previousValue: number | null;
  previousDate: string | null;
  contribution: number;
  direction: ShapDirection;
  hasHistory: boolean;
}
export interface ShapCategory { category: string; label: string; contribution: number; direction: ShapDirection; description: string }
export interface ShapAnalysis {
  explained: boolean;
  /** Why factors are missing when explained=false (BASELINE_MODEL / NO_FORECAST / NOT_EXPLAINED). */
  unavailableReason: string | null;
  baseDate: string | null;
  /** 과거 검증(최종 평가) 구간. 기준 모델 안내 문구에 쓴다. */
  evaluationStart: string | null;
  evaluationEnd: string | null;
  /** 과거 검증 실적(v2만). 없으면 null. */
  validation: ValidationDto | null;
  targetDate: string | null;
  basePrice: number | null;
  predictedPrice: number | null;
  summary: AiSummary | null;
  categories: ShapCategory[];
  factors: ShapFactor[];
}
export interface FactorTrend { label: string; unit: string; baseDate: string; points: { date: string; value: number }[] }

/** Short filter labels; the server's category label is used for headings. */
export const categoryLabels: Record<string, string> = { PRICE: "가격", WEATHER: "날씨", CALENDAR: "달력·계절", MACRO: "생산량·환율" };
const direction = (value: string): ShapDirection => value === "UP" ? "up" : value === "DOWN" ? "down" : "neutral";

export function mapAiSummary(dto: PriceSummaryTextDto | null | undefined): AiSummary | null {
  if (!dto?.headline) return null;
  return { headline: dto.headline, detail: dto.detail ?? "", categories: dto.categories ?? {}, generator: dto.generator ?? null };
}

function categoryText(label: string, value: ShapDirection) {
  return value === "neutral" ? `${label}의 영향 합은 중립이에요.`
    : `${label}은(는) 예측을 ${value === "down" ? "낮추는" : "높이는"} 쪽으로 작용했어요.`;
}

export function mapShapAnalysis(dto: PriceFactorsDto): ShapAnalysis {
  const summary = mapAiSummary(dto.summary);
  return {
    explained: dto.explained && dto.factors.length > 0, unavailableReason: dto.unavailableReason,
    baseDate: dto.baseDate, evaluationStart: dto.evaluationStart ?? null, evaluationEnd: dto.evaluationEnd ?? null, validation: dto.validation ?? null, targetDate: dto.targetDate, basePrice: dto.basePrice, predictedPrice: dto.predictedPrice, summary,
    categories: dto.categories.map(row => ({ category: row.category, label: row.label, contribution: row.contribution,
      direction: direction(row.direction), description: row.description ?? summary?.categories[row.category] ?? categoryText(row.label, direction(row.direction)) })),
    factors: dto.factors.map(row => ({ ...row, categoryLabel: categoryLabels[row.category] ?? row.category, direction: direction(row.direction) })),
  };
}

export function mapFactorTrend(dto: FactorHistoryDto): FactorTrend {
  // Missing feature values stay missing; they are dropped from the line instead of being filled.
  return { label: dto.label, unit: dto.unit, baseDate: dto.baseDate,
    points: dto.points.flatMap(point => point.value === null || !Number.isFinite(point.value) ? [] : [{ date: point.date, value: point.value }]) };
}

export function unavailableText(reason: string | null) {
  if (reason === "BASELINE_MODEL") return "이번 7일 값은 직전 가격을 그대로 둔 값이라 요인별 영향이 없어요.";
  if (reason === "NO_FORECAST") return "이 품목은 AI 예측이 없어 요인별 영향도 없어요.";
  return "이번 예측의 요인별 영향 정보가 없어요.";
}
