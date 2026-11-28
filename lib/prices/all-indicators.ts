"use client";

import type { IndicatorCard } from "./model";
import { getPriceIndicators } from "./service";

/** 홈 도움말의 '품목 합산 검증'용. 처음 열 때 한 번만 품목별 지표를 받아 둔다(첫 화면 요청을 늘리지 않는다). */
let cache: { key: string; promise: Promise<IndicatorCard[]> } | null = null;
export function loadAllIndicatorCards(ids: string[]) {
  const key = ids.join(",");
  if (cache?.key === key) return cache.promise;
  const promise = Promise.all(ids.slice(0, 50).map(id => getPriceIndicators(id).then(data => data.cards).catch(() => [] as IndicatorCard[]))).then(rows => rows.flat());
  promise.catch(() => { cache = null; });
  cache = { key, promise };
  return promise;
}
