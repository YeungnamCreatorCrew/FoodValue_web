import { priceCatalog } from "./catalog";
import type { LivePrice } from "./model";

// These are legacy *frontend* identities, never WAS IDs.
const legacySlugs: Record<string, string> = { onion: "2", rice: "5", tomato: "13", "1": "green-onion" };
export function canonicalIngredientId(id: string) { return legacySlugs[id] ?? id; }
export function legacyIngredient(id: string) {
  return priceCatalog.find(item => item.id === canonicalIngredientId(id));
}
export function sameIngredientName(name: string, legacy: { name: string; aliases: string[] }) {
  return [legacy.name, ...legacy.aliases].includes(name);
}
export function favoriteIdentity(item: Pick<LivePrice, "id" | "name">) {
  return { id: `was:${item.id}`, aliases: priceCatalog.filter(legacy => sameIngredientName(item.name, legacy)).map(item => item.id) };
}
/** 저장된 관심(고정) 목록에 이 품목이 있는지. 예전 프론트 slug로 저장된 항목도 별칭으로 맞춘다. */
export function isFavoriteItem(item: Pick<LivePrice, "id" | "name">, favorites: string[]) {
  const keys = new Set(favorites.map(canonicalIngredientId));
  const { id, aliases } = favoriteIdentity(item);
  return [canonicalIngredientId(id), ...aliases].some(key => keys.has(key));
}
