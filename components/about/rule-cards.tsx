import Link from "next/link";

/**
 * 지표와 판단 기준. 기준 숫자는 WAS app/core/constants.py와 같다
 * (SEASONAL_BAND 0.10, POSITION_LOW/HIGH 0.25/0.75, LEAD_WHOLESALE_MOVE 0.05).
 * 눈금자는 그림 설명용이라 고정 값이다(품목별 실제 위치는 분석실).
 */
interface Rule {
  key: string; name: string; badge: string | null; what: string; rule: string;
  zones: [string, string, string]; cuts: [string, string]; widths: [number, number, number]; colored: boolean;
}
const RULES: Rule[] = [
  { key: "SEASONAL", name: "평년 대비", badge: "홈 판단에 써요", what: "최근 4주 평균 가격을 직전 5년 같은 시기 평균과 견줘요.",
    rule: "10% 넘게 낮으면 싼 편, 10% 넘게 높으면 비싼 편이에요.", zones: ["싼 편", "평년 수준", "비싼 편"], cuts: ["−10%", "+10%"], widths: [1, 1, 1], colored: true },
  { key: "PRICE_POSITION", name: "1년 중 위치", badge: null, what: "최근 1년 하루하루 가격 중 지금보다 싼 날의 비율로 자리를 정해요.",
    rule: "지금보다 싼 날이 25% 이하면 싼 편, 75% 이상이면 비싼 편이에요.", zones: ["싼 편", "중간", "비싼 편"], cuts: ["25%", "75%"], widths: [1, 2, 1], colored: true },
  { key: "WHOLESALE_LEAD", name: "도매 흐름", badge: null, what: "시장 도매가가 최근 2주에 얼마나 움직였는지 봐요.",
    rule: "2주 새 5% 넘게 오르거나 내리면 신호예요. 과거에 소매가가 실제로 따라 움직인 품목만 보여줘요.", zones: ["내림 신호", "신호 없음", "오름 신호"], cuts: ["−5%", "+5%"], widths: [1, 1, 1], colored: true },
  { key: "RETAIL_WHOLESALE_GAP", name: "소매·도매 배수", badge: "자리만 알려줘요", what: "소매가를 도매가로 나눈 값이에요. 유통비와 이윤 때문에 보통 1보다 커요.",
    rule: "1년 중 지금보다 배수가 낮았던 날이 25% 이하면 낮은 쪽, 75% 이상이면 높은 쪽이에요.", zones: ["낮은 쪽", "중간", "높은 쪽"], cuts: ["25%", "75%"], widths: [1, 2, 1], colored: false },
  { key: "VOLATILITY", name: "가격 출렁임", badge: "자리만 알려줘요", what: "최근 4주 최고·최저 가격 차이를 평균 가격에 견준 값이에요.",
    rule: "1년 중 덜 출렁인 날이 25% 이하면 덜 출렁임, 75% 이상이면 많이 출렁임이에요.", zones: ["덜 출렁임", "보통", "많이 출렁임"], cuts: ["25%", "75%"], widths: [1, 2, 1], colored: false },
];

function MiniRuler({ rule }: { rule: Rule }) {
  const total = rule.widths.reduce((a, b) => a + b, 0);
  const at = (i: number) => `${(rule.widths.slice(0, i + 1).reduce((a, b) => a + b, 0) / total) * 100}%`;
  return <div className={`ab-ruler${rule.colored ? "" : " is-plain"}`} aria-label={`${rule.zones[0]} | ${rule.cuts[0]} | ${rule.zones[1]} | ${rule.cuts[1]} | ${rule.zones[2]}`} role="img">
    <div className="ab-ruler-track" style={{ gridTemplateColumns: rule.widths.map(w => `${w}fr`).join(" ") }}>
      <span className="is-low" /><span className="is-mid" /><span className="is-high" />
    </div>
    <div className="ab-ruler-cuts fv-num" aria-hidden="true">
      <span style={{ left: at(0) }}>{rule.cuts[0]}</span><span style={{ left: at(1) }}>{rule.cuts[1]}</span>
    </div>
    <div className="ab-ruler-zones" style={{ gridTemplateColumns: rule.widths.map(w => `${w}fr`).join(" ") }} aria-hidden="true">
      {rule.zones.map(zone => <span key={zone}>{zone}</span>)}
    </div>
  </div>;
}

const MAIN = new Set(["SEASONAL", "PRICE_POSITION", "WHOLESALE_LEAD"]);

function RuleCard({ rule, firstItemId }: { rule: Rule; firstItemId: string | null }) {
  return <article className="fv-card about-rule">
    <h3>{rule.name}{rule.badge && <span className={`fv-badge ${rule.badge.startsWith("홈") ? "is-brand" : "tone-flat"}`}>{rule.badge}</span>}</h3>
    <p>{rule.what}</p>
    <MiniRuler rule={rule} />
    <p className="about-rule-line"><b>판단 기준</b>{rule.rule}</p>
    {firstItemId && <Link href={`/analysis?item=${firstItemId}#judge-title`} prefetch={false} className="fv-link ab-more">분석실에서 실제 계산 보기 ›</Link>}
  </article>;
}

/** 판단에 쓰는 3개를 먼저 펼치고, '자리만 알려주는' 배수·출렁임은 접어 둔다. */
export function RuleCards({ firstItemId }: { firstItemId: string | null }) {
  const extra = RULES.filter(rule => !MAIN.has(rule.key));
  return <>
    <div className="about-rules">
      {RULES.filter(rule => MAIN.has(rule.key)).map(rule => <RuleCard key={rule.key} rule={rule} firstItemId={firstItemId} />)}
    </div>
    <details className="ab-fold">
      <summary>판단에는 쓰지 않는 지표 {extra.length}개 보기 <span className="fv-cap">(소매·도매 배수, 가격 출렁임: 지금 자리만 알려줘요)</span></summary>
      <div className="about-rules">{extra.map(rule => <RuleCard key={rule.key} rule={rule} firstItemId={firstItemId} />)}</div>
    </details>
  </>;
}
