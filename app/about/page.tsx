import type { Metadata } from "next";
import Link from "next/link";
import { getPrice, listPrices } from "@/lib/prices/service";
import type { LivePrice } from "@/lib/prices/model";
import { formatNumber, longDate } from "@/lib/prices/format";

export const metadata: Metadata = { title: "판단 방식 | FoodValue" };

/**
 * 판단 방식: 지표 기준(WAS app/core/constants.py 값), 예측 모델 검증 결과(품목별 과거 평균 오차), 데이터 출처.
 * 기준 숫자는 WAS 상수와 같다(SEASONAL_BAND 0.10, POSITION_LOW/HIGH 0.25/0.75, LEAD_WHOLESALE_MOVE 0.05).
 */
const RULES = [
  { name: "평년 대비", note: "홈 판단에 써요", what: "최근 4주 평균 가격을 직전 5년 같은 시기 평균과 견줘요.",
    rule: "10% 넘게 낮으면 싼 편, 10% 넘게 높으면 비싼 편이에요. 그 사이는 평년 수준이에요." },
  { name: "1년 중 위치", note: "자리만 알려줘요", what: "최근 1년 하루하루 가격 중 지금보다 싼 날의 비율로 자리를 정해요.",
    rule: "지금보다 싼 날이 25% 아래면 낮은 쪽, 75% 넘으면 높은 쪽이에요. 그 사이는 중간이에요." },
  { name: "도매 흐름", note: null, what: "시장 도매가가 최근 2주에 얼마나 움직였는지 봐요.",
    rule: "2주 새 5% 넘게 오르거나 내리면 신호로 봐요. 과거에 소매가가 실제로 따라 움직인 품목만 보여줘요." },
  { name: "소매·도매 배수", note: "자리만 알려줘요", what: "소매가를 도매가로 나눈 값이에요. 유통비와 이윤 때문에 보통 1보다 커요.",
    rule: "1년 중 지금보다 배수가 낮은 날이 25% 아래면 낮은 쪽이에요. 75%를 넘으면 높은 쪽이에요." },
  { name: "가격 출렁임", note: "자리만 알려줘요", what: "최근 4주 최고·최저 가격 차이를 평균 가격에 견준 값이에요.",
    rule: "1년 중 덜 출렁인 날이 25% 아래면 덜 출렁임이에요. 75%를 넘으면 많이 출렁임이에요." },
];

async function loadModels(): Promise<{ items: LivePrice[]; failed: boolean }> {
  try {
    const page = await listPrices({ size: 50, sort: "name" });
    // 품목별 과거 평균 오차는 상세 응답에만 있다. 품목이 많으면 앞 12개만 보여준다.
    const details = await Promise.all(page.items.slice(0, 12).map(item => getPrice(item.id).catch(() => item)));
    return { items: details, failed: false };
  } catch {
    return { items: [], failed: true };
  }
}

const method = (item: LivePrice) => item.forecastPrice === null ? "예측 없음" : item.status === "BASELINE" || item.quality === "BASELINE" ? "직전 가격 유지" : "AI 모델";

export default async function AboutPage() {
  const { items, failed } = await loadModels();
  const date = items.reduce<string | null>((best, item) => item.priceDate && (!best || item.priceDate > best) ? item.priceDate : best, null);
  const sources = [...new Set(items.map(item => item.source).filter(Boolean))].join("·");
  return <main id="main-content" className="fv-page about-page">
    <header className="about-head">
      <p className="board-date">{date ? <><time dateTime={date}>{longDate(date)}</time> 기준</> : "기준일 정보 없음"}</p>
      <h1 className="fv-h1">판단 방식</h1>
      <p className="about-lead">FoodValue는 지난 가격 지표로 싼 편·비싼 편을 판단해요. AI 예측은 판단에 쓰지 않고 참고로만 보여드려요.</p>
    </header>

    <section aria-labelledby="rules-title" className="about-section">
      <h2 id="rules-title" className="fv-h2">지표와 판단 기준</h2>
      <div className="about-rules">
        {RULES.map(rule => <article key={rule.name} className="fv-card about-rule">
          <h3>{rule.name}{rule.note && <span className="fv-badge is-brand">{rule.note}</span>}</h3>
          <p>{rule.what}</p>
          <p className="about-rule-line"><b>판단 기준</b>{rule.rule}</p>
        </article>)}
      </div>
      <p className="fv-cap">‘1년 중 위치’는 통계 용어로 백분위(percentile)예요.</p>
    </section>

    <section aria-labelledby="model-title" className="about-section">
      <h2 id="model-title" className="fv-h2">AI 7일 예측은 이렇게 만들어요</h2>
      <p>품목마다 과거 기간으로 모델을 검증해요. 모델이 직전 가격보다 덜 정확하면, 예측 대신 직전 가격을 보여줘요.</p>
      {failed ? <p className="fv-notice">지금은 품목별 검증 결과를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>
        : items.length > 0 && <table className="about-table">
          <caption className="sr-only">품목별 예측 방식과 과거 평균 오차</caption>
          <thead><tr><th scope="col">품목</th><th scope="col">예측 방식</th><th scope="col" className="num">과거 평균 오차</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}>
            <th scope="row"><Link href={`/prices/${item.id}`} prefetch={false} className="fv-link">{item.name}</Link></th>
            <td>{method(item)}</td>
            <td className="num fv-num">{item.guide?.mape != null && method(item) === "AI 모델" ? `${formatNumber(item.guide.mape, 1)}%` : "—"}</td>
          </tr>)}</tbody>
        </table>}
      <p className="fv-cap">과거 평균 오차(MAPE)는 예측가와 실제 가격의 평균 차이예요. 상세의 예측 요인(SHAP)은 모델 계산에 쓰인 값이에요. 가격이 움직인 원인은 아니에요.</p>
    </section>

    <section aria-labelledby="data-title" className="about-section">
      <h2 id="data-title" className="fv-h2">데이터</h2>
      <ul className="about-list">
        <li>가격은 {sources || "출처 정보 없음"} 전국 평균 소매가예요. 각 화면 위쪽에 기준일이 있어요.</li>
        <li>최신 가격이 늦게 들어오면 이전 기준일 값이라고 알려드려요.</li>
        <li>작형(품종)이 막 바뀐 직후엔 지표를 잠시 쉬고 이유를 적어 둬요.</li>
      </ul>
    </section>
  </main>;
}
