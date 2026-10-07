// 영양 분석 화면용 계산·표시 도구 (백엔드 GET /fridge/nutrition 응답을 화면에 맞게 바꾼다)
import type { NutrientKey, NutrientSummary, NutritionSummary } from "@/types/fridge";

export const NUTRIENT_LABEL: Record<NutrientKey, string> = {
  carbohydrate: "탄수화물",
  protein: "단백질",
  fat: "지방",
  sodium: "나트륨",
  sugars: "당류",
  cholesterol: "콜레스테롤",
};

// 탄수화물·단백질·지방은 "기준치만큼 채워야" 하는 성분, 나머지는 "기준치를 넘으면 안 되는" 성분이다.
const MINIMUM_KEYS: NutrientKey[] = ["carbohydrate", "protein", "fat"];

/**
 * 막대와 글자 색을 정하는 상태
 * - good: 충분하거나 기준 이하로 적정  - low: 부족  - over: 상한 초과  - unknown: 정보가 없어 판단 불가
 */
export type Tone = "good" | "low" | "over" | "unknown";

export interface NutrientView {
  key: NutrientKey;
  label: string;
  tone: Tone;
  statusLabel: string; // 충분 / 부족 / 적정 / 초과 / 판단 불가
  percent: number | null; // 기준치 대비 % (판단 불가면 null)
  barRatio: number; // 막대 길이 0~1
  amountText: string; // "210g / 324g"
  shortfallText: string | null; // 부족할 때 "114g"
  note: string | null; // 정보가 빠졌을 때의 안내
}

function amount(value: string, unit: string): string {
  return `${Number(value)}${unit}`;
}

export function toNutrientView(n: NutrientSummary): NutrientView {
  const isMinimum = MINIMUM_KEYS.includes(n.key);
  const total = Number(n.total);
  const reference = Number(n.dailyReference);
  const percent = reference > 0 ? Math.floor((total / reference) * 100 + 1e-9) : 0;

  let tone: Tone;
  let statusLabel: string;
  if (n.status === "INCOMPLETE") {
    tone = "unknown";
    statusLabel = "판단 불가";
  } else if (isMinimum) {
    tone = n.status === "LOW" ? "low" : "good";
    statusLabel = n.status === "LOW" ? "부족" : "충분";
  } else {
    tone = n.status === "EXCESS" ? "over" : "good";
    statusLabel = n.status === "EXCESS" ? "초과" : "적정";
  }

  let note: string | null = null;
  if (!n.complete) {
    const count = n.missingIngredientIds.length;
    note =
      n.status === "INCOMPLETE"
        ? `영양 정보가 없는 재료 ${count}개 때문에 판단할 수 없어요`
        : `영양 정보가 없는 재료 ${count}개는 빠졌어요`;
  }

  return {
    key: n.key,
    label: NUTRIENT_LABEL[n.key],
    tone,
    statusLabel,
    percent: tone === "unknown" ? null : percent,
    barRatio: tone === "unknown" ? 0 : Math.min(Math.max(total / reference, 0), 1),
    amountText: `${amount(n.total, n.unit)} / ${amount(n.dailyReference, n.unit)}`,
    shortfallText: n.status === "LOW" && n.shortfall !== null ? amount(n.shortfall, n.unit) : null,
    note,
  };
}

/** 냉장고에 재료가 없어서 모든 성분이 0인지 */
export function isNutritionEmpty(summary: NutritionSummary): boolean {
  return summary.nutrients.every((n) => Number(n.total) === 0);
}
