"use client";

import { useCallback, useEffect, useState } from "react";
import { getPrice, getPriceChart, listPrices } from "./service";
import type { HistoryPeriod, PriceListQuery } from "./model";

/** Keyed results prevent a late response from showing another item's data. */
export function usePriceResource<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ key: requestKey, data });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key: requestKey, error: error instanceof Error ? error.message : "가격 정보를 불러오지 못했습니다." });
    });
    return () => controller.abort();
  }, [requestKey, load]);
  const current = result?.key === requestKey ? result : null;
  return { data: current?.data, error: current?.error, loading: current === null, reload: () => setAttempt(value => value + 1) };
}
export function usePriceList({ category, keyword, sort, page, size }: PriceListQuery) {
  const load = useCallback((signal: AbortSignal) => listPrices({ category, keyword, sort, page, size }, signal), [category, keyword, sort, page, size]);
  return usePriceResource(JSON.stringify([category, keyword, sort, page, size]), load);
}
export function usePriceDetail(id: string) {
  const load = useCallback((signal: AbortSignal) => getPrice(id, signal), [id]);
  return usePriceResource(id, load);
}
export function usePriceChart(id: string, days: HistoryPeriod) {
  const load = useCallback((signal: AbortSignal) => getPriceChart(id, days, signal), [id, days]);
  return usePriceResource(`${id}:${days}`, load);
}
