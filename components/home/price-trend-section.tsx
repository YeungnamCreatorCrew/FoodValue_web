"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PriceChart } from "@/components/prices/price-chart";
import { ForecastChange } from "@/components/prices/price-forecast-card";
import { useFavorites } from "@/lib/home/favorites";
import { getIngredientHomeData, type IngredientHomeData } from "@/lib/home/ingredient-data";
import { IngredientInsight } from "./ingredient-insight";

export function PriceTrendSection() {
  const favorites = useFavorites();
  const [loaded, setLoaded] = useState<{ ids: string[]; data: IngredientHomeData[]; errors: number; missing: number; attempt: number } | null>(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled(favorites.map(id => getIngredientHomeData(id, controller.signal))).then(results => {
      if (controller.signal.aborted) return;
      const data = results.flatMap(result => result.status === "fulfilled" && result.value ? [result.value] : []);
      const unique = data.filter((entry, index) => data.findIndex(other => other.item.id === entry.item.id) === index);
      setLoaded({ ids: favorites, data: unique, errors: results.filter(result => result.status === "rejected").length,
        missing: results.filter(result => result.status === "fulfilled" && !result.value).length, attempt });
      setSelectedIngredientId(current => unique.some(entry => entry.item.id === current) ? current : unique[0]?.item.id ?? null);
    });
    return () => controller.abort();
  }, [favorites, attempt]);

  const pending = favorites.length > 0 && (loaded?.ids !== favorites || loaded?.attempt !== attempt);
  const entries = !pending && favorites.length ? loaded?.data ?? [] : [];
  const selected = entries.find(entry => entry.item.id === selectedIngredientId) ?? entries[0];
  return <div className="home-analysis-grid">
    <section className="home-trend-panel" aria-labelledby="trend-title" style={!selected ? { gridColumn: "1 / -1" } : undefined}>
      <div className="home-section-heading"><div><h2 id="trend-title">관심 식재료</h2><p>즐겨찾기한 식재료의 가격 흐름과 AI 예측을 확인해보세요.</p></div></div>
      {pending ? <p role="status" className="py-10 text-sm text-muted">관심 식재료를 불러오는 중입니다.</p> : selected ? <>
        <div className="home-ingredient-selector" role="group" aria-label="관심 식재료">{entries.map(({ item }) => <button type="button" key={item.id} aria-pressed={selected.item.id === item.id} onClick={() => setSelectedIngredientId(item.id)}>{item.name}</button>)}</div>
        <PriceChart item={selected.item} presentation="home" />
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2"><span className="text-sm text-muted">현재가 대비 7일 후 변화</span><ForecastChange item={selected.item} /></div>
      </> : <div className="py-10 text-center">
        <h3 className="text-lg font-semibold">{loaded?.errors && favorites.length ? "관심 식재료를 불러오지 못했어요" : favorites.length ? "시세 제공 품목을 찾을 수 없어요" : "관심 식재료를 추가해보세요"}</h3>
        <p className="mt-3 text-sm text-muted">{favorites.length ? "기존 즐겨찾기는 보존됩니다. 시세 목록에서 현재 제공되는 품목을 확인해주세요." : "즐겨찾기한 식재료의 가격 흐름과 AI 예측을 홈에서 바로 확인할 수 있어요."}</p>
        <Link href="/prices" className="home-more mt-5 inline-flex">시세에서 찾아보기 <span aria-hidden="true">→</span></Link>
      </div>}
      {!pending && !!loaded?.errors && <p role="alert" className="mt-3 text-sm text-muted">일부 관심 식재료를 불러오지 못했습니다. <button type="button" onClick={() => setAttempt(value => value + 1)}>다시 시도</button></p>}
      {!pending && !!loaded?.missing && <p className="mt-3 text-sm text-muted">일부 기존 즐겨찾기는 현재 시세 품목과 연결되지 않습니다.</p>}
    </section>
    {selected && <IngredientInsight data={selected} />}
  </div>;
}
