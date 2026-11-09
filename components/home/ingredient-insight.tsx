import type { IngredientHomeData } from "@/lib/home/ingredient-data";

export function IngredientInsight({ data }: { data: IngredientHomeData }) {
  const { item, insight } = data;
  return <section className="home-factor-panel" aria-label={`${item.name} AI 분석 요약`}>
    <p className="home-eyebrow">AI INSIGHT · {item.name} · MOCK</p>
    <h2>기존 SHAP 예시 분석</h2>
    {insight.factors.length ? <div className="factor-summary-grid">{insight.factors.map((factor, index) => <article key={`${factor.title}-${index}`} className="factor-category-card">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3>{factor.title}</h3><span className={`price-direction ${factor.direction === "down" ? "price-down" : factor.direction === "up" ? "price-up" : "bg-slate-100 text-slate-600"}`}>{factor.direction === "down" ? "하락 방향" : factor.direction === "up" ? "상승 방향" : "중립"}</span></div>
      <p>{factor.description}</p>
    </article>)}</div> : <p className="mt-4 text-sm text-muted">이 품목의 SHAP mock 예시가 없습니다.</p>}
    <p className="factor-caveat">기존 mock SHAP을 범주별로 합산한 예시입니다. 실제 가격 API의 예측 요인 설명이 아니며 인과관계를 뜻하지 않습니다.</p>
  </section>;
}
