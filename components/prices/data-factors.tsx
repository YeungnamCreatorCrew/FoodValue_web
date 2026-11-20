import { Fragment } from "react";
import { sourceLabel, type DataFactor } from "@/lib/prices/factors";
import { formatDate, formatNumber } from "@/lib/prices/format";
import type { LivePrice } from "@/lib/prices/model";

const caveat = "AI 예측에 입력으로 쓰인 최근 관측값과 모델 정보입니다. 가격을 올리거나 내린 원인(기여도)을 뜻하지 않습니다.";

function UsageBadge({ factor }: { factor: DataFactor }) {
  if (factor.kind === "MODEL" || factor.usedByModel === null) return null;
  return <span className={`price-direction ${factor.usedByModel ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
    {factor.usedByModel ? "모델에 반영" : "모델 미반영"}{factor.modelWeight !== null ? ` · 가중치 ${formatNumber(factor.modelWeight, 2)}` : ""}
  </span>;
}

function FactorCard({ factor }: { factor: DataFactor }) {
  const meta = [sourceLabel(factor.source), factor.dataDate ? `관측일 ${formatDate(factor.dataDate)}` : null].filter(Boolean).join(" · ");
  return <article className="factor-category-card">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3>{factor.name}</h3><UsageBadge factor={factor} /></div>
    {factor.facts.length > 0 && <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
      {factor.facts.map(fact => <Fragment key={fact.label}><dt className="text-muted">{fact.label}</dt><dd className="text-right font-semibold">{fact.value}</dd></Fragment>)}
    </dl>}
    {factor.weights.length > 0 && <ul className="mt-3 flex flex-col gap-2 text-[13px]" aria-label="자료 묶음별 결합 가중치">
      {factor.weights.map(weight => <li key={weight.label} className="grid grid-cols-[minmax(0,1fr)_88px_40px] items-center gap-2">
        <span>{weight.label}</span>
        <span className="h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true"><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${weight.weight * 100}%` }} /></span>
        <span className="text-right font-semibold">{formatNumber(weight.weight, 2)}</span>
      </li>)}
    </ul>}
    {factor.description && <p>{factor.description}</p>}
    {meta && <p className="text-xs text-muted" style={{ marginTop: 8 }}>{meta}</p>}
  </article>;
}

/** WAS guide.factors only. No SHAP, contribution or up/down direction is shown or derived. */
export function DataFactorPanel({ item, variant }: { item: LivePrice; variant: "detail" | "home" }) {
  const factors = item.dataFactors;
  const empty = <p className="mt-4 text-sm text-muted">아직 제공된 분석 정보가 없습니다. AI 예측이 만들어지면 함께 표시됩니다.</p>;
  const grid = factors.length ? <div className="factor-summary-grid">{factors.map(factor => <FactorCard key={factor.key} factor={factor} />)}</div> : empty;
  if (variant === "home") return <section className="home-factor-panel" aria-label={`${item.name} 예측에 사용된 데이터`}>
    <p className="home-eyebrow">AI INSIGHT · {item.name}</p>
    <h2>예측에 사용된 데이터</h2>
    {grid}
    <p className="factor-caveat">{caveat}</p>
  </section>;
  return <section className="dashboard-factors" aria-labelledby="data-factors-title">
    <div className="dashboard-factor-heading"><h2 id="data-factors-title">예측에 사용된 데이터</h2></div>
    <div className="px-5 pb-5">{grid}</div>
    <p className="dashboard-factor-note">{caveat}</p>
  </section>;
}
