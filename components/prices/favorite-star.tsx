"use client";

import type { MouseEvent } from "react";
import { canonicalIngredientId } from "@/lib/prices/identity";
import { setFavoriteIngredients, useFavorites } from "@/lib/home/favorites";

export function FavoriteStar({ id, name, aliases = [], className = "" }: { id: string; name: string; aliases?: string[]; className?: string }) {
  const favorites = useFavorites();
  const canonicalId = canonicalIngredientId(id);
  const matches = (favorite: string) => [canonicalId, ...aliases].includes(canonicalIngredientId(favorite));
  const active = favorites.some(matches);

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setFavoriteIngredients(active
      ? favorites.filter(favorite => !matches(favorite))
      : [...favorites, canonicalId]);
  }

  return <button type="button" className={`favorite-star ${className}`} aria-label={`${name} 관심 식재료 ${active ? "해제" : "추가"}`} aria-pressed={active} onClick={toggle}>
    <svg viewBox="0 0 24 24" width="20" height="20" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="m12 2.8 2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.36l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93L12 2.8Z" /></svg>
  </button>;
}
