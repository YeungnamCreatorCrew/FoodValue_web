import type { IngredientHomeData } from "@/lib/home/ingredient-data";
import { ShapInsight } from "@/components/prices/shap-factors";

export function IngredientInsight({ data }: { data: IngredientHomeData }) {
  return <ShapInsight item={data.item} />;
}
