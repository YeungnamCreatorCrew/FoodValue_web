import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { LivePrice } from "@/lib/prices/model";
import { favoriteIdentity } from "@/lib/prices/identity";
import { formatPercent, won } from "@/lib/prices/format";
import { PriceCardChart } from "./price-card-chart";
import { FavoriteStar } from "./favorite-star";
import { PriceNotices } from "./price-notices";
const shortDate = (date: string | null | undefined) => date?.slice(5).replace("-", ".") ?? "-";
export function ForecastChange({ item }: { item: LivePrice }) {
  if (item.forecastDelta === null) return <span className="price-direction bg-slate-100 text-slate-600">예측 정보 없음</span>;
  return <span className={`price-direction ${item.forecastDirection === "up" ? "price-up" : item.forecastDirection === "down" ? "price-down" : "bg-slate-100 text-slate-600"}`}>
    {item.forecastDirection === "flat" ? <>보합 ({formatPercent(item.forecastPercent)})</>
      : <>{item.forecastDirection === "down" ? "▼" : "▲"} {won(Math.abs(item.forecastDelta))} ({formatPercent(item.forecastPercent)})</>}
  </span>;
}
export function ForecastValues({ item }: { item: LivePrice }) {
  return <div className="featured-price-values">
    <div><p>현재 가격</p><strong>{won(item.currentPrice)}</strong></div>
    <span className="text-slate-300" aria-hidden="true">→</span>
    <div><p>AI 7일 예측</p><strong>{won(item.forecastPrice)}</strong></div>
  </div>;
}
export function IngredientImage({ item }: { item: LivePrice }) {
  return <div className="ingredient-image">{item.image ? <Image src={item.image} alt="" width={240} height={240} className="h-full w-full rounded-[10px] object-cover" /> : <div className="ingredient-placeholder"><Icon name="image-off" size={24} /><span>{item.name}</span></div>}</div>;
}
export function PriceForecastCard({ item }: { item: LivePrice }) {
  return <article className="featured-price-card">
    <FavoriteStar {...favoriteIdentity(item)} name={item.name} className="favorite-star-card" />
    <Link href={`/prices/${item.id}`} className="price-card-link" aria-label={`${item.name} 시세 상세, 현재 ${won(item.currentPrice)}, AI 7일 예측 ${won(item.forecastPrice)}`}>
      <div className="forecast-card-meta mb-4 flex flex-wrap items-center justify-between gap-2"><span aria-hidden="true" className="h-7 w-7" /><span className="text-xs text-muted">{item.category}</span></div>
      <div className="forecast-card-product flex items-center gap-4"><IngredientImage item={item} /><div className="forecast-card-name"><h3 title={item.name}>{item.name}</h3><p className="text-sm text-muted" title={`${item.unit} · 전국 평균`}>{item.unit} · 전국 평균</p></div></div>
      <ForecastValues item={item} />
      <p className="text-right text-xs text-muted">주간 변화 {formatPercent(item.weeklyChangeRate)}</p>
      <div className="flex justify-end"><ForecastChange item={item} /></div>
      <PriceCardChart item={item} />
      <p className="forecast-card-dates"><span>가격 기준일 <time dateTime={item.priceDate ?? undefined}>{shortDate(item.priceDate)}</time></span><span>예측 <time dateTime={item.baseDate ?? undefined}>{shortDate(item.baseDate)}</time> → <time dateTime={item.forecastDate ?? undefined}>{shortDate(item.forecastDate)}</time></span></p>
      <PriceNotices item={item} />
    </Link>
  </article>;
}
