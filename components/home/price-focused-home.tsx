import Image from "next/image";
import Link from "next/link";

import { featuredPrices } from "@/lib/prices/catalog";
import { greenOnionPoc } from "@/lib/prices/poc-data";
import { PriceForecastCard, ForecastChange } from "@/components/prices/price-forecast-card";
import { won } from "@/lib/prices/format";
import { ForecastSparkline } from "@/components/prices/forecast-sparkline";
import { HomeSearch, PopularIngredientChips } from "./home-search";
import { PriceTrendSection } from "./price-trend-section";

function HeroSection() {
  const item = greenOnionPoc;
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
      <p>{greenOnionPoc.name} · {greenOnionPoc.unit}<br />{greenOnionPoc.baseDate} 기준</p>
      <div className="hero-poc-values"><span>{won(greenOnionPoc.currentPrice)}</span><span aria-hidden="true">→</span><strong>{won(greenOnionPoc.forecastPrice)}</strong></div>
      <ForecastChange item={greenOnionPoc} />
      <ForecastSparkline item={item} variant="hero" />
      <div className="flex justify-between text-xs text-primary/70"><span>KAMIS 실제 이력</span><span>{greenOnionPoc.forecastDate} 예측</span></div>
    </aside>
  </div>;
}

function FeaturedPriceCards() {
  return <section aria-labelledby="featured-title">
    <div className="home-section-heading">
      <div><h2 id="featured-title"><span className="text-amber-500" aria-hidden="true">✦</span> 주요 식재료 시세</h2><p>대파는 실제 예측 결과, 나머지 품목은 예시 데이터입니다.</p></div>
      <Link href="/prices" className="home-more">전체 보기 <span aria-hidden="true">→</span></Link>
    </div>
    <div className="featured-price-grid">
      {featuredPrices.map(item => <PriceForecastCard key={item.id} item={item} />)}
    </div>
  </section>;
}

export function PriceFocusedHome() {
  return <main id="home-content" className="price-home">
    <a href="#featured-title" className="sr-only focus:not-sr-only">주요 시세 바로가기</a>
    <HeroSection />
    <PopularIngredientChips />
    <FeaturedPriceCards />
    <PriceTrendSection />
    <Link href="/prices" className="home-mobile-cta">전체 시세 보기 <span aria-hidden="true">→</span></Link>
    <p className="home-sample-note">대파는 KAMIS 실제 이력과 예측 결과 · {greenOnionPoc.baseDate} 기준 · 다른 품목은 예시 데이터입니다.</p>
  </main>;
}
