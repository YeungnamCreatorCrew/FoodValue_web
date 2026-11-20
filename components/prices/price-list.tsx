"use client";

import { useState } from "react";
import { usePriceList } from "@/lib/prices/use-prices";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { Category, PriceSort } from "@/lib/prices/types";
import { PriceForecastCard } from "./price-forecast-card";
import { Icon } from "@/components/ui/Icon";

const categories = [{ id: "ALL", label: "전체" }, { id: "VEGETABLE", label: "채소" }, { id: "FRUIT", label: "과일" }, { id: "MEAT", label: "육류" }, { id: "SEAFOOD", label: "수산물" }, { id: "GRAIN", label: "곡류" }, { id: "ETC", label: "기타" }] as const;
export function PriceList({ initialKeyword = "" }: { initialKeyword?: string }) {
  const [keyword, setKeyword] = useState(initialKeyword.slice(0, 50));
  const [category, setCategory] = useState<Category | "ALL">("ALL");
  const [sort, setSort] = useState<PriceSort>("name");
  const [page, setPage] = useState(1);
  const debouncedKeyword = useDebouncedValue(keyword, 300);
  const { data, loading, error, reload } = usePriceList({ keyword: debouncedKeyword, category, sort, page, size: 12 });
  const results = data?.items ?? [];
  return <main id="main-content" className="price-page price-list-page">
    <header className="price-page-heading"><p className="home-eyebrow">FoodValue</p><h1>식자재 시세</h1><p>식자재의 현재 가격과 AI가 예측한<br className="md:hidden" /> 7일 뒤 가격을 확인해보세요.</p></header>
    <div className="price-list-tools">
      <div className="price-list-search"><Icon name="search" size={22} /><label htmlFor="price-search" className="sr-only">식자재 검색</label><input id="price-search" type="search" maxLength={50} value={keyword} onChange={event => { setKeyword(event.target.value); setPage(1); }} placeholder="식자재를 검색해보세요. (예: 대파)" /></div>
      <div className="price-category-chips" role="group" aria-label="품목 카테고리">{categories.map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setPage(1); }}>{item.label}</button>)}</div>
    </div>
    <div className="price-data-note"><p>전국 평균 소매 가격과 7일 예측입니다.</p></div>
    <label className="mb-4 flex items-center justify-end gap-2 text-sm text-muted">정렬 <select value={sort} onChange={event => { setSort(event.target.value as PriceSort); setPage(1); }}><option value="name">이름순</option><option value="price-drop">주간 하락률순</option><option value="forecast-drop">예측 하락률순</option></select></label>
    <section aria-label="식자재 검색 결과" aria-live="polite">
      {loading ? <p role="status" className="py-10 text-center text-muted">가격 정보를 불러오는 중입니다.</p> : error ? <div role="alert" className="price-empty"><p>{error}</p><button type="button" onClick={reload}>다시 시도</button></div> : <>
        <p className="mb-4 text-sm text-muted">{data?.total ?? 0}개 품목</p>
        {results.length ? <div className="price-catalog-grid">{results.map(item => <PriceForecastCard key={item.id} item={item} />)}</div> : <div className="price-empty"><h2>검색 결과가 없습니다.</h2><p>다른 식재료를 검색하거나 카테고리를 변경해보세요.</p><button type="button" onClick={() => { setKeyword(""); setCategory("ALL"); setPage(1); }}>전체 품목 보기</button></div>}
        {data && data.total > data.size && <nav aria-label="시세 목록 페이지" className="chart-periods mt-6 flex justify-center gap-4"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)}>이전</button><span>{page} / {Math.ceil(data.total / data.size)}</span><button type="button" disabled={page * data.size >= data.total} onClick={() => setPage(value => value + 1)}>다음</button></nav>}
      </>}
    </section>
  </main>;
}
