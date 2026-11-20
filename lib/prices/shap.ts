// WAS GET /prices/items/{id}/factors → view model. SHAP is a contribution to the model's 7-day forecast, not a cause.
import type { FactorHistoryDto, PriceFactorsDto, PriceSummaryTextDto } from "./dto";

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
  return value === "neutral" ? `${label}의 SHAP 기여 합계는 중립입니다.`
    : `${label}은(는) 이번 모델 예측에서 가격을 ${value === "down" ? "낮추는" : "높이는"} 방향으로 작용했습니다.`;
}

export function mapShapAnalysis(dto: PriceFactorsDto): ShapAnalysis {
  const summary = mapAiSummary(dto.summary);
  return {
    explained: dto.explained && dto.factors.length > 0, unavailableReason: dto.unavailableReason,
    baseDate: dto.baseDate, targetDate: dto.targetDate, basePrice: dto.basePrice, predictedPrice: dto.predictedPrice, summary,
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
  if (reason === "BASELINE_MODEL") return "이번 예측은 학습 모델이 기준 모델(직전 가격 유지)을 이기지 못해 기준 모델로 만들어졌습니다. 그래서 변수별 영향은 제공되지 않습니다.";
  if (reason === "NO_FORECAST") return "아직 이 품목의 AI 예측이 없어 변수별 영향을 표시할 수 없습니다.";
  return "이번 예측의 변수별 영향 정보가 없습니다.";
}
