import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RecipeDetailScreen } from "@/components/recipes/detail/RecipeDetailScreen";

export const metadata: Metadata = {
  title: "레시피 상세 | FoodValue",
};

export default async function RecipeDetailPage({ searchParams }: PageProps<"/recipes/detail">) {
  // /recipes/detail?title=차돌박이 대파 된장찌개&servings=2 (추천 결과에서 메뉴를 고르면 온다)
  const { title, servings } = await searchParams;
  if (typeof title !== "string" || !title.trim()) redirect("/recipes"); // 메뉴 없이 들어오면 레시피 홈으로 보낸다
  const servingsNumber = typeof servings === "string" && /^\d+$/.test(servings) && Number(servings) > 0 ? Number(servings) : 1;

  return (
    <RecipeDetailScreen
      key={`${title}-${servingsNumber}`}
      source={{ kind: "generate", title: title.trim(), servings: servingsNumber }}
    />
  );
}
