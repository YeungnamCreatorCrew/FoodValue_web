"use client";

import { useState } from "react";
import { usePriceList } from "@/lib/prices/use-prices";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { Category } from "@/lib/prices/types";
import { IndicatorPriceTable, type FilterId } from "@/components/home/indicator-price-table";
import { Icon } from "@/components/ui/Icon";

const categories = [{ id: "ALL", label: "전체" }, { id: "VEGETABLE", label: "채소" }, { id: "FRUIT", label: "과일" }, { id: "MEAT", label: "육류" }, { id: "SEAFOOD", label: "수산물" }, { id: "GRAIN", label: "곡류" }, { id: "ETC", label: "기타" }] as const;
const PAGE_SIZE = 50;

/** 전체 시세. 홈과 같은 검색창·필터 버튼·지표 시세표를 쓰고, 검색어와 분류로 품목을 좁힌다. */
export function PriceList({ initialKeyword = "" }: { initialKeyword?: string }) {
  const [keyword, setKeyword] = useState(initialKeyword.slice(0, 50));
  const [category, setCategory] = useState<Category | "ALL">("ALL");
  const [filter, setFilter] = useState<FilterId>("all");
  const [page, setPage] = useState(1);
  const debouncedKeyword = useDebouncedValue(keyword, 300);
  const { data, loading, error, reload } = usePriceList({ keyword: debouncedKeyword, category, sort: "name", page, size: PAGE_SIZE });
  const results = data?.items ?? [];
  const reset = () => { setKeyword(""); setCategory("ALL"); setFilter("all"); setPage(1); };
  return <main id="main-content" className="price-home price-list-page">
    <section className="home-hero" aria-labelledby="price-list-title">
      <h1 id="price-list-title" className="price-list-title">식자재 시세</h1>
      <div className="home-search-area">
        <div className="home-search" role="search">
          <Icon name="search" size={21} />
          <label htmlFor="price-search" className="sr-only">품목 검색</label>
          <input id="price-search" type="search" maxLength={50} value={keyword} onChange={event => { setKeyword(event.target.value); setPage(1); }} placeholder="품목 검색 (예: 대파, 양파)" />
        </div>
      </div>
      <div className="price-category" role="group" aria-label="품목 분류">
        <p>분류</p>
        <div className="price-table-filters">{categories.map(item => <button type="button" key={item.id} aria-pressed={category === item.id}
          onClick={() => { setCategory(item.id); setPage(1); }}>{item.label}</button>)}</div>
      </div>
    </section>
    <section aria-label="품목 시세" aria-live="polite">
      {loading ? <p role="status" className="py-10 text-center text-muted">가격 정보를 불러오는 중입니다.</p>
        : error ? <div role="alert" className="price-empty"><p>{error}</p><button type="button" onClick={reload}>다시 시도</button></div>
        : results.length ? <IndicatorPriceTable items={results} filter={filter} onFilterChange={setFilter} />
        : <div className="price-table-empty"><p>검색 결과가 없습니다. 다른 품목을 검색하거나 분류를 바꿔보세요.</p><button type="button" className="home-more mx-auto" onClick={reset}>전체 품목 보기 <span aria-hidden="true">→</span></button></div>}
      {data && data.total > data.size && <nav aria-label="시세 목록 페이지" className="price-table-pages"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)}>이전</button><span>{page} / {Math.ceil(data.total / data.size)}</span><button type="button" disabled={page * data.size >= data.total} onClick={() => setPage(value => value + 1)}>다음</button></nav>}
    </section>
    <p className="home-sample-note">실제 소매 가격 데이터 · AI 예측은 실제 가격과 다를 수 있습니다.</p>
  </main>;
}
