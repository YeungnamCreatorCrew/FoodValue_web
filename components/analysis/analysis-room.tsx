import type { LivePrice, PriceIndicators, PricePoint, PricePositionCard, SeasonalCard } from "@/lib/prices/model";
import type { ShapAnalysis } from "@/lib/prices/shap";
import { longDate } from "@/lib/prices/format";
import { lastYearPrices, seasonalState } from "@/lib/analysis/compute";
import { EmptyState } from "@/components/fv/state";
import { ItemPicker, type PickerItem } from "./item-picker";
import { AnalysisSummary, type JumpLink } from "./summary";
import { SeasonalExplain } from "./seasonal-explain";
import { PercentileCalcs, SEASONAL_LABEL } from "./judgment-flow";
import { PositionCard } from "./what-if";
import { JudgmentCalendar } from "./judgment-calendar";
import { ForecastReceipt } from "./forecast-receipt";
import { DataFlow } from "./data-flow";

function Section({ id, title, lead, children }: { id: string; title: string; lead: React.ReactNode; children: React.ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-title`} className="an-section">
    <header className="an-section-head">
      <h2 id={`${id}-title`} className="fv-h2">{title}</h2>
      <p className="fv-cap">{lead}</p>
    </header>
    {children}
  </section>;
}

/**
 * 분석실. 사용자가 실제로 묻는 순서로 놓는다:
 * 품목 고르기(검색·분류, 화면 위에 붙음) → 요약(지금 판단) → 왜 그 판단인가(평년 대비 계산 + 바꿔 보기) → 같이 볼 신호(판단에 안 씀)
 * → 이 판단 믿을 만한가(달력·성적표) → AI 예측 분해(참고) → 어떤 데이터를 쓰나(접힘).
 */
export function AnalysisRoom({ items, item, indicators, factors, history }: {
  items: LivePrice[]; item: LivePrice; indicators: PriceIndicators | null; factors: ShapAnalysis | null; history: PricePoint[];
}) {
  const seasonal = indicators?.cards.find((card): card is SeasonalCard => card.key === "SEASONAL") ?? null;
  const position = indicators?.cards.find((card): card is PricePositionCard => card.key === "PRICE_POSITION") ?? null;
  const asOf = indicators?.asOfDate ?? item.priceDate;
  const noData = item.status === "NO_DATA" || !history.some(point => point.price !== null);
  const state = seasonal?.state ?? (seasonal?.fact.diffRate != null ? seasonalState(seasonal.fact.diffRate) : null);
  // 1년 분포를 그릴 만큼 기록이 있으면 막대그래프 카드, 없으면 서버 값만으로 계산식 카드
  const showPosition = lastYearPrices(history, indicators?.asOfDate ?? null).length >= 30;
  const signalCards = <>
    {showPosition && <PositionCard history={history} asOf={indicators?.asOfDate ?? null} server={position} />}
    <PercentileCalcs cards={indicators?.cards ?? []} skip={showPosition ? ["PRICE_POSITION"] : []} />
  </>;
  const hasSignals = showPosition || (indicators?.cards ?? []).some(card => ["WHOLESALE_LEAD", "PRICE_POSITION", "RETAIL_WHOLESALE_GAP", "VOLATILITY"].includes(card.key));

  const forecastTitle = item.forecastBasis ? "7일 뒤 값은 왜 직전 가격이에요?" : "AI 7일 예측 (참고)";
  const whyTitle = state ? `왜 ‘${SEASONAL_LABEL[state]}’이에요?` : "평년 대비는 어떻게 계산하나요?";
  const jumps: JumpLink[] = noData ? [] : [
    { id: "why", label: whyTitle },
    ...(hasSignals ? [{ id: "signals", label: "같이 볼 신호" }] : []),
    ...(seasonal?.chart ? [{ id: "trust", label: "이 판단, 믿을 만해요?" }] : []),
    { id: "forecast", label: forecastTitle },
  ];

  return <main id="main-content" className="fv-page analysis-page">
    <header className="an-head">
      <p className="board-date">{asOf ? <><time dateTime={asOf}>{longDate(asOf)}</time> 기준</> : "기준일 정보 없음"}</p>
      <h1 className="fv-h1">분석실</h1>
      <p className="an-lead">품목을 고르면 지금 판단과 그 이유, 그 판단을 얼마나 믿어도 되는지를 차례로 보여드려요.</p>
    </header>

    <ItemPicker selectedId={item.id} items={items.map((row): PickerItem => ({ id: row.id, name: row.name, category: row.category, price: row.currentPrice,
      signal: row.listIndicators?.signals.find(s => s.key === "SEASONAL") ?? null }))} />

    {noData ? <EmptyState title={`${item.name}: 가격 기록 없음`}>최근 조사된 가격이 없어 분석할 수 없어요.</EmptyState> : <>
      <AnalysisSummary item={item} indicators={indicators} seasonal={seasonal} factors={factors} history={history} jumps={jumps} />

      <Section id="why" title={whyTitle} lead="최근 4주 평균을 평년 같은 시기와 비교해 정해요. 아래 슬라이더로 가격을 바꾸면 어디서 판단이 바뀌는지 볼 수 있어요.">
        {seasonal ? <SeasonalExplain card={seasonal} /> : <p className="fv-notice">{!indicators ? "판단 지표를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요."
          : indicators.cards.length === 0 ? indicators.notices[0]?.text ?? "이 품목은 지금 판단 지표가 없어요."
          : "이 품목은 평년 대비 판단이 없어요(과거 5년 가격이 모자라요)."}</p>}
      </Section>

      {hasSignals && <Section id="signals" title="같이 볼 신호" lead="위 판단에는 쓰지 않아요. 같은 가격을 다른 각도에서 본 값이라, 판단과 방향이 달라도 이상한 게 아니에요.">
        <div className="an-pcalcs">{signalCards}</div>
      </Section>}

      {seasonal?.chart && <Section id="trust" title="이 판단, 믿을 만해요?" lead="지난 주마다 같은 규칙으로 판단을 다시 계산해 칠하고, 그 뒤 가격이 실제로 어떻게 움직였는지 세어 봤어요.">
        <JudgmentCalendar years={seasonal.chart.years} card={seasonal} />
      </Section>}

      <Section id="forecast" title={forecastTitle} lead={item.forecastBasis
        ? "이 품목은 AI 예측 대신 직전 가격을 7일 뒤 값으로 보여드려요. 판단과 따로 보는 참고 값이고, 아래가 그렇게 정한 근거예요."
        : "판단과 따로 보는 참고 값이에요. 모델의 출발점(기준값)에 요인별 영향을 더하면 예측가가 돼요. 영향은 모델 계산에 쓰인 값이지, 가격이 움직인 원인은 아니에요."}>
        <ForecastReceipt item={item} factors={factors} />
      </Section>

      <details className="an-more">
        <summary>어떤 데이터로 계산하나요?</summary>
        <DataFlow item={item} indicators={indicators} factors={factors} history={history} />
      </details>
    </>}

    <p className="fv-footnote">가격은 {item.source || "출처 정보 없음"} 전국 평균 소매가예요. 달력과 성적표는 주 평균 가격으로 다시 계산한 근사치라 서버 판단과 조금 다를 수 있어요. 판단 기준은 홈의 지표 옆 (?) 도움말과 같아요.</p>
  </main>;
}
