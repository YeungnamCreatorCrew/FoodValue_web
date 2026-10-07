import type { Metadata } from "next";
import { RecipeSelectScreen } from "@/components/recipes/select/RecipeSelectScreen";

export const metadata: Metadata = {
  title: "재료 선택 | FoodValue",
};

export default async function RecipeSelectPage({ searchParams }: PageProps<"/recipes/select">) {
  // 냉장고 재료 카드의 [레시피]에서 오면 /recipes/select?item=12 (그 재료를 미리 체크),
  // 영양 분석 화면에서 오면 /recipes/select?nutrition=1 ("부족 영양소 보충" 조건을 미리 켬)
  const { item, nutrition } = await searchParams;
  const preselectedIds =
    typeof item === "string" && /^\d+(,\d+)*$/.test(item) ? item.split(",").map(Number) : [];
  return <RecipeSelectScreen preselectedIds={preselectedIds} initialNutrition={nutrition === "1"} />;
}
