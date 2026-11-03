"use client";

import { useState } from "react";
import { factorSummary } from "@/lib/prices/poc-data";
import type { PriceRecord } from "@/lib/prices/poc-types";
import { formatDate, formatFactorValue, formatNumber } from "@/lib/prices/format";
import { compareFactorWeek } from "@/lib/prices/history";
import { FactorHistoryChart } from "./factor-history-chart";

export function PriceFactorSummary({ item, compact = false }: { item: PriceRecord; compact?: boolean }) {
  const groups = factorSummary(item);
  return <section className={compact ? "home-factor-panel" : "price-panel factor-summary-panel"} aria-label="AI 분석 요약">
    <p className="home-eyebrow">AI INSIGHT · {item.name}</p>
    <h2>{item.forecastDirection === "down" ? "AI는 왜 가격 하락을 예상했나요?" : "AI는 가격 흐름을 어떻게 해석했나요?"}</h2>
    {groups.length ? <div className="factor-summary-grid">{groups.map(group => <article key={group.category} className="factor-category-card">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3>{group.label}</h3><span className={`price-direction ${group.direction === "down" ? "price-down" : "price-up"}`}>{group.direction === "down" ? "하락" : "상승"} 방향</span></div>
      <p>{group.label}은 이번 모델 예측에서 가격을 {group.direction === "down" ? "낮추는" : "높이는"} 방향으로 작용했습니다.</p>
    </article>)}</div> : <p className="mt-4 text-sm text-muted">이 DEMO 품목은 실제 AI 분석 요인이 연결되지 않았습니다.</p>}
    <p className="factor-caveat">제공된 요인들의 SHAP 값을 범주별로 합산한 설명입니다. 인과관계를 뜻하지 않으며, 표시된 요인의 합은 현재가 대비 변동액과 다를 수 있습니다.</p>
  </section>;
}

export function PriceFactorAccordion({ item }: { item: PriceRecord }) {
  const ordered = [...item.factors.filter(factor => factor.category === "weather"), ...item.factors.filter(factor => factor.category === "price")];
  const [expanded, setExpanded] = useState<string | null>(ordered[0]?.id ?? null);
  const [category, setCategory] = useState<"all" | "weather" | "price">("all");
  const maximum = Math.max(1, ...item.factors.map(factor => Math.abs(factor.shapValue)));
  const visible = ordered.filter(factor => category === "all" || factor.category === category);
  return <section className="dashboard-factors" aria-labelledby="factor-details-title">
    <div className="dashboard-factor-heading"><h2 id="factor-details-title">예측에 영향을 준 요인</h2><div className="factor-filter" role="group" aria-label="영향 요인 분류">{([{ key: "all", label: "전체" }, { key: "weather", label: "날씨" }, { key: "price", label: "가격" }] as const).map(filter => <button key={filter.key} type="button" aria-pressed={category === filter.key} onClick={() => { setCategory(filter.key); if (filter.key !== "all" && !item.factors.some(factor => factor.id === expanded && factor.category === filter.key)) setExpanded(null); }}>{filter.label}</button>)}</div></div>
    <div className="dashboard-factor-columns" aria-hidden="true"><span>요인</span><span>현재 상태</span><span>예측에 미친 영향 <small>← 하락 · 0 · 상승 →</small></span><span>상태</span><span /></div>
    {visible.map(factor => {
      const open = expanded === factor.id;
      const down = factor.direction === "down";
      const comparison = factor.historyKey ? compareFactorWeek(item.factorHistory, item.baseDate, factor.historyKey) : null;
      const difference = comparison ? Number(comparison.difference.toFixed(2)) : null;
      return <div key={factor.id} className="dashboard-factor-row">
        <h3><button type="button" id={`factor-${factor.id}`} aria-expanded={open} aria-controls={`factor-content-${factor.id}`} className="dashboard-factor-toggle" onClick={() => setExpanded(open ? null : factor.id)}>
          <span className="dashboard-factor-name">{factor.label}</span>
          <span className="dashboard-factor-value"><strong>{formatFactorValue(factor.value, factor.unit)}</strong>{difference !== null && <small>7일 전 대비 {difference > 0 ? "+" : ""}{formatNumber(difference, 2)}{factor.unit}</small>}</span>
          <span className="dashboard-factor-impact"><span className="shap-bar" aria-hidden="true"><i className="shap-zero" /><i className={down ? "shap-down" : "shap-up"} style={{ width: `${Math.abs(factor.shapValue) / maximum * 48}%`, [down ? "right" : "left"]: "50%" }} /></span><strong className={down ? "text-blue-700" : "text-red-600"}>{factor.shapValue > 0 ? "+" : ""}{formatNumber(factor.shapValue, 1)}원</strong></span>
          <span className={`dashboard-factor-badge ${down ? "is-down" : "is-up"}`}>{down ? "하락" : "상승"} 요인</span>
          <svg className={`dashboard-factor-chevron ${open ? "is-open" : ""}`} viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 7 5 5 5-5" /></svg>
        </button></h3>
        <div id={`factor-content-${factor.id}`} role="region" aria-labelledby={`factor-${factor.id}`} hidden={!open}>
          {open && <div className="dashboard-factor-expanded"><FactorHistoryChart factor={factor} item={item} /><div className="dashboard-factor-interpretation"><h4>요인 해석</h4><p>{factor.label}은 이번 모델의 7일 후 가격 예측에서 <strong className={down ? "text-blue-700" : "text-red-600"}>가격을 {down ? "낮추는" : "높이는"} 방향</strong>으로 작용했습니다.</p>{comparison && <p className="factor-comparison-detail">{formatDate(comparison.previousDate)}의 동일 지표 {formatFactorValue(comparison.previous, factor.unit)}에서 현재 {formatFactorValue(comparison.current, factor.unit)}로 변했습니다.</p>}<p className="factor-interpretation-note">SHAP {factor.shapValue > 0 ? "+" : ""}{formatNumber(factor.shapValue, 1)}원은 모델 예측에 대한 기여입니다. 실제 가격 변동액이나 인과관계를 뜻하지 않습니다.</p></div></div>}
        </div>
      </div>;
    })}
    {!visible.length && <p className="dashboard-factor-empty">이 분류의 분석 요인이 없습니다.</p>}
    <p className="dashboard-factor-note">SHAP은 모델 예측에 대한 기여입니다. 비교값은 기준일과 정확히 7일 전의 동일 지표를 비교합니다.</p>
  </section>;
}
