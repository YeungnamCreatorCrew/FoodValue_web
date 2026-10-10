import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeDetailScreen } from "@/components/recipes/detail/RecipeDetailScreen";

export const metadata: Metadata = {
  title: "저장한 레시피 | FoodValue",
};

export default async function SavedRecipePage({ params }: PageProps<"/recipes/saved/[id]">) {
  const { id } = await params;
  // 주소가 /recipes/saved/abc 처럼 숫자가 아니면 404 화면을 보여 준다
  if (!/^\d+$/.test(id)) notFound();
  return <RecipeDetailScreen key={id} source={{ kind: "saved", id: Number(id) }} />;
}
