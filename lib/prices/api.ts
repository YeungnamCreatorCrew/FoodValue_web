import type { FactorHistoryDto, PriceDetailDto, PriceFactorsDto, PriceForecastDto, PriceHistoryDto, PriceIndicatorsDto, PricePageDto, PriceSortDto } from "./dto";
import type { PriceListQuery, HistoryPeriod, PriceHistoryPeriod } from "./model";

// Uvicorn's default port; override before next dev/build for another WAS host.
const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
const prefix = "/api/v1/prices/items";
export class PriceApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "PriceApiError"; }
}
async function get<T>(path: string, params: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(15000);
  try {
    const response = await fetch(`${baseUrl}${prefix}${path}?${params}`, {
      cache: "no-store", signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!response.ok) throw new PriceApiError(response.status, response.status === 404
      ? "시세 제공 품목을 찾을 수 없습니다." : `가격 정보를 불러오지 못했습니다. (${response.status})`);
    return await response.json() as T;
  } catch (error) {
    if (signal?.aborted || error instanceof PriceApiError) throw error;
    throw new PriceApiError(0, "가격 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
  }
}
function itemPath(id: string) {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) throw new PriceApiError(404, "올바른 품목 ID가 아닙니다.");
  return `/${id}`;
}
const marketParams = () => new URLSearchParams({ market: "RETAIL" });
const sorts: Record<NonNullable<PriceListQuery["sort"]>, PriceSortDto> = { name: "name", "price-drop": "change", "forecast-drop": "forecast" };
export const pricesApi = {
  list(query: PriceListQuery = {}, signal?: AbortSignal) {
    const params = marketParams();
    if (query.category && query.category !== "ALL") params.set("category", query.category);
    if (query.keyword?.trim()) params.set("keyword", query.keyword.trim().slice(0, 50));
    params.set("sort", sorts[query.sort ?? "name"]);
    params.set("page", String(query.page ?? 1));
    params.set("size", String(Math.min(50, Math.max(1, query.size ?? 12))));
    return get<PricePageDto>("", params, signal);
  },
  detail(id: string, signal?: AbortSignal) { return get<PriceDetailDto>(itemPath(id), marketParams(), signal); },
  history(id: string, days: PriceHistoryPeriod, signal?: AbortSignal) {
    const params = marketParams(); params.set("days", String(days));
    return get<PriceHistoryDto>(`${itemPath(id)}/history`, params, signal);
  },
  forecast(id: string, signal?: AbortSignal) { return get<PriceForecastDto>(`${itemPath(id)}/forecast`, marketParams(), signal); },
  factors(id: string, signal?: AbortSignal) { return get<PriceFactorsDto>(`${itemPath(id)}/factors`, marketParams(), signal); },
  factorHistory(id: string, factorId: string, days: HistoryPeriod, signal?: AbortSignal) {
    if (!/^[A-Za-z0-9]{1,40}$/.test(factorId)) throw new PriceApiError(404, "올바른 요인 ID가 아닙니다.");
    const params = marketParams(); params.set("days", String(days));
    return get<FactorHistoryDto>(`${itemPath(id)}/factors/${factorId}/history`, params, signal);
  },
  /**
   * DRAFT contract; WAS has no /indicators yet, so this reads the mock server.
   * When the API ships, replace the body with: return get<PriceIndicatorsDto>(`${itemPath(id)}/indicators`, marketParams(), signal);
   * The lazy import keeps the mock (and its @/ imports) out of server bundles and out of scripts/check-prices.mjs.
   */
  async indicators(id: string, signal?: AbortSignal): Promise<PriceIndicatorsDto> {
    const path = itemPath(id);
    const { fetchMockIndicators } = await import("@/mocks/priceIndicatorsServer");
    const dto = await fetchMockIndicators(Number(path.slice(1)));
    if (signal?.aborted) throw new PriceApiError(0, "요청이 취소되었습니다.");
    return dto;
  },
};
