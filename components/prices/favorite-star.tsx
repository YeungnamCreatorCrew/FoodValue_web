"use client";

import type { MouseEvent } from "react";
import { canonicalIngredientId } from "@/lib/home/ingredient-data";
import { setFavoriteIngredients, useFavorites } from "@/lib/home/favorites";

export function FavoriteStar({ id, name, className = "" }: { id: string; name: string; className?: string }) {
  const favorites = useFavorites();
  const canonicalId = canonicalIngredientId(id);
  const active = favorites.some(favorite => canonicalIngredientId(favorite) === canonicalId);

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setFavoriteIngredients(active
      ? favorites.filter(favorite => canonicalIngredientId(favorite) !== canonicalId)
      : [...favorites, canonicalId]);
  }

  return <button type="button" className={`favorite-star ${className}`} aria-label={`${name} 관심 식재료 ${active ? "해제" : "추가"}`} aria-pressed={active} onClick={toggle}>
    <svg viewBox="0 0 24 24" width="20" height="20" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="m12 2.8 2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.36l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93L12 2.8Z" /></svg>
  </button>;
}
