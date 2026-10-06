"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { forecastRate, won } from "@/lib/prices/format";
import { MOCK_BASE_DATE, mockPricesSource } from "@/lib/prices/mock";
import type { Category, PriceItem, PricePage, PriceSort } from "@/lib/prices/types";
import { categoryLabels, FigmaIcon, PriceChange, RecommendationBadge, SampleNotice, UnsupportedAction } from "./ui";

function Sparkline({ item }: { item: PriceItem }) {
  const prices = [item.currentPrice, ...item.forecast.map(point => point.price)];
  const min = Math.min(...prices), spread = Math.max(...prices) - min || 1;
  const points = prices.map((price, i) => `${2 + i * 82 / (prices.length - 1)},${26 - (price - min) / spread * 22}`).join(" ");
  return <svg width="86" height="28" viewBox="0 0 86 28" role="img" aria-label={`${item.name} 7일 가격 예측 추이`}>
    <polyline points={points} fill="none" stroke={forecastRate(item) > 0 ? "#ef4444" : forecastRate(item) < 0 ? "#3b82f6" : "#94a3b8"} strokeWidth="1.4" strokeLinejoin="round" />
  </svg>;
}
function PriceCard({ item }: { item: PriceItem }) {
  return <article className="relative shrink-0 rounded-[10px] border border-border bg-white">
    <Link href={`/prices/${item.id}`} className="flex h-[132px] flex-col gap-2 overflow-hidden rounded-[10px] p-3 focus-visible:outline-offset-[-2px]" aria-label={`${item.name} 시세 상세, 현재 ${won(item.currentPrice)}`}>
    <div className="flex h-[38px] items-center gap-2">
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-md bg-emerald-50"><FigmaIcon name="imgPlaceholder" /></span>
      <div className="min-w-0 flex-1"><h2 className="truncate text-base font-semibold leading-[18px] tracking-[-0.08px]">{item.name}</h2><p className="mt-[3px] text-[11px] leading-[14px] text-muted">{item.unitLabel}</p></div>
      <div className="mr-[26px]"><RecommendationBadge item={item} /></div>
    </div>
    <div className="flex min-h-16 items-center justify-between gap-2">
      <div className="flex flex-col gap-1.5"><div className="flex flex-wrap items-center gap-2"><strong className="text-[23px] leading-7 tracking-[-0.138px]">{won(item.currentPrice)}</strong><PriceChange rate={item.weeklyChangeRate} /></div>
        <p className="flex flex-wrap items-center gap-2 text-xs leading-[18px] text-slate-700">7일 뒤 {won(item.forecast.at(-1)!.price)} <PriceChange rate={forecastRate(item)} /></p>
      </div>
      <div className="flex w-[98px] shrink-0 flex-col items-center gap-1"><span className="text-[10px] leading-[14px] text-muted">7일 예측</span><Sparkline item={item} /></div>
    </div>
    </Link>
    <UnsupportedAction label={`${item.name} 관심 등록`} icon="img3" size={18} className="absolute top-[22px] right-3" />
  </article>;
}

