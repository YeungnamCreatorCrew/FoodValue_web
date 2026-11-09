import type { IngredientHomeData } from "@/lib/home/ingredient-data";

export function IngredientInsight({ data }: { data: IngredientHomeData }) {
  const { item, insight } = data;
  return <section className="home-factor-panel" aria-label={`${item.name} AI 분석 요약`}>
    <p className="home-eyebrow">AI INSIGHT · {item.name}</p>
    <h2>{item.forecastDirection === "down" ? "AI는 왜 가격 하락을 예상했나요?" : "AI는 가격 흐름을 어떻게 해석했나요?"}</h2>
    {insight.factors.length ? <div className="factor-summary-grid">{insight.factors.map((factor, index) => <article key={`${factor.title}-${index}`} className="factor-category-card">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3>{factor.title}</h3><span className={`price-direction ${factor.direction === "down" ? "price-down" : factor.direction === "up" ? "price-up" : "bg-slate-100 text-slate-600"}`}>{factor.direction === "down" ? "하락 방향" : factor.direction === "up" ? "상승 방향" : "중립"}</span></div>
      <p>{factor.description}</p>
    </article>)}</div> : <p className="mt-4 text-sm text-muted">{item.isDemo ? "이 예시 품목은 실제 AI 분석 요인이 연결되지 않았습니다." : "이 품목의 AI 분석 요인은 준비 중입니다."}</p>}
    <p className="factor-caveat">제공된 요인들의 SHAP 값을 범주별로 합산한 설명입니다. 인과관계를 뜻하지 않으며, 표시된 요인의 합은 현재가 대비 변동액과 다를 수 있습니다.</p>
  </section>;
}
