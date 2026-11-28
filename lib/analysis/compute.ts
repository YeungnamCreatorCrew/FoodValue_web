/**
 * 분석실 계산. 모두 브라우저·서버에서 지금 API 응답만으로 다시 계산한다(WAS 수정 없음).
 * 기준 숫자는 WAS app/core/constants.py와 같다. 바뀌면 여기도 같이 바꾼다.
 */
import type { IndicatorState } from "@/lib/prices/model";
import type { ShapAnalysis, ShapFactor } from "@/lib/prices/shap";

export const SEASONAL_BAND = 0.10; // 평년 대비 ±10% 밖이면 싼 편·비싼 편
export const POSITION_LOW = 0.25; // 1년 분포 하위 25% 이하면 낮은 쪽
export const POSITION_HIGH = 0.75; // 상위 25% 이상이면 높은 쪽

export function seasonalState(diff: number): IndicatorState {
  if (diff <= -SEASONAL_BAND) return "down";
  if (diff >= SEASONAL_BAND) return "up";
  return "neutral";
}
export function positionState(percentile: number): IndicatorState {
  if (percentile <= POSITION_LOW) return "down";
  if (percentile >= POSITION_HIGH) return "up";
  return "neutral";
}

// ---- 영수증형 예측 분해: 기준값 + 요인 기여 = 예측가 (WAS v2_ensemble.explain과 같은 덧셈) ----
export interface ReceiptGroup { category: string; label: string; total: number; lines: { id: string; label: string; contribution: number; factor: ShapFactor | null }[] }
export function receipt(analysis: ShapAnalysis, topPerGroup = 4) {
  const groups = new Map<string, ShapFactor[]>();
  for (const factor of analysis.factors) groups.set(factor.category, [...(groups.get(factor.category) ?? []), factor]);
  const labels = new Map(analysis.categories.map(c => [c.category, c.label]));
  const result: ReceiptGroup[] = [...groups].map(([category, factors]) => {
    const sorted = factors.toSorted((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
    // 나머지가 1개뿐이면 '그 밖의 1개'로 묶지 않고 그대로 보여준다.
    const cut = sorted.length - topPerGroup <= 1 ? sorted.length : topPerGroup;
    const shown = sorted.slice(0, cut), rest = sorted.slice(cut);
    const lines: ReceiptGroup["lines"] = shown.map(f => ({ id: f.id, label: f.label, contribution: f.contribution, factor: f }));
    if (rest.length) lines.push({ id: `${category}-rest`, label: `그 밖의 ${rest.length}개`, contribution: rest.reduce((s, f) => s + f.contribution, 0), factor: null });
    return { category, label: labels.get(category) ?? factors[0].categoryLabel, total: factors.reduce((s, f) => s + f.contribution, 0), lines };
  }).toSorted((a, b) => Math.abs(b.total) - Math.abs(a.total));
  const sum = analysis.factors.reduce((s, f) => s + f.contribution, 0);
  const computed = analysis.basePrice === null ? null : analysis.basePrice + sum;
  // 서버 예측가는 반올림한 값이라 1원 안팎 차이는 반올림 차이로 보여준다.
  const rounding = computed !== null && analysis.predictedPrice !== null ? analysis.predictedPrice - computed : null;
  return { groups: result, sum, computed, rounding, count: analysis.factors.length };
}
