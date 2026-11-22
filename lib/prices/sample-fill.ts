// 화면 확인용 샘플 채우기. 실제 모델 결과가 아니다.
// - .env.local 에 NEXT_PUBLIC_SAMPLE_FILL=1 일 때만 켜지고(.env.local은 커밋되지 않는다), 서버가 "예측 없음(NO_FORECAST)"이라고 답한 품목만 채운다.
// - 값은 그 품목의 실제 최근 가격에서 품목 id로 고정된 규칙(무작위 아님)으로 만든다. quality "SAMPLE"로 표시해 화면에 샘플 안내가 뜬다.
// - 서버가 예측을 가진 품목(예: 대파)은 건드리지 않는다.
import type { FactorCategoryDto, PriceDetailDto, PriceFactorDto, PriceFactorsDto, PriceForecastDto, PriceSummaryDto } from "./dto";

export const SAMPLE_QUALITY = "SAMPLE";
export const SAMPLE_NOTE = "샘플 데이터입니다. 실제 AI 모델의 결과가 아니라 화면 확인용으로 채운 값입니다.";
export const sampleFillEnabled = () => process.env.NEXT_PUBLIC_SAMPLE_FILL === "1";

type Base = { itemId: number; currentPrice: number; priceDate: string };
const addDays = (date: string, days: number) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
/** 품목 id마다 다르지만 항상 같은 7일 총 변화율(-6% ~ +6%). */
const totalChange = (itemId: number) => ((itemId * 37) % 13 - 6) / 100;

export const baseOf = (item: PriceSummaryDto): Base | null =>
  item.currentPrice !== null && item.priceDate ? { itemId: item.id, currentPrice: item.currentPrice, priceDate: item.priceDate } : null;

export function sampleForecast(base: Base, summary: Pick<PriceSummaryDto, "market" | "seriesId">): PriceForecastDto {
  const total = totalChange(base.itemId);
  const points = Array.from({ length: 7 }, (_, index) => {
    const step = index + 1, predicted = Math.round(base.currentPrice * (1 + total * step / 7));
    const width = 0.04 + 0.01 * step; // 먼 날일수록 구간이 넓어진다
    return { targetDate: addDays(base.priceDate, step), predictedPrice: predicted, lowerPrice: Math.round(predicted * (1 - width)), upperPrice: Math.round(predicted * (1 + width)) };
  });
  return { itemId: base.itemId, market: summary.market, seriesId: summary.seriesId, status: "READY", baseDate: base.priceDate, dataDate: base.priceDate,
    modelRunId: null, modelName: "SAMPLE", modelVersion: "sample", quality: SAMPLE_QUALITY, points, metrics: null, latestAttemptStatus: null, updatedAt: null };
}

const sampleText = (name: string, change: number) => ({
  headline: `${SAMPLE_NOTE}`,
  detail: `화면 확인용 문장입니다. ${name}의 7일 뒤 값이 ${change >= 0 ? "소폭 오르는" : "소폭 내리는"} 것으로 가정해 채웠습니다.`,
  categories: {} as Record<string, string>, generator: "SAMPLE",
});

/** 목록·상세의 품목 요약에 예측 값을 채운다. */
export function fillSummary(item: PriceSummaryDto): PriceSummaryDto {
  const base = baseOf(item);
  if (!sampleFillEnabled() || !base || item.forecastPrice !== null || item.forecastBaseDate !== null) return item; // 서버에 예측이 없는 품목만
  const last = sampleForecast(base, item).points[6];
  return { ...item, quality: SAMPLE_QUALITY, forecastPrice: last.predictedPrice,
    forecastChangePercent: Math.round(totalChange(base.itemId) * 1000) / 10, forecastBaseDate: base.priceDate, forecastTargetDate: last.targetDate };
}

