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
  const [loaded, setLoaded] = useState<{ ids: string[]; data: IngredientHomeData[]; error: boolean } | null>(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(favorites.map(getIngredientHomeData)).then(results => {
      if (cancelled) return;
      const data = results.filter((result): result is IngredientHomeData => result !== null);
      const unique = data.filter((entry, index) => data.findIndex(other => other.item.id === entry.item.id) === index);
      setLoaded({ ids: favorites, data: unique, error: false });
      setSelectedIngredientId(current => unique.some(entry => entry.item.id === current) ? current : unique[0]?.item.id ?? null);
    }).catch(() => {
      if (!cancelled) setLoaded({ ids: favorites, data: [], error: true });
    });
    return () => { cancelled = true; };
  }, [favorites]);

  const pending = favorites.length > 0 && loaded?.ids !== favorites;
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
        <h3 className="text-lg font-semibold">{loaded?.error && favorites.length ? "관심 식재료를 불러오지 못했어요" : "관심 식재료를 추가해보세요"}</h3>
        <p className="mt-3 text-sm text-muted">즐겨찾기한 식재료의 가격 흐름과 AI 예측을 홈에서 바로 확인할 수 있어요.</p>
        <Link href="/prices" className="home-more mt-5 inline-flex">시세에서 찾아보기 <span aria-hidden="true">→</span></Link>
      </div>}
    </section>
    {selected && <IngredientInsight data={selected} />}
  </div>;
}
