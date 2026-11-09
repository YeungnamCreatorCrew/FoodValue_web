import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { PriceRecord } from "@/lib/prices/poc-types";
import { formatPercent, won } from "@/lib/prices/format";
import { ForecastSparkline } from "./forecast-sparkline";
import { FavoriteStar } from "./favorite-star";
export function ForecastChange({ item }: { item: PriceRecord }) {
  return <span className={`price-direction ${item.forecastDirection === "up" ? "price-up" : item.forecastDirection === "down" ? "price-down" : "bg-slate-100 text-slate-600"}`}>
    {item.forecastDirection === "down" ? "▼" : item.forecastDirection === "up" ? "▲" : "—"} {won(Math.abs(item.forecastDelta))} ({formatPercent(item.forecastPercent)})
  </span>;
}
export function ForecastValues({ item }: { item: PriceRecord }) {
  return <div className="featured-price-values">
    <div><p>현재 가격</p><strong>{won(item.currentPrice)}</strong></div>
    <span className="text-slate-300" aria-hidden="true">→</span>
    <div><p>7일 후 예상가</p><strong className="text-primary">{won(item.forecastPrice)}</strong></div>
  </div>;
}
export function IngredientImage({ item }: { item: PriceRecord }) {
  return <div className="ingredient-image">{item.image ? <Image src={item.image} alt="" width={92} height={92} className="h-full w-full object-contain" /> : <div className="ingredient-placeholder"><Icon name="image-off" size={24} /><span>{item.name}</span></div>}</div>;
}
export function PriceForecastCard({ item }: { item: PriceRecord }) {
  return <article className={`featured-price-card ${item.isPoc ? "poc-featured" : ""}`}>
    <FavoriteStar id={item.id} name={item.name} className="favorite-star-card" />
    <Link href={`/prices/${item.id}`} className="price-card-link" aria-label={`${item.name} 시세 상세, 현재 ${won(item.currentPrice)}, 7일 후 ${won(item.forecastPrice)}`}>
      <div className="forecast-card-meta mb-4 flex flex-wrap items-center justify-between gap-2"><span aria-hidden="true" className="h-7 w-7" /><span className="text-xs text-muted">{item.category}</span></div>
      <div className="forecast-card-product flex items-center gap-4"><IngredientImage item={item} /><div className="forecast-card-name"><h3 title={item.name}>{item.name}</h3><p className="text-sm text-muted" title={`${item.unit} · 전국 평균`}>{item.unit} · 전국 평균</p></div><span className="ml-auto text-slate-400" aria-hidden="true">↗</span></div>
      <ForecastValues item={item} />
      <div className="flex justify-end"><ForecastChange item={item} /></div>
      <ForecastSparkline item={item} />
      <p className="forecast-card-dates"><span>기준 <time dateTime={item.baseDate} title={item.baseDate}>{item.baseDate.slice(5).replace("-", "/")}</time></span><span><time dateTime={item.forecastDate} title={item.forecastDate}>{item.forecastDate.slice(5).replace("-", "/")}</time> 예측</span></p>
    </Link>
  </article>;
}
