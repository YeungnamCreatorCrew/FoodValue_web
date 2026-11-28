import Link from "next/link";
import type { LivePrice, PriceIndicators, PricePoint, SeasonalCard } from "@/lib/prices/model";
import type { ShapAnalysis } from "@/lib/prices/shap";
import { longDate } from "@/lib/prices/format";
import { EmptyState } from "@/components/fv/state";
import { DataFlow } from "./data-flow";
import { JudgmentFlow, PercentileCalcs } from "./judgment-flow";
import { WhatIf } from "./what-if";
import { RuleRecord } from "./rule-record";
import { ForecastReceipt } from "./forecast-receipt";


function Section({ id, step, title, lead, children }: { id: string; step: number; title: string; lead: string; children: React.ReactNode }) {
  return <section aria-labelledby={`${id}-title`} className="an-section">
    <header className="an-section-head">
      <span className="an-step" aria-hidden="true">{step}</span>
      <div><h2 id={`${id}-title`} className="fv-h2">{title}</h2><p className="fv-cap">{lead}</p></div>
    </header>
    {children}
  </section>;
}

/** 품목 고르기: 홈과 겹치는 작은 그래프 대신 버튼만. 고른 품목은 aria-current. */
function ItemPicker({ items, selectedId }: { items: LivePrice[]; selectedId: string }) {
  return <nav aria-label="분석할 품목" className="fv-chips an-picker">
    {items.map(item => <Link key={item.id} href={`/analysis?item=${item.id}`} scroll={false} prefetch={false} className="fv-chip" aria-current={item.id === selectedId ? "page" : undefined}>{item.name}</Link>)}
  </nav>;
}

export function AnalysisRoom({ items, item, indicators, factors, history }: {
  items: LivePrice[]; item: LivePrice; indicators: PriceIndicators | null; factors: ShapAnalysis | null; history: PricePoint[];
}) {
  const seasonal = indicators?.cards.find((card): card is SeasonalCard => card.key === "SEASONAL") ?? null;
  const asOf = indicators?.asOfDate ?? item.priceDate;
  const noData = item.status === "NO_DATA" || !history.some(point => point.price !== null);
  return <main id="main-content" className="fv-page analysis-page">
    <header className="an-head">
      <p className="board-date">{asOf ? <><time dateTime={asOf}>{longDate(asOf)}</time> 기준</> : "기준일 정보 없음"}</p>
      <h1 className="fv-h1">분석실</h1>
      <p className="an-lead">한 품목을 골라 판단과 AI 예측이 어떤 숫자로 계산됐는지 처음부터 따라가 봐요.</p>
      <ItemPicker items={items} selectedId={item.id} />
    </header>

    {noData ? <EmptyState title={`${item.name}: 가격 기록 없음`}>최근 조사된 가격이 없어 분석할 수 없어요.</EmptyState> : <>
      <Section id="flow" step={1} title="데이터는 이렇게 흘러가요" lead="판단에는 지난 가격만 쓰고, AI 예측은 참고로만 보여드려요.">
        <DataFlow item={item} indicators={indicators} factors={factors} history={history} />
      </Section>

      <Section id="judge" step={2} title="판단은 이렇게 나왔어요" lead="숫자를 기준선에 대 보고 판단해요. 과거에 같은 신호가 얼마나 맞았는지도 함께 보여드려요.">
        {seasonal ? <JudgmentFlow card={seasonal} /> : <p className="fv-notice">{!indicators ? "판단 지표를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요."
          : indicators.cards.length === 0 ? indicators.notices[0]?.text ?? "이 품목은 지금 판단 지표가 없어요."
          : "이 품목은 평년 대비 판단이 없어요(과거 5년 가격이 모자라요)."}</p>}
        <PercentileCalcs cards={indicators?.cards ?? []} />
        <RuleRecord cards={indicators?.cards ?? []} />
      </Section>

      {seasonal?.fact.normalAvg != null && seasonal.fact.recentAvg != null && <Section id="whatif" step={3} title="얼마면 싼 편일까요?" lead="슬라이더로 최근 4주 평균 가격을 움직이면, 같은 규칙으로 판단을 바로 다시 계산해요.">
        <WhatIf seasonal={seasonal} unit={item.unit} />
      </Section>}

      <Section id="receipt" step={seasonal?.fact.normalAvg != null ? 4 : 3} title="AI 7일 예측 분해 (참고)" lead="모델의 출발점(기준값)에 요인별 영향을 더하면 예측가가 돼요. 영향은 모델 계산에 쓰인 값이고, 가격이 움직인 원인은 아니에요.">
        <ForecastReceipt item={item} factors={factors} />
      </Section>
    </>}

    <p className="fv-footnote">가격은 {item.source || "출처 정보 없음"} 전국 평균 소매가예요. 판단 기준 숫자와 품목 전체의 검증 결과는 ‘판단 방식’ 화면에 있어요.</p>
  </main>;
}
