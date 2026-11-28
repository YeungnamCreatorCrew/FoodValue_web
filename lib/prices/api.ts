import type { FactorHistoryDto, PriceDetailDto, PriceFactorsDto, PriceForecastDto, PriceHistoryDto, PriceIndicatorsDto, PriceModelTrack, PricePageDto, PriceSortDto } from "./dto";
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
const mockFlag = () => typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("mock");
const marketParams = () => new URLSearchParams({ market: "RETAIL" });
/** 기본(앙상블)은 예전과 같은 주소로 부르고, 구조식일 때만 model=STRUCT를 붙인다(WAS #73). */
const trackParams = (track: PriceModelTrack = "ENSEMBLE") => {
  const params = marketParams();
  if (track === "STRUCT") params.set("model", "STRUCT");
  return params;
};
/** #73 이전 WAS는 model을 모르고 앙상블을 그대로 준다. 그 값을 구조식이라고 보여주면 안 되니 막는다. */
function requireTrack<T extends { modelTrack?: PriceModelTrack }>(dto: T, track: PriceModelTrack): T {
  if (track === "STRUCT" && dto.modelTrack !== "STRUCT") throw new PriceApiError(501, "이 가격 서버는 구조식 모델을 아직 지원하지 않아요. WAS를 최신으로 받아 주세요.");
  return dto;
}
const sorts: Record<NonNullable<PriceListQuery["sort"]>, PriceSortDto> = { name: "name", "price-drop": "change", "forecast-drop": "forecast" };
export const pricesApi = {
  async list(query: PriceListQuery = {}, signal?: AbortSignal): Promise<PricePageDto> {
    const params = marketParams();
    if (query.category && query.category !== "ALL") params.set("category", query.category);
    if (query.keyword?.trim()) params.set("keyword", query.keyword.trim().slice(0, 50));
    params.set("sort", sorts[query.sort ?? "name"]);
    params.set("page", String(query.page ?? 1));
    params.set("size", String(Math.min(50, Math.max(1, query.size ?? 12))));
    const page = await get<PricePageDto>("", params, signal);
    // ?mock=indicators: 서버가 목록 지표를 아직 안 주면 mock으로 채운다(상세 지표 mock과 같은 스위치).
    if (mockFlag() === "indicators") {
      const { withMockListIndicators } = await import("@/mocks/priceListIndicators");
      return withMockListIndicators(page);
    }
    return page;
  },
  // 잘못된 id는 기다리지 않고 바로 던진다(itemPath를 먼저 부른다).
  detail(id: string, signal?: AbortSignal, track: PriceModelTrack = "ENSEMBLE") {
    return get<PriceDetailDto>(itemPath(id), trackParams(track), signal).then(dto => { requireTrack(dto.forecast, track); return dto; });
  },
  history(id: string, days: PriceHistoryPeriod, signal?: AbortSignal) {
    const params = marketParams(); params.set("days", String(days));
    return get<PriceHistoryDto>(`${itemPath(id)}/history`, params, signal);
  },
  forecast(id: string, signal?: AbortSignal, track: PriceModelTrack = "ENSEMBLE") {
    return get<PriceForecastDto>(`${itemPath(id)}/forecast`, trackParams(track), signal).then(dto => requireTrack(dto, track));
  },
  factors(id: string, signal?: AbortSignal, track: PriceModelTrack = "ENSEMBLE") {
    return get<PriceFactorsDto>(`${itemPath(id)}/factors`, trackParams(track), signal).then(dto => requireTrack(dto, track));
  },
  /** 요인 id에는 밑줄이 들어간다(v2 nat_temp_mean7, 구조식 counter_change7). WAS #73과 같은 규칙. */
  factorHistory(id: string, factorId: string, days: HistoryPeriod, signal?: AbortSignal, track: PriceModelTrack = "ENSEMBLE") {
    if (!/^[A-Za-z0-9_]{1,40}$/.test(factorId)) throw new PriceApiError(404, "올바른 요인 ID가 아닙니다.");
    const params = trackParams(track); params.set("days", String(days));
    return get<FactorHistoryDto>(`${itemPath(id)}/factors/${factorId}/history`, params, signal);
  },
  /**
   * WAS GET /prices/items/{id}/indicators. 브라우저 주소에 ?mock=indicators|empty|error 가 있으면 프로토타입 mock을 쓴다
   * (WAS 없이 화면을 볼 때, 빈/오류 화면 확인용). 그 밖에는 실제 API다.
   * mock은 동적 import라 서버 번들과 scripts/check-prices.mjs에 섞이지 않는다.
   */
  async indicators(id: string, signal?: AbortSignal): Promise<PriceIndicatorsDto> {
    const path = itemPath(id);
    const mock = mockFlag();
    if (mock === "indicators" || mock === "empty" || mock === "error") {
      const { fetchMockIndicators } = await import("@/mocks/priceIndicatorsServer");
      const dto = await fetchMockIndicators(Number(path.slice(1)));
      if (signal?.aborted) throw new PriceApiError(0, "요청이 취소되었습니다.");
      return dto;
    }
    return get<PriceIndicatorsDto>(`${path}/indicators`, marketParams(), signal);
  },
};
