import { PriceApiError, pricesApi } from "@/lib/prices/api";
import type { PriceHistoryDto } from "@/lib/prices/dto";

type Request = { id: string; resolve: (value: PriceHistoryDto) => void; reject: (error: unknown) => void };
const cache = new Map<string, Promise<PriceHistoryDto>>();
let pending: Request[] = [];

async function flush() {
  const requests = pending;
  pending = [];
  try {
    const response = await pricesApi.histories(requests.map(request => request.id), 90);
    const histories = new Map(response.items.map(history => [String(history.itemId), history]));
    for (const request of requests) {
      const history = histories.get(request.id);
      if (history) request.resolve(history);
      else request.reject(new Error("가격 이력 없음"));
    }
  } catch (error) {
    if (error instanceof PriceApiError && [400, 404, 422].includes(error.status)) {
      // Older WAS: keep individual requests to three concurrent DB connections.
      const queue = [...requests];
      await Promise.all(Array.from({ length: Math.min(3, queue.length) }, async () => {
        let request;
        while ((request = queue.shift())) {
          try { request.resolve(await pricesApi.history(request.id, 90)); }
          catch (failure) { request.reject(failure); }
        }
      }));
    } else {
      for (const request of requests) request.reject(error);
    }
  }
}

/** Coalesce the visible rows into one request; sorting/filtering reuses resolved histories. */
export function history90(id: string): Promise<PriceHistoryDto> {
  const hit = cache.get(id);
  if (hit) return hit;
  const result = new Promise<PriceHistoryDto>((resolve, reject) => {
    pending.push({ id, resolve, reject });
    if (pending.length === 1) queueMicrotask(() => { void flush(); });
  });
  cache.set(id, result);
  void result.catch(() => cache.delete(id));
  return result;
}
