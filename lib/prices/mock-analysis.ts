// SHAP stays on the existing fixtures, independent of live price DTOs.
import { priceCatalog } from "./catalog";
import { sameIngredientName } from "./identity";

export function getMockPriceAnalysis(name: string) {
  return priceCatalog.find(item => sameIngredientName(name, item)) ?? null;
}
