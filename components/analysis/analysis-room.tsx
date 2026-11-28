import type { LivePrice, PriceIndicators, PricePoint, SeasonalCard } from "@/lib/prices/model";
import type { ShapAnalysis } from "@/lib/prices/shap";
import { longDate } from "@/lib/prices/format";
import { EmptyState } from "@/components/fv/state";
import { OverviewGrid } from "./overview-grid";
import { DataFlow } from "./data-flow";
import { JudgmentFlow, PercentileCalcs } from "./judgment-flow";
import { WhatIf } from "./what-if";
import { JudgmentCalendar } from "./judgment-calendar";
import { ForecastReceipt } from "./forecast-receipt";

export interface OverviewItem { item: LivePrice; history: PricePoint[] }

function Section({ id, step, title, lead, children }: { id: string; step: number; title: string; lead: string; children: React.ReactNode }) {
  return <section aria-labelledby={`${id}-title`} className="an-section">
    <header className="an-section-head">
      <span className="an-step" aria-hidden="true">{step}</span>
      <div><h2 id={`${id}-title`} className="fv-h2">{title}</h2><p className="fv-cap">{lead}</p></div>
    </header>
    {children}
  </section>;
}

export function AnalysisRoom({ overview, item, indicators, factors, history }: {
  overview: OverviewItem[]; item: LivePrice; indicators: PriceIndicators | null; factors: ShapAnalysis | null; history: PricePoint[];
}) {
  const seasonal = indicators?.cards.find((card): card is SeasonalCard => card.key === "SEASONAL") ?? null;
  const asOf = indicators?.asOfDate ?? item.priceDate;
  const noData = item.status === "NO_DATA" || !history.some(point => point.price !== null);
  return <main id="main-content" className="fv-page analysis-page">
    <header className="an-head">
      <p className="board-date">{asOf ? <><time dateTime={asOf}>{longDate(asOf)}</time> 기준</> : "기준일 정보 없음"}</p>
      <h1 className="fv-h1">분석실</h1>
      <p className="an-lead">판단과 AI 예측이 어떤 값으로, 어떤 계산을 거쳐 나왔는지 펼쳐 봐요. 숫자는 모두 지금 화면에 쓰는 데이터 그대로예요.</p>
    </header>

    <Section id="overview" step={1} title="품목 한눈에 보기" lead="최근 1년 가격과 지금 판단이에요. 품목을 누르면 아래 분석이 그 품목으로 바뀌어요.">
      <OverviewGrid rows={overview} selectedId={item.id} />
    </Section>

    {noData ? <EmptyState title={`${item.name}: 가격 기록 없음`}>최근 조사된 가격이 없어 분석할 수 없어요.</EmptyState> : <>
      <Section id="flow" step={2} title="데이터는 이렇게 흘러가요" lead={`${item.name}의 판단과 AI 예측이 어떤 데이터에서 나오는지예요. 판단에는 지난 가격만 쓰고, 예측은 참고로만 보여드려요.`}>
        <DataFlow item={item} indicators={indicators} factors={factors} history={history} />
      </Section>

      <Section id="judge" step={3} title="판단은 이렇게 나왔어요" lead="원자료에서 계산, 기준선 비교, 판단까지 한 단계씩 보여드려요.">
        {seasonal ? <JudgmentFlow card={seasonal} /> : <p className="fv-notice">{!indicators ? "판단 지표를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요."
          : indicators.cards.length === 0 ? indicators.notices[0]?.text ?? "이 품목은 지금 판단 지표가 없어요."
          : "이 품목은 평년 대비 판단이 없어요(과거 5년 가격이 모자라요)."}</p>}
        <PercentileCalcs cards={indicators?.cards ?? []} />
      </Section>

      <Section id="whatif" step={4} title="만약에 가격이 바뀌면?" lead="슬라이더로 가격을 움직이면 판단을 같은 규칙으로 바로 다시 계산해요. 어디서 판단이 바뀌는지 볼 수 있어요.">
        <WhatIf seasonal={seasonal} history={history} asOf={indicators?.asOfDate ?? null} unit={item.unit} />
      </Section>

      <Section id="calendar" step={5} title="지난 판단 달력과 성적표" lead="과거 주마다 평년 대비 판단을 다시 계산해 칠했어요. 그 판단 뒤 가격이 실제로 어떻게 움직였는지도 세어 봤어요.">
        {seasonal?.chart ? <JudgmentCalendar years={seasonal.chart.years} card={seasonal} /> : <p className="fv-notice">연도별 주 평균 가격이 없어 달력을 그릴 수 없어요.</p>}
      </Section>

      <Section id="receipt" step={6} title="AI 7일 예측 분해 (참고)" lead="모델의 출발점(기준값)에 요인별 영향을 더하면 예측가가 돼요. 영향은 모델 계산에 쓰인 값이고, 가격이 움직인 원인은 아니에요.">
        <ForecastReceipt item={item} factors={factors} />
      </Section>
    </>}

    <p className="fv-footnote">가격은 {item.source || "출처 정보 없음"} 전국 평균 소매가예요. 달력과 성적표는 주 평균 가격으로 다시 계산한 근사치라 서버 판단과 조금 다를 수 있어요. 판단 기준 숫자는 ‘판단 방식’ 화면과 같아요.</p>
  </main>;
}
