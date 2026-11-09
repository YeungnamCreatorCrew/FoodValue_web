import { findPrice } from "@/lib/prices/catalog";
import { factorSummary } from "@/lib/prices/poc-data";
import type { PriceRecord } from "@/lib/prices/poc-types";

export type InsightFactor = {
  title: string;
  direction: "up" | "down" | "neutral";
  description: string;
};
export type IngredientInsight = { ingredientId: string; factors: InsightFactor[] };
export type IngredientHomeData = { item: PriceRecord; insight: IngredientInsight };

// Existing catalog IDs remain canonical; accept common persisted slug aliases too.
const slugIds: Record<string, string> = { onion: "2", rice: "5", tomato: "13" };

export function canonicalIngredientId(id: string) {
  return slugIds[id] ?? (id === "1" ? "green-onion" : id);
}

/** Replace this async adapter with the backend integration once its contract exists. */
export async function getIngredientHomeData(id: string): Promise<IngredientHomeData | null> {
  const item = findPrice(canonicalIngredientId(id));
  if (!item) return null;
  return {
    item,
    insight: {
      ingredientId: item.id,
      factors: factorSummary(item).map(group => {
        const direction = group.total === 0 ? "neutral" : group.direction;
        return {
          title: group.label, direction,
          description: direction === "neutral"
            ? `${group.label}의 SHAP 기여 합계는 중립입니다.`
            : `${group.label}은 이번 모델 예측에서 가격을 ${direction === "down" ? "낮추는" : "높이는"} 방향으로 작용했습니다.`,
        };
      }),
    },
  };
}
