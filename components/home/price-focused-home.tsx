"use client";

import Link from "next/link";
import { useState } from "react";
import type { LivePrice } from "@/lib/prices/model";
import { usePriceList } from "@/lib/prices/use-prices";
import { HomeSearch, PopularIngredientChips } from "./home-search";
import { IndicatorPriceTable, type FilterId } from "./indicator-price-table";
import { MarketSummary } from "./market-summary";

function HeroSection({ items, loading, onPick }: { items: LivePrice[]; loading: boolean; onPick: (filter: FilterId) => void }) {
  return <section className="home-hero" aria-labelledby="hero-title">
    <h1 id="hero-title" className="sr-only">식재료 시세</h1>
    <HomeSearch />
    <PopularIngredientChips />
    {!loading && items.length > 0 && <MarketSummary items={items} onPick={onPick} />}
  </section>;
}

export function PriceFocusedHome() {
  const { data, loading, error, reload } = usePriceList({ sort: "name", page: 1, size: 50 });
  const items = data?.items ?? [];
  const [filter, setFilter] = useState<FilterId>("all");
  // 요약 숫자를 누르면 표를 그 조건으로 거르고 표로 이동한다.
  const pick = (next: FilterId) => {
    setFilter(next);
    document.getElementById("featured-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return <main id="home-content" className="price-home">
    <a href="#featured-title" className="sr-only focus:not-sr-only">주요 시세 바로가기</a>
    <HeroSection items={items} loading={loading} onPick={pick} />
    <section aria-labelledby="featured-title">
      <div className="home-section-heading">
        <div><h2 id="featured-title">주요 식재료 시세</h2><p>가격 수준과 흐름을 지표로 비교하세요. AI 7일 예측은 참고용입니다.</p></div>
        <Link href="/prices" className="home-more">전체 보기 <span aria-hidden="true">→</span></Link>
      </div>
      {loading ? <p role="status" className="py-10 text-muted">시세를 불러오는 중입니다.</p> : error ? <div role="alert" className="price-empty"><p>{error}</p><button type="button" onClick={reload}>다시 시도</button></div> : items.length ? <IndicatorPriceTable items={items} filter={filter} onFilterChange={setFilter} /> : <p className="price-empty">등록된 시세 품목이 없습니다.</p>}
    </section>
    <Link href="/prices" className="home-mobile-cta">전체 시세 보기 <span aria-hidden="true">→</span></Link>
    <p className="home-sample-note">실제 소매 가격 데이터 · AI 예측은 실제 가격과 다를 수 있습니다.</p>
  </main>;
}
