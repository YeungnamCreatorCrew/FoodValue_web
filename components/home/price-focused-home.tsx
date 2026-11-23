"use client";

import Image from "next/image";
import Link from "next/link";
import type { LivePrice } from "@/lib/prices/model";
import { usePriceList } from "@/lib/prices/use-prices";
import { PriceForecastCard, ForecastChange } from "@/components/prices/price-forecast-card";
import { won, formatDate } from "@/lib/prices/format";
import { PriceCardChart } from "@/components/prices/price-card-chart";
import { HomeSearch, PopularIngredientChips } from "./home-search";
import { PriceTrendSection } from "./price-trend-section";

function HeroSection({ item, loading, error }: { item?: LivePrice; loading: boolean; error?: string }) {
  return <div className="home-hero-grid">
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="home-eyebrow">더 나은 장보기의 시작</p>
        <h1 id="hero-title">오늘 식재료,<br /><span>언제 사면 좋을까요?</span></h1>
        <p className="hero-description">AI 가격 예측으로 가장 현명한 구매 타이밍을 알려드려요.</p>
      </div>
      <div className="hero-produce" aria-hidden="true">
        <span className="produce-orbit" />
        <Image src="/figma/home/green-onion.png" alt="" width={180} height={180} className="hero-green-onion" />
        <Image src="/figma/home/onion.png" alt="" width={120} height={120} className="hero-onion" />
        <span className="produce-note">오늘의 식재료<br /><strong>내일의 가치</strong></span>
      </div>
      <HomeSearch />
    </section>
    <aside className="home-ai-card" aria-labelledby="ai-preview-title">
      <span className="ai-badge">✧ AI 가격 예측</span>
      <h2 id="ai-preview-title">7일 뒤 가격까지,<br />미리 확인하세요</h2>
      {loading ? <p role="status">가격 정보를 불러오는 중입니다.</p> : error ? <p role="alert">가격 정보를 불러오지 못했습니다.</p> : item ? <>
        <p>{item.name} · {item.unit}<br />{formatDate(item.priceDate ?? null)} 기준</p>
        <div className="hero-poc-values"><span>{won(item.currentPrice)}</span><span aria-hidden="true">→</span><strong>{won(item.forecastPrice)}</strong></div>
        <ForecastChange item={item} />
        <PriceCardChart item={item} variant="hero" />
        <div className="flex justify-between text-xs text-primary/70"><span>전국 평균 소매 가격</span><span>{formatDate(item.forecastDate)} 예측</span></div>
      </> : <p>가격 정보가 없습니다.</p>}
    </aside>
  </div>;
}

export function PriceFocusedHome() {
  const { data, loading, error, reload } = usePriceList({ sort: "name", page: 1, size: 50 });
  const items = data?.items ?? [];
  return <main id="home-content" className="price-home">
    <a href="#featured-title" className="sr-only focus:not-sr-only">주요 시세 바로가기</a>
    <HeroSection item={items[0]} loading={loading} error={error} />
    <PopularIngredientChips />
    <section aria-labelledby="featured-title">
      <div className="home-section-heading">
        <div><h2 id="featured-title"><span className="text-amber-500" aria-hidden="true">✦</span> 주요 식재료 시세</h2><p>전국 평균 소매 가격과 서버의 7일 예측을 확인하세요.</p></div>
        <Link href="/prices" className="home-more">전체 보기 <span aria-hidden="true">→</span></Link>
      </div>
      {loading ? <p role="status" className="py-10 text-muted">시세를 불러오는 중입니다.</p> : error ? <div role="alert" className="price-empty"><p>{error}</p><button type="button" onClick={reload}>다시 시도</button></div> : items.length ? <div className="featured-price-grid">{items.map(item => <PriceForecastCard key={item.id} item={item} />)}</div> : <p className="price-empty">등록된 시세 품목이 없습니다.</p>}
    </section>
    <PriceTrendSection />
    <Link href="/prices" className="home-mobile-cta">전체 시세 보기 <span aria-hidden="true">→</span></Link>
    <p className="home-sample-note">실제 소매 가격 데이터 · AI 예측은 실제 가격과 다를 수 있습니다.</p>
  </main>;
}
