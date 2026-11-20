import type { PriceDetailDto, PriceForecastDto, PriceGuideDto, PriceSummaryDto } from "./dto";
import type { BuyingGuide, ForecastPoint, LivePrice } from "./model";
import { mapDataFactors } from "./factors";
import { mapAiSummary } from "./shap";

const categories = { VEGETABLE: "채소류", GRAIN: "곡류", FRUIT: "과일류", MEAT: "육류", SEAFOOD: "수산물", ETC: "기타" };
export function priceChanges(current: number | null, forecast: number | null, percent?: number | null) {
  const delta = current === null || forecast === null ? null : forecast - current;
  return {
    forecastDelta: delta,
    forecastPercent: delta === null ? null : percent ?? (current ? delta / current * 100 : null),
    forecastDirection: delta === null ? null : delta > 0 ? "up" as const : delta < 0 ? "down" as const : "flat" as const,
  };
}
export function mapSummary(dto: PriceSummaryDto): LivePrice {
  if (!Number.isSafeInteger(dto.id) || dto.id < 1) throw new Error("지원하지 않는 품목 ID입니다.");
  return {
    id: String(dto.id), name: dto.name, category: categories[dto.category], categoryCode: dto.category,
    unit: dto.unitLabel ?? "단위 정보 없음", image: /대파/.test(dto.name) ? "/figma/home/green-onion.png" : dto.name === "양파" ? "/figma/home/onion.png" : null,
    source: dto.source, status: dto.status, quality: dto.quality,
    baseDate: dto.forecastBaseDate, priceDate: dto.priceDate,
    currentPrice: dto.currentPrice, weeklyChangeRate: dto.weeklyChangePercent,
    forecastDate: dto.forecastTargetDate, forecastPrice: dto.forecastPrice,
    ...priceChanges(dto.currentPrice, dto.forecastPrice, dto.forecastChangePercent),
    priceHistory: [], forecastPoints: [], guide: null, forecastStatus: null, dataFactors: [], aiSummary: null,
  };
}
export function mapForecast(dto: PriceForecastDto): ForecastPoint[] {
  return dto.points.map(point => ({ date: point.targetDate, price: point.predictedPrice, lower: point.lowerPrice, upper: point.upperPrice }))
    .toSorted((a, b) => a.date.localeCompare(b.date));
}
export function mapGuide(dto: PriceGuideDto | null): BuyingGuide | null {
  if (!dto) return null;
  const titles: Record<string, string> = { BUY_NOW: "지금 구매 추천", BUY_LATER: dto.buyAfterDays === null ? "조금 기다려보세요" : `${dto.buyAfterDays}일 뒤 구매 추천`, HOLD: "구매 판단 보류", STABLE: "가격 보합세" };
  return { title: titles[dto.recommendation] ?? "구매 가이드 확인",
    description: dto.expectedSaving === null ? "서버에서 제공한 구매 판단입니다." : `예상 절약액 ${dto.expectedSaving.toLocaleString("ko-KR")}원`,
    buyAfterDays: dto.buyAfterDays, expectedSaving: dto.expectedSaving, mape: dto.mape };
}
export function withForecast(item: LivePrice, points: ForecastPoint[], baseDate: string | null): LivePrice {
  const last = points.at(-1);
  // An empty successful forecast is absence, never a summary/demo fallback.
  return { ...item, baseDate, forecastPoints: points,
    forecastDate: last?.date ?? null, forecastPrice: last?.price ?? null,
    ...priceChanges(item.currentPrice, last?.price ?? null) };
}
export function mapDetail(dto: PriceDetailDto): LivePrice {
  return { ...withForecast(mapSummary(dto.item), mapForecast(dto.forecast), dto.forecast.baseDate), guide: mapGuide(dto.guide),
    forecastStatus: dto.forecast.status, dataFactors: mapDataFactors(dto.guide?.factors), aiSummary: mapAiSummary(dto.summary) };
}
