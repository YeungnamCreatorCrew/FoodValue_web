/**
 * 판단 방식 화면 데이터. 지금 WAS API(목록·지표·요인·예측)만 쓴다.
 * - 지표 과거 검증: 지표 카드 evidence(서버가 2016년부터 다시 센 값)
 * - 모델별 7일 예측: 예측 응답 metrics.members(XGBOOST·LIGHTGBM·AUTOARIMA), metrics.ensemblePrices
 * - 품목별 과거 성적: 요인 응답 validation(앙상블 vs 직전 가격)
 */
import { pricesApi } from "@/lib/prices/api";
import { listPrices, getPriceFactors, getPriceIndicators } from "@/lib/prices/service";
import type { LivePrice, PriceIndicators } from "@/lib/prices/model";
import type { ValidationDto } from "@/lib/prices/dto";

export interface ModelForecast { horizon: number; targetDate: string | null; members: { key: string; price: number }[]; ensemble: number | null }
export interface AboutItem {
  item: LivePrice;
  indicators: PriceIndicators | null;
  validation: ValidationDto | null;
  evaluationStart: string | null;
  evaluationEnd: string | null;
  explained: boolean;
  /** 이번 예측에 쓰인 요인 묶음(PRICE·WEATHER·CALENDAR·MACRO). 데이터 출처 표에 쓴다. */
  categories: string[];
  forecast: ModelForecast | null;
}

const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
/** 모델 표시 순서와 이름. 응답에 없는 모델은 건너뛴다. */
export const MODEL_NAMES: Record<string, string> = { XGBOOST: "XGBoost", LIGHTGBM: "LightGBM", AUTOARIMA: "AutoARIMA" };

/** metrics.members: { 모델: [1일 뒤, …, 7일 뒤] }. 7일 뒤(마지막) 값만 쓴다. */
export function readModelForecast(metrics: Record<string, unknown> | null, targetDate: string | null): ModelForecast | null {
  const members = metrics?.members;
  if (!members || typeof members !== "object") return null;
  const rows = Object.keys(MODEL_NAMES).flatMap(key => {
    const values = (members as Record<string, unknown>)[key];
    const last = Array.isArray(values) ? num(values.at(-1)) : null;
    return last === null ? [] : [{ key, price: last }];
  });
  if (!rows.length) return null;
  const ensembleList = Array.isArray(metrics?.ensemblePrices) ? metrics.ensemblePrices as unknown[] : [];
  const ensemble = num(ensembleList.at(-1)) ?? rows.reduce((s, r) => s + r.price, 0) / rows.length;
  const first = (members as Record<string, unknown>)[rows[0].key];
  return { horizon: Array.isArray(first) ? first.length : 7, targetDate, members: rows, ensemble };
}

export async function loadAbout(): Promise<{ items: AboutItem[]; failed: boolean }> {
  try {
    const page = await listPrices({ size: 50, sort: "name" });
    const items = await Promise.all(page.items.slice(0, 12).map(async item => {
      const [indicators, factors, forecast] = await Promise.all([
        getPriceIndicators(item.id).catch(() => null),
        getPriceFactors(item.id).catch(() => null),
        pricesApi.forecast(item.id).catch(() => null),
      ]);
      const target = forecast?.points.toSorted((a, b) => a.targetDate.localeCompare(b.targetDate)).at(-1)?.targetDate ?? null;
      return {
        item, indicators, validation: factors?.validation ?? null,
        evaluationStart: factors?.validation?.evaluationStart ?? factors?.evaluationStart ?? null,
        evaluationEnd: factors?.validation?.evaluationEnd ?? factors?.evaluationEnd ?? null,
        explained: factors?.explained ?? false,
        categories: [...new Set(factors?.factors.map(f => f.category) ?? [])],
        forecast: readModelForecast(forecast?.metrics ?? null, target),
      } satisfies AboutItem;
    }));
    return { items, failed: false };
  } catch {
    return { items: [], failed: true };
  }
}

/**
 * 모델 선정 기록. WAS model_comparison/v2/RESULTS.md(2026-11-12~19) 검증 전체 244개 기준일 MAPE(10계열 평균).
 * 자주 바뀌지 않는 실험 기록이라 화면에 고정해 둔다. 바뀌면 이 표를 같이 고친다.
 */
export const MODEL_HISTORY = {
  source: "WAS model_comparison/v2/RESULTS.md",
  recordedAt: "2026-11-19",
  origins: 244,
  naive: 4.913,
  steps: [
    { date: "11.12", title: "XGBoost, 품목별로 따로 학습", mape: 4.716, note: "첫 기준 모델" },
    { date: "11.12", title: "XGBoost, 10개 계열을 한 번에 학습", mape: 4.658, note: "품목끼리 패턴을 나눠 배움" },
    { date: "11.17", title: "+ LightGBM 섞기 (두 모델 평균)", mape: 4.603, note: "서로 약한 품목을 메움" },
    { date: "11.18", title: "+ AutoARIMA 섞기 (세 모델 평균)", mape: 4.592, note: "가격 흐름만 보는 다른 방식" },
    { date: "11.19", title: "XGBoost 설정 다듬기", mape: 4.561, note: "지금 쓰는 모델", current: true },
  ],
  singles: [
    { name: "XGBoost (다듬은 설정)", mape: 4.613 },
    { name: "LightGBM", mape: 4.660 },
    { name: "AutoARIMA", mape: 4.851 },
    { name: "세 모델 평균 (지금)", mape: 4.561, current: true },
  ],
  rejected: [
    { name: "KREI 관측월보", result: "4.603% → 4.660%", why: "학습 기간 월보 패턴을 외워 오히려 나빠졌어요." },
    { name: "주산지 날씨 52주", result: "4.368% → 4.528% (튜닝 기준일 53개)", why: "날씨 이력으로 계절을 외우는 과적합이 생겼어요." },
    { name: "가락시장 반입량", result: "4.658% → 4.728%", why: "검증 전체에서 오차가 늘었어요." },
    { name: "Ridge 추가", result: "0.007%p 차이", why: "흔들림 범위(±0.01%p)보다 작아 효과라고 보기 어려웠어요." },
  ],
} as const;
