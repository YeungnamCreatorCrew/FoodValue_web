import type { LivePrice } from "./model";

/** 예측 방향의 보합 기준(%). WAS 구매 가이드(price_batch_service.guidance)의 ±3%와 같은 값이라 두 표시가 어긋나지 않는다. */
export const FORECAST_FLAT_PERCENT = 3;

export type ForecastDirection = NonNullable<LivePrice["forecastDirection"]>;

/** 예측 변화율(%)로 방향을 정한다. 기준 안이면 보합. 값이 없으면 null. */
export function classifyForecast(percent: number | null): ForecastDirection | null {
  if (percent === null || !Number.isFinite(percent)) return null;
  if (Math.abs(percent) < FORECAST_FLAT_PERCENT) return "flat";
  return percent > 0 ? "up" : "down";
}
