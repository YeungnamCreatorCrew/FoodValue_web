import type { PriceModelTrack } from "./dto";

/** 예측 모델 트랙 이름·설명. 서버·브라우저 둘 다에서 쓴다. */
export const TRACKS: { key: PriceModelTrack; label: string; about: string }[] = [
  { key: "ENSEMBLE", label: "머신러닝", about: "XGBoost·LightGBM·AutoARIMA 세 모델의 평균이에요." },
  { key: "STRUCT", label: "자체모델", about: "도매가 변화 전달, 소매·도매 배수 되돌림, 과거 같은 시기 흐름, 명절 효과를 식으로 더해 예측해요." },
];
export const trackLabel = (track: PriceModelTrack) => TRACKS.find(t => t.key === track)?.label ?? track;
/** URL ?model= 값 → 트랙. 모르는 값은 기본(앙상블). */
export const parseTrack = (value: string | string[] | null | undefined): PriceModelTrack =>
  (Array.isArray(value) ? value[0] : value)?.toUpperCase() === "STRUCT" ? "STRUCT" : "ENSEMBLE";
