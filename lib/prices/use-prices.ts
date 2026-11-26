"use client";

import { useCallback, useEffect, useState } from "react";
import { getFactorTrend, getPrice, getPriceChart, getPriceHistory, getPriceFactors, getPriceIndicators, listPrices } from "./service";
import type { PriceHistoryPeriod, PriceIndicators, PriceListQuery } from "./model";

/** Keyed results prevent a late response from showing another item's data. */
export function usePriceResource<T>(key: string, load: (signal: AbortSignal) => Promise<T>, skip = false) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null);
  useEffect(() => {
    if (skip) return;
    const controller = new AbortController();
    load(controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ key: requestKey, data });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key: requestKey, error: error instanceof Error ? error.message : "가격 정보를 불러오지 못했습니다." });
    });
    return () => controller.abort();
  }, [requestKey, load, skip]);
  const current = result?.key === requestKey ? result : null;
  return { data: current?.data, error: current?.error, loading: current === null, reload: () => setAttempt(value => value + 1) };
}
/** skip이면 요청하지 않는다(서버가 이미 불러왔거나, 서버에서 실패해 화면을 새로 그려 다시 시도할 때). */
export function usePriceList({ category, keyword, sort, page, size }: PriceListQuery, skip = false) {
  const load = useCallback((signal: AbortSignal) => listPrices({ category, keyword, sort, page, size }, signal), [category, keyword, sort, page, size]);
  return usePriceResource(JSON.stringify([category, keyword, sort, page, size]), load, skip);
}
export function usePriceDetail(id: string) {
  const load = useCallback((signal: AbortSignal) => getPrice(id, signal), [id]);
  return usePriceResource(id, load);
}
export function usePriceChart(id: string, days: PriceHistoryPeriod) {
  const load = useCallback((signal: AbortSignal) => getPriceChart(id, days, signal), [id, days]);
  return usePriceResource(`${id}:${days}`, load);
}
export function usePriceHistory(id: string, days: PriceHistoryPeriod, skip = false) {
  const load = useCallback((signal: AbortSignal) => getPriceHistory(id, days, signal), [id, days]);
  return usePriceResource(`history:${id}:${days}`, load, skip);
}
/**
 * 예측 요인은 팝업을 닫았다 다시 열어도 같은 값이라, 화면이 살아 있는 동안 한 번 받은 응답을 재사용한다.
 * 실패한 요청은 기억하지 않는다(다시 시도하면 새로 부른다).
 */
const once = new Map<string, Promise<unknown>>();
function remember<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = once.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const promise = fetcher().catch(error => { once.delete(key); throw error; });
  once.set(key, promise);
  return promise;
}
export function usePriceFactors(id: string) {
  const load = useCallback(() => remember(`factors:${id}`, () => getPriceFactors(id)), [id]);
  return usePriceResource(`factors:${id}`, load);
}
/** Loads 90 days once; shorter periods are sliced on the client. */
export function useFactorTrend(id: string, factorId: string) {
  const load = useCallback(() => remember(`factor:${id}:${factorId}`, () => getFactorTrend(id, factorId, 90)), [id, factorId]);
  return usePriceResource(`factor:${id}:${factorId}`, load);
}
/** Judgement-aid indicator cards (mock until WAS /indicators exists). */
export function usePriceIndicators(id: string, initial: PriceIndicators | null = null) {
  // 서버가 미리 불러온 값이 있으면 다시 요청하지 않는다('다시 시도'를 누르면 그때 부른다).
  const [retried, setRetried] = useState(false);
  const load = useCallback((signal: AbortSignal) => getPriceIndicators(id, signal), [id]);
  const fetched = usePriceResource(`indicators:${id}`, load, initial !== null && !retried);
  if (initial && !retried) return { data: initial, error: undefined, loading: false, reload: () => setRetried(true) };
  return fetched;
}
