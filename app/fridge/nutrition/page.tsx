import type { Metadata } from "next";
import { NutritionScreen } from "@/components/fridge/nutrition/NutritionScreen";

export const metadata: Metadata = {
  title: "영양 분석 | FoodValue",
};

export default function FridgeNutritionPage() {
  return <NutritionScreen />;
}
