"use client";

import { useState } from "react";
import { PriceChart } from "@/components/prices/price-chart";
import { featuredPrices } from "@/lib/prices/catalog";

export function PriceTrendSection() {
  const [selected, setSelected] = useState(featuredPrices[0].id);
  const item = featuredPrices.find(item => item.id === selected)!;
  return <section className="home-trend-panel" aria-labelledby="trend-title">
    <div className="home-section-heading"><div><h2 id="trend-title">주요 식재료 가격 추이</h2><p>기준일 가격과 7일 후 예측 가격을 확인해보세요.</p></div></div>
    <div className="home-ingredient-selector" role="group" aria-label="가격 추이 식재료">{featuredPrices.map(ingredient => <button type="button" key={ingredient.id} aria-pressed={selected === ingredient.id} onClick={() => setSelected(ingredient.id)}>{ingredient.name}{ingredient.isDemo ? " · DEMO" : ""}</button>)}</div>
    <PriceChart key={selected} item={item} presentation="home" />
  </section>;
}
