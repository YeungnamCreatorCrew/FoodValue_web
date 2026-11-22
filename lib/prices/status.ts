import type { LivePrice } from "./model";
import { SAMPLE_NOTE, SAMPLE_QUALITY } from "./sample-fill";

type StatusSource = Pick<LivePrice, "status" | "quality"> & Partial<Pick<LivePrice, "forecastStatus">>;

/** WAS item/forecast status → short Korean notices. Unknown statuses produce no notice. */
export function priceNotices(item: StatusSource): string[] {
  if (item.status === "NO_DATA") return ["최근 관측된 가격이 없어 시세와 예측을 표시할 수 없습니다."];
  const notices: string[] = [];
  if (item.status === "STALE" || item.forecastStatus === "STALE") notices.push("최신 정보가 갱신되지 않아 이전 기준일의 가격·예측입니다.");
  if (item.forecastStatus === "INSUFFICIENT_DATA") notices.push("가격 데이터가 부족해 AI 예측을 만들지 못했습니다.");
  else if (item.status === "NO_FORECAST" || item.forecastStatus === "NO_FORECAST") notices.push("아직 이 품목의 AI 예측이 없습니다.");
  if (item.quality === SAMPLE_QUALITY) notices.push(SAMPLE_NOTE);
  if (item.status === "BASELINE" || item.quality === "BASELINE") notices.push("최근 과거 검증에서 AI 모델이 직전 가격 유지보다 정확하지 않아, 예측값은 직전 가격을 그대로 둔 값입니다.");
  return notices;
}

/** Why the forecast summary is empty, for the place where a predicted price would be. */
export function missingForecastReason(item: StatusSource): string {
  if (item.status === "NO_DATA") return "최근 관측된 가격이 없어 AI 예측을 표시할 수 없습니다.";
  if (item.forecastStatus === "INSUFFICIENT_DATA") return "가격 데이터가 부족해 AI 예측을 만들지 못했습니다.";
  return "아직 이 품목의 AI 예측이 없습니다.";
}
