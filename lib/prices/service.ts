import { PriceApiError, pricesApi } from "./api";
import { mapDetail, mapForecast, mapIndicators, mapSummary } from "./mapper";
import type { PriceModelTrack } from "./dto";
import type { HistoryPeriod, PriceChartResult, PriceHistoryPeriod, PriceListPage, PriceListQuery, PricePoint } from "./model";
import { legacyIngredient, sameIngredientName } from "./identity";
import { mapFactorTrend, mapShapAnalysis } from "./shap";

export async function listPrices(query: PriceListQuery = {}, signal?: AbortSignal): Promise<PriceListPage> {
  const page = await pricesApi.list(query, signal);
  return { ...page, items: page.items.map(mapSummary) };
}
export async function getPrice(id: string, signal?: AbortSignal, track: PriceModelTrack = "ENSEMBLE") { return mapDetail(await pricesApi.detail(id, signal, track)); }
export async function getPriceChart(id: string, days: PriceHistoryPeriod, signal?: AbortSignal): Promise<PriceChartResult> {
  const [history, forecast] = await Promise.all([pricesApi.history(id, days, signal), pricesApi.forecast(id, signal)]);
  return { priceHistory: history.points.map(point => ({ date: point.date, price: point.price })), historyEndDate: history.endDate,
    forecast: mapForecast(forecast), forecastBaseDate: forecast.baseDate };
}
/** 가격 추이 그래프용 실제 가격만. 7일 예측은 상세 응답(getPrice)에 이미 있어서 기간을 바꿀 때 다시 부르지 않는다. */
export async function getPriceHistory(id: string, days: PriceHistoryPeriod, signal?: AbortSignal) {
  const history = await pricesApi.history(id, days, signal);
  return { priceHistory: history.points.map(point => ({ date: point.date, price: point.price })), historyEndDate: history.endDate };
}
/**
 * 여러 품목의 실제 가격 이력(id → 점 목록). WAS 묶음 이력 API 한 번으로 받는다.
 * 묶음 API가 없는 이전 WAS(/items/history를 품목 id로 읽어 400·404·422)면 품목마다 부르는 예전 방식으로 대신한다.
 * 받지 못한 품목은 결과에 없다.
 */
export async function getPriceHistories(ids: string[], days: PriceHistoryPeriod, signal?: AbortSignal): Promise<Map<string, PricePoint[]>> {
  if (!ids.length) return new Map();
  const pending = pricesApi.histories(ids, days, signal);  // 잘못된 id는 여기서 바로 던진다(예전 방식으로 대신하지 않음)
  try {
    const batch = await pending;
    return new Map(batch.items.map(history => [String(history.itemId), history.points.map(point => ({ date: point.date, price: point.price }))]));
  } catch (error) {
    if (!(error instanceof PriceApiError) || ![400, 404, 422].includes(error.status)) throw error;
    const rows = await Promise.all(ids.map(id => getPriceHistory(id, days, signal).then(h => [id, h.priceHistory] as const).catch(() => null)));
    return new Map(rows.filter(row => row !== null));
  }
}
/** Resolve old localStorage/demo slugs through returned catalog IDs, never a numeric guess. */
export async function resolveFavoriteId(id: string, signal?: AbortSignal): Promise<string | null> {
  if (id.startsWith("was:")) return id.slice(4);
  const legacy = legacyIngredient(id);
  if (!legacy) return null;
  const page = await listPrices({ keyword: legacy.name, size: 50 }, signal);
  const exact = page.items.filter(item => item.name === legacy.name);
  const matches = exact.length ? exact : page.items.filter(item => sameIngredientName(item.name, legacy));
  return matches.length === 1 ? matches[0].id : null;
}
export async function resolvePriceRoute(id: string, signal?: AbortSignal) {
  // Numeric routes now always mean the actual backend ID; old textual slugs can be resolved by name.
  return /^\d+$/.test(id) ? id : resolveFavoriteId(id, signal);
}
export async function getPriceFactors(id: string, signal?: AbortSignal, track: PriceModelTrack = "ENSEMBLE") { return mapShapAnalysis(await pricesApi.factors(id, signal, track)); }
export async function getFactorTrend(id: string, factorId: string, days: HistoryPeriod, signal?: AbortSignal, track: PriceModelTrack = "ENSEMBLE") {
  return mapFactorTrend(await pricesApi.factorHistory(id, factorId, days, signal, track));
}
export async function getPriceIndicators(id: string, signal?: AbortSignal) { return mapIndicators(await pricesApi.indicators(id, signal)); }