const categories: (Category | "ALL")[] = ["ALL", "VEGETABLE", "GRAIN", "FRUIT", "MEAT"];
const pageSize = 12;
export function PriceList({ initial }: { initial: PricePage }) {
  const [category, setCategory] = useState<Category | "ALL">("ALL");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<PriceSort>("price-drop");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const listScroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true); setError(false);
      mockPricesSource.list({ category, keyword, sort, page, size: pageSize }).then(data => {
        if (active) { setResult(data); if (listScroll.current) listScroll.current.scrollTop = 0; }
      }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    }, keyword ? 180 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [category, keyword, sort, page, retry]);
  const totalPages = Math.ceil(result.total / pageSize);
  return <main id="main-content" className="flex h-[calc(100dvh_-_124px_-_env(safe-area-inset-bottom))] w-full flex-col gap-3 bg-slate-50 px-4 py-3">
    <div className="flex h-14 shrink-0 items-center gap-3 rounded-[10px] bg-emerald-50 px-3">
      <FigmaIcon name="imgAi" size={24} /><div><p className="text-[13px] font-medium leading-5 text-primary">AI가 분석하는 오늘의 식자재 시세</p><p className="text-[11px] leading-[18px] text-muted">지금 가격과 7일 뒤 예측을 한눈에 확인하세요.</p></div>
    </div>
    <div className="flex h-[42px] shrink-0 gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-white pl-3.5 pr-2">
      <FigmaIcon name="img2" /><label htmlFor="price-search" className="sr-only">농수산물 품목 검색</label>
      <input id="price-search" type="search" value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }} placeholder="농수산물 품목 검색" className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted" />
      </div>
      <UnsupportedAction label="관심 품목만 보기" icon="imgIconStar" size={16} className="size-[42px] rounded-lg border border-border bg-white" />
    </div>
    <div role="group" aria-label="품목 카테고리" className="flex h-10 shrink-0 overflow-hidden rounded-[10px] bg-slate-100">
      {categories.map(value => <button key={value} onClick={() => { setCategory(value); setPage(1); }} aria-pressed={value === category} className={`min-w-0 flex-1 border border-border text-sm font-medium ${value === category ? "border-primary bg-primary text-white" : "text-slate-700 hover:bg-slate-200"}`}>{value === "ALL" ? "전체" : categoryLabels[value]}</button>)}
    </div>
    <div className="flex h-8 shrink-0 items-center justify-between gap-2"><p className="text-[11px] leading-4 text-muted">전국 평균 · {MOCK_BASE_DATE}</p>
      <div className="relative"><label htmlFor="price-sort" className="sr-only">시세 정렬</label><select id="price-sort" value={sort} onChange={e => { setSort(e.target.value as PriceSort); setPage(1); }} className="h-8 w-36 appearance-none rounded-md border border-slate-300 bg-white pl-3 pr-8 text-xs font-medium">
        <option value="price-drop">가격 하락률순</option><option value="forecast-drop">예측 하락률순</option><option value="name">이름순</option>
      </select><span className="pointer-events-none absolute right-3 top-2"><FigmaIcon name="imgIconChevronDown" size={16} /></span></div>
    </div>
    <div ref={listScroll} aria-live="polite" aria-busy={loading} className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
      {error ? <div role="alert" className="rounded-xl border border-border bg-white p-8 text-center"><p>시세를 불러오지 못했습니다.</p><button onClick={() => setRetry(n => n + 1)} className="mt-3 text-sm text-primary underline">다시 시도</button></div>
        : result.total === 0 ? <div className="rounded-xl border border-border bg-white p-10 text-center"><p className="font-medium">검색 결과가 없습니다.</p><p className="mt-2 text-sm text-muted">다른 품목명이나 카테고리로 검색해 보세요.</p><button onClick={() => { setKeyword(""); setCategory("ALL"); setPage(1); }} className="mt-4 text-sm text-primary underline">필터 초기화</button></div>
        : <div className={`flex flex-col gap-3 ${loading ? "opacity-60" : ""}`}>{result.items.map(item => <PriceCard key={item.id} item={item} />)}</div>}
      <span className="sr-only top-0 left-0">{loading ? "시세 불러오는 중" : `${result.total}개 품목`}</span>
      {totalPages > 1 && <nav aria-label="시세 목록 페이지" className="flex items-center justify-center gap-4 py-3 text-xs"><button disabled={page === 1 || loading} onClick={() => setPage(n => n - 1)} className="rounded-md border border-border bg-white px-3 py-2 disabled:opacity-40">이전</button><span>{page} / {totalPages}</span><button disabled={page >= totalPages || loading} onClick={() => setPage(n => n + 1)} className="rounded-md border border-border bg-white px-3 py-2 disabled:opacity-40">다음</button></nav>}
    </div>
    <SampleNotice />
  </main>;
}
