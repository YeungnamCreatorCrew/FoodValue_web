import type { IngredientHomeData } from "@/lib/home/ingredient-data";
import { DataFactorPanel } from "@/components/prices/data-factors";

export function IngredientInsight({ data }: { data: IngredientHomeData }) {
  return <DataFactorPanel item={data.item} variant="home" />;
}
