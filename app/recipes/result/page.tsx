import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RecipeResultScreen } from "@/components/recipes/result/RecipeResultScreen";
import type { MaxMinutes, ServingsOption } from "@/types/recipes";

export const metadata: Metadata = {
  title: "추천 결과 | FoodValue",
};

export default async function RecipeResultPage({ searchParams }: PageProps<"/recipes/result">) {
  // /recipes/result?items=1,2,4&time=20&servings=2&nutrition=1 (재료 선택 화면에서 넘어온다)
  const { items, time, servings, nutrition } = await searchParams;
  const ids = typeof items === "string" && /^\d+(,\d+)*$/.test(items) ? items.split(",").map(Number) : [];
  if (ids.length === 0) redirect("/recipes/select"); // 재료 없이 들어오면 재료 선택으로 보낸다

  return (
    <RecipeResultScreen
      key={`${ids.join(",")}-${time}-${servings}-${nutrition}`}
      fridgeItemIds={ids}
      conditions={{
        maxMinutes: time === "20" || time === "40" ? (Number(time) as MaxMinutes) : undefined,
        servings: servings === "1" || servings === "2" ? (Number(servings) as ServingsOption) : undefined,
        fillLackingNutrients: nutrition === "1",
      }}
    />
  );
}