export function fillDetail(dto: PriceDetailDto): PriceDetailDto {
  const base = baseOf(dto.item);
  if (!sampleFillEnabled() || !base || dto.forecast.status !== "NO_FORECAST") return dto;
  const forecast = sampleForecast(base, dto.item);
  // 구매 가이드 샘플: 오르는 가정이면 "지금 구매", 내리는 가정이면 "3일 뒤 구매". 정확도(MAPE)는 가짜로 만들지 않고 비운다.
  const total = totalChange(base.itemId);
  const guide = dto.guide ?? { recommendation: total > 0 ? "BUY_NOW" : "BUY_LATER", buyAfterDays: total > 0 ? null : 3,
    expectedSaving: Math.abs(Math.round(base.currentPrice * total * 0.5)), mape: null, factors: [] };
  return { ...dto, item: fillSummary(dto.item), forecast, guide, summary: sampleText(dto.item.name, total) };
}

const PARTS: { category: string; label: string; share: number; factors: { id: string; label: string; unit: string; value: number }[] }[] = [
  { category: "PRICE", label: "가격", share: 0.5, factors: [
    { id: "SAMPLE_MEAN7", label: "최근 7일 평균 가격", unit: "원", value: 0 }, { id: "SAMPLE_COUNTER", label: "도매·소매 가격 관계", unit: "배", value: 0 }] },
  { category: "WEATHER", label: "날씨", share: 0.2, factors: [{ id: "SAMPLE_TEMP", label: "최근 7일 평균기온", unit: "℃", value: 11.4 }] },
  { category: "CALENDAR", label: "달력·계절", share: 0.2, factors: [{ id: "SAMPLE_SEASON", label: "계절 흐름", unit: "", value: 0.3 }] },
  { category: "MACRO", label: "생산량·환율", share: 0.1, factors: [{ id: "SAMPLE_FX", label: "원/달러 환율 변화(4주)", unit: "%", value: 1.2 }] },
];

/** 서버가 예측이 없다고 답한 품목의 변수별 영향 샘플. 영향 합계 = 샘플 예측값 - 기준 가격. */
export function fillFactors(dto: PriceFactorsDto, item: PriceSummaryDto): PriceFactorsDto {
  const base = baseOf(item);
  if (!sampleFillEnabled() || !base || dto.status !== "NO_FORECAST") return dto;
  const forecast = sampleForecast(base, item), predicted = forecast.points[6].predictedPrice, delta = predicted - base.currentPrice;
  const dir = (value: number) => value > 0 ? "UP" as const : value < 0 ? "DOWN" as const : "NEUTRAL" as const;
  // 영향이 한쪽으로만 쏠리지 않게 일부 범주는 반대 방향으로 두고, 합이 delta가 되도록 마지막 범주에서 맞춘다.
  const sign = [1, -0.4, 0.6, -0.2];
  const raw = PARTS.map((part, index) => Math.round(delta * part.share * sign[index] * 2.2));
  raw[0] += delta - raw.reduce((sum, value) => sum + value, 0);
  const categories: FactorCategoryDto[] = PARTS.map((part, index) => ({ category: part.category, label: part.label, contribution: raw[index], direction: dir(raw[index]),
    description: null }));
  const factors: PriceFactorDto[] = PARTS.flatMap((part, index) => part.factors.map((factor, order) => ({
    id: factor.id, label: factor.label, category: part.category, unit: factor.unit, previousValue: null, previousDate: null, hasHistory: false,
    value: factor.id === "SAMPLE_MEAN7" ? base.currentPrice : factor.id === "SAMPLE_COUNTER" ? 0.4 : factor.value,
    contribution: Math.round(raw[index] / part.factors.length) + (order === 0 ? raw[index] - Math.round(raw[index] / part.factors.length) * part.factors.length : 0),
    direction: dir(raw[index]) })));
  return { ...dto, status: "READY", explained: true, unavailableReason: null, baseDate: base.priceDate, modelName: "SAMPLE", method: "SAMPLE", horizonDays: 7,
    targetDate: forecast.points[6].targetDate, currentPrice: base.currentPrice, basePrice: base.currentPrice, predictedPrice: predicted,
    summary: sampleText(item.name, delta), categories, factors };
}
