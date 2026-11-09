import Link from "next/link";
import type { PriceRecord } from "@/lib/prices/poc-types";
import { formatDate, formatNumber, formatPercent, won } from "@/lib/prices/format";
import { IngredientImage } from "./price-forecast-card";
import { FavoriteStar } from "./favorite-star";
import { PriceFactorAccordion } from "./price-factors";
import { RecentPriceChart } from "./recent-price-chart";
import "./price-detail.css";

export function PriceDetail({ item }: { item: PriceRecord }) {
  const down = item.forecastDirection === "down";
  const direction = down ? "하락" : item.forecastDirection === "up" ? "상승" : "보합";
  return <main id="main-content" className="price-page price-detail-page price-dashboard">
    <header className="dashboard-heading"><h1>시세 상세</h1><nav aria-label="현재 위치"><Link href="/prices">시세</Link><span aria-hidden="true">›</span><span aria-current="page">{item.name}</span></nav></header>
    <section className="dashboard-summary" aria-label="상품 정보 및 가격 예측">
      <div className="dashboard-product-image"><IngredientImage item={item} /></div>
      <div className="dashboard-product">
        <div className="dashboard-product-heading"><div><span className="ingredient-category">{item.category}</span><h2>{item.name}</h2><p>{item.unit} · 전국 평균</p></div><FavoriteStar id={item.id} name={item.name} /></div>
        <div className="dashboard-metrics">
          <div className="dashboard-metric"><h3>현재 가격</h3><strong>{won(item.currentPrice)}</strong></div>
          <div className="dashboard-metric forecast-metric"><span className="metric-arrow" aria-hidden="true">→</span><h3>7일 뒤 예상가</h3><strong>{won(item.forecastPrice)}</strong></div>
          <div className={`dashboard-metric direction-metric ${down ? "is-down" : "is-up"}`}><h3>예측 방향</h3><strong>{down ? "↓" : item.forecastDirection === "up" ? "↑" : "—"} {direction} 예상</strong><p>{item.forecastDelta > 0 ? "+" : ""}{won(item.forecastDelta)} ({formatPercent(item.forecastPercent)})</p></div>
          <div className="dashboard-metric guide-metric"><h3>구매 가이드</h3><strong><span aria-hidden="true">◷ </span>{down ? "조금 기다려보세요" : "구매 시점을 살펴보세요"}</strong><p>{down ? "향후 가격이 현재보다 낮아질 것으로 예측되고 있습니다." : "예측을 참고해 구매 시점을 계획해보세요."}</p></div>
        </div>
        <p className="dashboard-dates">예측 기준일 <time dateTime={item.baseDate}>{formatDate(item.baseDate)}</time><span aria-hidden="true"> · </span>예측 대상일 <time dateTime={item.forecastDate}>{formatDate(item.forecastDate)}</time></p>
      </div>
      <RecentPriceChart item={item} />
    </section>
    <section className="dashboard-ai-summary" aria-labelledby="prediction-summary-title"><h2 id="prediction-summary-title"><span aria-hidden="true">✧</span> AI 예측 요약</h2><div className="dashboard-ai-body"><span className="dashboard-ai-icon" aria-hidden="true">AI</span><div><p>현재 <strong>{won(item.currentPrice)}</strong>인 {item.name} 가격은 7일 후 <strong>{won(item.forecastPrice)}</strong>으로 {item.forecastDirection === "flat" ? "보합을 유지할" : `약 ${formatNumber(Math.abs(item.forecastPercent), 1)}% ${down ? "낮아질" : "높아질"}`} 것으로 예측되었습니다.</p><p>{item.isPoc ? "이번 예측에서 기상 관련 변수는 하락 방향, 최근 가격 흐름 일부는 상승 방향으로 작용했습니다." : "이 품목은 화면 시연용 예시 데이터입니다."}</p></div></div></section>
    <PriceFactorAccordion item={item} />
    <p className="dashboard-footnote">{item.isPoc ? "KAMIS 실제 가격" : "화면 시연용 예시 데이터"} · AI 예측은 실제 가격과 다를 수 있으며, SHAP은 인과관계를 의미하지 않습니다.</p>
  </main>;
}
