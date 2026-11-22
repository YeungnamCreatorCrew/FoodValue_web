"use client";

import type { ReactNode } from "react";
import type { LivePrice } from "@/lib/prices/model";
import { usePriceFactors } from "@/lib/prices/use-prices";
import { ShapFactorView } from "./shap-factors";

const BASELINE_NOTE = "모델이 직전 가격 유지보다 낫지 않아 기준값을 보여줍니다.";

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
      {baseline && <p className="model-opinion-baseline" role="note">{BASELINE_NOTE}</p>}
    </div>
    <div className="model-opinion-body">
      {children}
      <ShapFactorView item={item} {...factors} hideReason={Boolean(baseline)} />
    </div>
  </div>;
}
