"use client";

import type { ReactNode } from "react";
import type { LivePrice } from "@/lib/prices/model";
import { usePriceFactors } from "@/lib/prices/use-prices";
import { ShapFactorView } from "./shap-factors";

const shortDate = (value: string) => value.slice(5).replace("-", "/");
/** 모델 채택은 과거 검증으로 정한다. 미래를 안다는 뜻이 아니므로 검증 기간을 밝히고 앞날은 알 수 없다고 적는다. */
function baselineNote(start: string | null, end: string | null) {
  const period = start && end ? `최근 과거 검증(${shortDate(start)}~${shortDate(end)})에서` : "최근 과거 검증에서";
  return `${period} 이 모델이 직전 가격 유지보다 정확하지 않아, 직전 가격을 그대로 보여줍니다. 앞으로도 그럴지는 알 수 없습니다.`;
}

/**
 * "모델 의견" tab panel: a short caveat, then the existing 7-day forecast metrics, chart, AI summary and factor panels.
 * It mounts when the tab is first selected (see PriceIndicators).
 * explained=false because the trained model lost to the baseline (BASELINE_MODEL) is stated up front.
 * Whether to hide this view for such items is a pending team decision, so it stays available.
 */
export function ModelOpinion({ item, children }: { item: LivePrice; children: ReactNode }) {
  const factors = usePriceFactors(item.id);
  const baseline = !factors.loading && !factors.error && factors.data && !factors.data.explained && factors.data.unavailableReason === "BASELINE_MODEL";
  return <div className="model-opinion">
    <div className="model-opinion-card">
      <p className="model-opinion-intro">AI 모델의 7일 예측입니다. 판단 근거와 달리 예측값이라 참고로만 봐 주세요.</p>
      {baseline && <p className="model-opinion-baseline" role="note">{baselineNote(factors.data?.evaluationStart ?? null, factors.data?.evaluationEnd ?? null)}</p>}
    </div>
    <div className="model-opinion-body">
      {children}
      <ShapFactorView item={item} {...factors} hideReason={Boolean(baseline)} />
    </div>
  </div>;
}
