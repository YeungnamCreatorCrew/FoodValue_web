import { getPrice, resolveFavoriteId } from "@/lib/prices/service";
import { PriceApiError } from "@/lib/prices/api";
import type { LivePrice } from "@/lib/prices/model";
export { canonicalIngredientId } from "@/lib/prices/identity";

// The detail response already carries guide.factors (WAS observations/model info), so no extra request is made.
export type IngredientHomeData = { item: LivePrice };

export async function getIngredientHomeData(id: string, signal?: AbortSignal): Promise<IngredientHomeData | null> {
  const backendId = await resolveFavoriteId(id, signal);
  if (!backendId) return null;
  try { return { item: await getPrice(backendId, signal) }; }
  catch (error) {
    if (error instanceof PriceApiError && error.status === 404) return null;
    throw error;
  }
}
