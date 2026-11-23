"use client";

import type { MouseEvent } from "react";
import { canonicalIngredientId } from "@/lib/prices/identity";
import { setFavoriteIngredients, useFavorites } from "@/lib/home/favorites";

/** 홈 시세표 상단 고정 핀. 저장은 기존 관심 식재료(localStorage)를 그대로 쓴다. */
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

  return <button type="button" className={`favorite-star ${className}`} aria-label={`${name} ${active ? "상단 고정 해제" : "상단에 고정"}`} title={active ? "고정 해제" : "상단에 고정"} aria-pressed={active} onClick={toggle}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  </button>;
}
