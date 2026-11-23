import Link from "next/link";
import type { LivePrice } from "@/lib/prices/model";
import { favoriteIdentity } from "@/lib/prices/identity";
import { missingForecastReason } from "@/lib/prices/status";
import { formatDate, formatNumber, formatPercent, won } from "@/lib/prices/format";
import { IngredientImage } from "./ingredient-image";
import { FavoriteStar } from "./favorite-star";
import { PriceNotices } from "./price-notices";
import { RecentPriceChart } from "./recent-price-chart";
import { PriceIndicators } from "./price-indicators";
import { ModelOpinion } from "./model-opinion";
import "./price-detail.css";

/**
 * 7일 예측값의 최저~최고와 그 날짜. 구매 시점을 판정하지 않고 예측 경로의 사실만 보여준다.
 * 예측 방향과 같은 forecastPoints에서 나오므로 두 칸이 서로 어긋나지 않는다.
 */
function ForecastRangeMetric({ item, baseline }: { item: LivePrice; baseline: boolean }) {
  const points = item.forecastPoints.filter((point): point is typeof point & { price: number } => point.price !== null);
  const title = baseline ? "7일 범위 (직전 가격 유지)" : "AI 7일 예측 범위";
  if (!points.length) return <div className="dashboard-metric guide-metric"><h3>{title}</h3><strong>-</strong><p>예측 정보가 없습니다.</p></div>;
  const low = points.reduce((a, b) => b.price < a.price ? b : a), high = points.reduce((a, b) => b.price > a.price ? b : a);
  const short = (date: string) => date.slice(5).replace("-", ".");
  return <div className="dashboard-metric guide-metric"><h3>{title}</h3>
    {low.price === high.price ? <><strong>{won(low.price)}</strong><p>7일 동안 같은 값</p></>
      : <><strong>{won(low.price)} ~ {won(high.price)}</strong><p>최저 {short(low.date)} · 최고 {short(high.date)}</p></>}
  </div>;
}

// Layout: conclusion first. Product + current price + indicator headline share one hero card,
// then a tab switch between the evidence cards (default) and the model's opinion.
export function PriceDetail({ item }: { item: LivePrice }) {
  // 기준 모델이면 AI 예측이 아니라 직전 가격을 그대로 둔 값이다. 제목에서 그 점을 밝힌다.
  const baseline = item.status === "BASELINE" || item.quality === "BASELINE";
  const down = item.forecastDirection === "down";
  const direction = down ? "하락" : item.forecastDirection === "up" ? "상승" : item.forecastDirection === "flat" ? "보합" : "예측 정보 없음";
  const product = <div className="hero-product">
    <div className="hero-product-image"><IngredientImage item={item} /></div>
    <div className="hero-product-body">
      <div className="hero-product-heading"><div><span className="ingredient-category">{item.category}</span><h2>{item.name}</h2><p>{item.unit} · 전국 평균</p></div>
        <FavoriteStar {...favoriteIdentity(item)} name={item.name} /></div>
      <p className="hero-price"><strong>{won(item.currentPrice)}</strong><span>주간 {formatPercent(item.weeklyChangeRate)}</span></p>
      <p className="dashboard-dates">가격 기준일 <time dateTime={item.priceDate ?? undefined}>{formatDate(item.priceDate ?? null)}</time></p>
      <PriceNotices item={item} className="mt-2" />
    </div>
  </div>;
  return <main id="main-content" className="price-page price-detail-page price-dashboard">
    <header className="dashboard-heading"><h1>시세 상세</h1><nav aria-label="현재 위치"><Link href="/prices">시세</Link><span aria-hidden="true">›</span><span aria-current="page">{item.name}</span></nav></header>
    <PriceIndicators item={item} product={product} opinion={<ModelOpinion item={item}>
      <div className="model-opinion-top">
        <div className="model-opinion-figures">
        <div className="dashboard-metrics is-forecast">
          <div className="dashboard-metric forecast-metric"><h3>{baseline ? "7일 뒤 (직전 가격 유지)" : "AI 7일 예측"}</h3><strong>{won(item.forecastPrice)}</strong></div>
          <div className={"dashboard-metric direction-metric " + (down ? "is-down" : item.forecastDirection === "up" ? "is-up" : "text-slate-500")}><h3>예측 방향</h3><strong>{down ? "↓ " : item.forecastDirection === "up" ? "↑ " : ""}{direction}</strong><p>{item.forecastDelta !== null && item.forecastDelta > 0 ? "+" : ""}{won(item.forecastDelta)} ({formatPercent(item.forecastPercent)})</p></div>
          <ForecastRangeMetric item={item} baseline={baseline} />
        </div>
        <p className="dashboard-dates">예측 기준일 <time dateTime={item.baseDate ?? undefined}>{formatDate(item.baseDate)}</time> · 예측 대상일 <time dateTime={item.forecastDate ?? undefined}>{formatDate(item.forecastDate)}</time></p>
        <section className="dashboard-ai-summary" aria-labelledby="prediction-summary-title"><h2 id="prediction-summary-title">{baseline ? "예측 요약" : "AI 예측 요약"}</h2><div className="dashboard-ai-body"><div>
        {item.forecastPrice !== null && item.aiSummary ? <><p>{item.aiSummary.headline}</p>{item.aiSummary.detail && <p className="mt-1 text-muted">{item.aiSummary.detail}</p>}</> : item.forecastPrice === null ? <p>{missingForecastReason(item)}</p> : item.currentPrice === null ? <p>현재 가격 정보가 없습니다. 7일 후 예상가는 {won(item.forecastPrice)}입니다.</p> : <p>현재 <strong>{won(item.currentPrice)}</strong>인 {item.name} 가격은 7일 후 <strong>{won(item.forecastPrice)}</strong>으로 {item.forecastDirection === "flat" ? "보합을 유지할" : (item.forecastPercent === null ? "" : "약 " + formatNumber(Math.abs(item.forecastPercent), 1) + "% ") + (down ? "낮아질" : "높아질")} 것으로 예측되었습니다.</p>}
        </div></div></section>
        </div>
        {/* Same narrow chart as the original detail page (top-right column): PriceChart draws its 360-wide form under 640px. */}
        <RecentPriceChart item={item} />
      </div>
    </ModelOpinion>} />
    <p className="dashboard-footnote">{item.source} · 지표는 과거 데이터로 확인한 사실이며 미래 가격을 보장하지 않습니다. AI 예측은 실제 가격과 다를 수 있으며, SHAP은 인과관계를 의미하지 않습니다.</p>
  </main>;
}
