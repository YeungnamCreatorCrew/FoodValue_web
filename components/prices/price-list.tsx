"use client";

import { useState } from "react";
import { filterPrices } from "@/lib/prices/catalog";
import { PriceForecastCard } from "./price-forecast-card";
import { Icon } from "@/components/ui/Icon";

const categories = [{ id: "ALL", label: "전체" }, { id: "VEGETABLE", label: "채소" }, { id: "FRUIT", label: "과일" }, { id: "MEAT", label: "육류" }, { id: "SEAFOOD", label: "수산물" }, { id: "GRAIN", label: "곡류" }];
export function PriceList({ initialKeyword = "" }: { initialKeyword?: string }) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [category, setCategory] = useState("ALL");
  const results = filterPrices(keyword, category);
  return <main id="main-content" className="price-page price-list-page">
    <header className="price-page-heading"><p className="home-eyebrow">FoodValue</p><h1>식자재 시세</h1><p>식자재의 현재 가격과 AI가 예측한<br className="md:hidden" /> 7일 뒤 가격을 확인해보세요.</p></header>
    <div className="price-list-tools">
      <div className="price-list-search"><Icon name="search" size={22} /><label htmlFor="price-search" className="sr-only">식자재 검색</label><input id="price-search" type="search" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="식자재를 검색해보세요. (예: 대파)" /></div>
      <div className="price-category-chips" role="group" aria-label="품목 카테고리">{categories.map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>
    </div>
    <div className="price-data-note"><span className="data-badge data-poc">Colab PoC</span><p>대파는 실제 PoC 결과입니다. 다른 품목은 화면 시연용 DEMO 데이터입니다.</p></div>
    <section aria-label="식자재 검색 결과" aria-live="polite">
      <p className="mb-4 text-sm text-muted">{results.length}개 품목 · PoC 품목 우선</p>
      {results.length ? <div className="price-catalog-grid">{results.map(item => <PriceForecastCard key={item.id} item={item} />)}</div> : <div className="price-empty"><h2>검색 결과가 없습니다.</h2><p>다른 식재료를 검색하거나 카테고리를 변경해보세요.</p><button type="button" onClick={() => { setKeyword(""); setCategory("ALL"); }}>전체 품목 보기</button></div>}
    </section>
  </main>;
}
