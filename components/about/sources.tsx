import type { AboutItem } from "@/lib/about/data";

type Use = "yes" | "no" | "tried";
const LABEL: Record<Use, string> = { yes: "써요", no: "—", tried: "실험 후 안 씀" };

/** 데이터 출처 × 쓰는 곳. 예측 칸은 이번 예측 요인 묶음(categories)에서 정한다. 실험 기록은 MODEL_HISTORY와 같은 내용. */
export function SourceMatrix({ items }: { items: AboutItem[] }) {
  const used = new Set(items.flatMap(row => row.categories));
  const rows: { name: string; what: string; judge: Use; forecast: Use; note?: string }[] = [
    { name: "KAMIS 소매가", what: "전국 평균 소매 가격(매일)", judge: "yes", forecast: used.has("PRICE") ? "yes" : "no", note: "판단 지표 5개 모두" },
    { name: "KAMIS 도매가", what: "전국 도매 가격(매일)", judge: "yes", forecast: used.has("PRICE") ? "yes" : "no", note: "도매 흐름·배수" },
    { name: "기상청", what: "기온·강수·폭염·한파", judge: "no", forecast: used.has("WEATHER") ? "yes" : "no" },
    { name: "달력", what: "요일·명절·공휴일·작형 전환", judge: "no", forecast: used.has("CALENDAR") ? "yes" : "no" },
    { name: "통계청·한국은행", what: "연간 생산량·환율", judge: "no", forecast: used.has("MACRO") ? "yes" : "tried" },
    { name: "가락시장", what: "품목별 반입량", judge: "no", forecast: "tried" },
    { name: "KREI 관측월보", what: "월별 수급 전망", judge: "no", forecast: "tried" },
  ];
  const shown = rows.filter(row => row.judge === "yes" || row.forecast === "yes");
  return <article className="fv-card ab-sources">
    <table className="ab-src-table">
      <caption className="sr-only">데이터 출처와 쓰는 곳</caption>
      <thead><tr><th scope="col">출처</th><th scope="col">무엇</th><th scope="col">판단</th><th scope="col">AI 예측(참고)</th></tr></thead>
      <tbody>{shown.map(row => <tr key={row.name}>
        <th scope="row">{row.name}</th>
        <td>{row.what}{row.note && <span className="fv-cap"> · {row.note}</span>}</td>
        {[row.judge, row.forecast].map((use, i) => <td key={i}><span className={`ab-use is-${use}`}>{LABEL[use]}</span></td>)}
      </tr>)}</tbody>
    </table>
    <p className="fv-cap">판단에는 KAMIS 가격만 써요. 나머지 자료는 AI 예측에만 들어가요. 넣어 봤지만 성적이 나빠져 뺀 자료는 위 ‘모델을 고른 과정’에 있어요.</p>
  </article>;
}
