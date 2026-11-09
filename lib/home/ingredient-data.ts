import { getPrice, resolveFavoriteId } from "@/lib/prices/service";
import { PriceApiError } from "@/lib/prices/api";
import { getMockPriceAnalysis } from "@/lib/prices/mock-analysis";
import { factorSummary } from "@/lib/prices/poc-data";
import type { LivePrice } from "@/lib/prices/model";
export { canonicalIngredientId } from "@/lib/prices/identity";

export type InsightFactor = {
  title: string;
  direction: "up" | "down" | "neutral";
  description: string;
};
export type IngredientInsight = { source: "mock"; ingredientId: string; factors: InsightFactor[] };
export type IngredientHomeData = { item: LivePrice; insight: IngredientInsight };

export async function getIngredientHomeData(id: string, signal?: AbortSignal): Promise<IngredientHomeData | null> {
  const backendId = await resolveFavoriteId(id, signal);
  if (!backendId) return null;
  let item: LivePrice;
  try { item = await getPrice(backendId, signal); }
  catch (error) {
    if (error instanceof PriceApiError && error.status === 404) return null;
    throw error;
  }
  const mock = getMockPriceAnalysis(item.name);
  return {
    item,
    insight: {
      source: "mock", ingredientId: item.id,
      factors: mock ? factorSummary(mock).map(group => {
        const direction = group.total === 0 ? "neutral" : group.direction;
        return { title: group.label, direction,
          description: direction === "neutral" ? group.label + "의 SHAP mock 기여 합계는 중립입니다."
            : group.label + "은 기존 mock 예측에서 가격을 " + (direction === "down" ? "낮추는" : "높이는") + " 방향으로 작용했습니다." };
      }) : [],
    },
  };
}
