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
