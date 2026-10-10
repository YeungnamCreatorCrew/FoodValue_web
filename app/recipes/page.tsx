import type { Metadata } from "next";
import { RecipeHomeScreen } from "@/components/recipes/RecipeHomeScreen";

export const metadata: Metadata = {
  title: "레시피 | FoodValue",
};

export default function RecipesPage() {
  return <RecipeHomeScreen />;
}
