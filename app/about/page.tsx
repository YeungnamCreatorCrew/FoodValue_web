import type { Metadata } from "next";
import { loadAbout } from "@/lib/about/data";
import { longDate } from "@/lib/prices/format";
import { RuleCards } from "@/components/about/rule-cards";
import { EvidenceDetail, EvidenceSummary } from "@/components/about/evidence";
import { ItemPerformance, ModelCompare, ModelHistory, ModelStructure } from "@/components/about/models";
import { SourceMatrix } from "@/components/about/sources";

export const metadata: Metadata = { title: "판단 방식 | FoodValue" };

/**
 * 판단 방식 = 품목과 상관없는 '규칙서': 어떤 규칙인지, 믿을 만한지(과거 검증), AI 모델은 무엇이고 어떻게 골랐는지, 어떤 자료를 쓰는지.
 * 품목별 실제 계산은 분석실(/analysis)이 맡는다.
 */
function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return <section aria-labelledby={`${id}-title`} className="about-section">
    <div><h2 id={`${id}-title`} className="fv-h2">{title}</h2>{lead && <p className="ab-lead fv-cap">{lead}</p>}</div>
    {children}
  </section>;
}

export default async function AboutPage() {
  const { items, failed } = await loadAbout();
  const date = items.reduce<string | null>((best, row) => row.item.priceDate && (!best || row.item.priceDate > best) ? row.item.priceDate : best, null);
  return <main id="main-content" className="fv-page about-page">
    <header className="about-head">
      <p className="board-date">{date ? <><time dateTime={date}>{longDate(date)}</time> 기준</> : "기준일 정보 없음"}</p>
      <h1 className="fv-h1">판단 방식</h1>
      <p className="about-lead">FoodValue는 지난 가격 지표로 싼 편·비싼 편을 판단해요. AI 7일 예측은 판단에 쓰지 않고 참고로만 보여드려요. 품목별 실제 계산은 분석실에서 볼 수 있어요.</p>
    </header>

    <Section id="rules" title="지표와 판단 기준" lead="눈금자는 기준선 위치를 보여 주는 그림이에요. 품목마다 지금 어디에 있는지는 분석실에서 볼 수 있어요.">
      <RuleCards firstItemId={items[0]?.item.id ?? null} />
    </Section>

    <Section id="trust" title="이 기준은 믿을 만한가요?" lead="감으로 정한 기준이 아니에요. 과거 가격 기록에서 ‘신호가 나온 뒤 실제로 그렇게 됐나’를 세어, 신호가 없을 때(평소)와 비교했어요.">
      {failed ? <p className="fv-notice">지금은 검증 기록을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p> : <>
        <EvidenceSummary items={items} />
        <details className="ab-fold"><summary>품목별로 보기</summary><EvidenceDetail items={items} /></details>
      </>}
    </Section>

    <Section id="model" title="AI 7일 예측은 이렇게 만들어요" lead="판단에는 쓰지 않는 참고 값이에요. 중요한 건 실제로 얼마나 맞았는지예요.">
      <ModelStructure />
      <h3 className="ab-sub">품목별로 실제로 얼마나 맞았나요?</h3>
      {failed ? <p className="fv-notice">지금은 품목별 검증 결과를 불러오지 못했어요.</p> : <ItemPerformance items={items} />}
      <details className="ab-fold"><summary>모델을 고른 과정과 이번 예측의 모델별 값 보기</summary>
        <h3 className="ab-sub">모델을 고른 과정</h3>
        <ModelHistory />
        <h3 className="ab-sub">이번 예측, 모델마다 얼마나 달랐나</h3>
        {failed ? <p className="fv-notice">지금은 이번 예측을 불러오지 못했어요.</p> : <ModelCompare items={items} />}
      </details>
      <p className="fv-cap">상세의 예측 요인(SHAP)은 모델 계산에 쓰인 값이에요. 가격이 움직인 원인은 아니에요.</p>
    </Section>

    <Section id="data" title="데이터는 어디서 오나요?">
      <SourceMatrix items={items} />
      <ul className="about-list">
        <li>각 화면 위쪽에 기준일이 있어요. 최신 가격이 늦게 들어오면 이전 기준일 값이라고 알려드려요.</li>
        <li>작형(품종)이 막 바뀐 직후엔 지표를 잠시 쉬고 이유를 적어 둬요.</li>
      </ul>
    </Section>
  </main>;
}
