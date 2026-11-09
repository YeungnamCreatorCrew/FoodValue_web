"use client";

import { useMemo, useSyncExternalStore } from "react";

export const FAVORITES_STORAGE_KEY = "foodvalue-favorite-ingredients";
export const FAVORITES_CHANGED_EVENT = "foodvalue-favorites-changed";

function snapshot() {
  try { return window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]"; }
  catch { return "[]"; }
}

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === FAVORITES_STORAGE_KEY) notify();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(FAVORITES_CHANGED_EVENT, notify);
  window.addEventListener("focus", notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(FAVORITES_CHANGED_EVENT, notify);
    window.removeEventListener("focus", notify);
  };
}

/** Future favorites controls should use this writer for same-tab updates. */
export function setFavoriteIngredients(ids: string[]) {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...new Set(ids)]));
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}

export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  return useMemo(() => {
    try {
      const value: unknown = JSON.parse(raw);
      return Array.isArray(value)
        ? [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))]
        : [];
    } catch { return []; }
  }, [raw]);
}
