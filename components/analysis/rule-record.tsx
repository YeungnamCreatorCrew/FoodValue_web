import type { IndicatorCard, PricePositionCard, WholesaleLeadCard } from "@/lib/prices/model";
import { formatNumber } from "@/lib/prices/format";

const pct = (value: number) => `${Math.round(value * 100)}%`;
const n = (value: number | null) => value === null ? "" : `, ${formatNumber(value)}번`;

/**
 * 이 품목에서 신호가 과거에 얼마나 맞았나. 서버가 과거 기록으로 다시 센 검증 값(evidence)만 쓴다(화면에서 다시 계산하지 않는다).
 * "평소"는 신호가 없을 때도 그렇게 움직인 비율이라, 둘의 차이가 신호의 쓸모다.
 */
export function RuleRecord({ cards }: { cards: IndicatorCard[] }) {
  const lead = cards.find((card): card is WholesaleLeadCard => card.key === "WHOLESALE_LEAD")?.evidence ?? null;
  const position = cards.find((card): card is PricePositionCard => card.key === "PRICE_POSITION")?.evidence ?? null;
  const rows: { key: string; when: string; then: string; rate: number; base: number; count: number | null }[] = [];
  const threshold = lead?.threshold != null ? `${Math.round(lead.threshold * 100)}%` : "5%";
  if (lead?.upAfterRate != null && lead.baseUpRate != null) rows.push({ key: "lead-up", when: `도매가가 2주 새 ${threshold} 넘게 오른 뒤`, then: "2주 안에 소매가도 올랐어요", rate: lead.upAfterRate, base: lead.baseUpRate, count: lead.sampleUp });
  if (lead?.downAfterRate != null && lead.baseDownRate != null) rows.push({ key: "lead-down", when: `도매가가 2주 새 ${threshold} 넘게 내린 뒤`, then: "2주 안에 소매가도 내렸어요", rate: lead.downAfterRate, base: lead.baseDownRate, count: lead.sampleDown });
  const weeks = position?.aheadWeeks ?? null;
  if (position?.lowAfterRate != null && position.lowBaseRate != null) rows.push({ key: "pos-low", when: "1년 중 싼 편(하위 25%)일 때", then: `${weeks ?? "몇"}주 안에 소매가가 올랐어요`, rate: position.lowAfterRate, base: position.lowBaseRate, count: position.sampleLow });
  if (position?.highAfterRate != null && position.highBaseRate != null) rows.push({ key: "pos-high", when: "1년 중 비싼 편(상위 25%)일 때", then: `${weeks ?? "몇"}주 안에 소매가가 내렸어요`, rate: position.highAfterRate, base: position.highBaseRate, count: position.sampleHigh });
  if (!rows.length) return <p className="fv-notice">이 품목은 과거 기록으로 검증된 신호가 없어요. 판단은 지금 숫자만으로 한 거예요.</p>;
  const start = lead?.periodStart ?? position?.periodStart ?? null;
  return <article className="fv-card an-record">
    <h3 className="an-card-title">과거에 이 신호는 얼마나 맞았나요?{start && <span className="fv-cap">{start.slice(0, 4)}년부터 이 품목 기록</span>}</h3>
    <ul className="an-record-list">
      {rows.map(row => <li key={row.key}>
        <p><b>{row.when}</b> {row.then}</p>
        <p className="an-record-num fv-num"><strong>{pct(row.rate)}</strong> <span className="fv-cap">평소 {pct(row.base)}{n(row.count)}</span>
          <span className={`fv-badge ${row.rate - row.base >= 0.1 ? "is-brand" : "tone-flat"}`}>{row.rate - row.base >= 0 ? "평소보다 " : ""}{row.rate - row.base >= 0 ? `+${Math.round((row.rate - row.base) * 100)}%p` : `${Math.round((row.rate - row.base) * 100)}%p`}</span></p>
      </li>)}
    </ul>
    <p className="fv-cap">‘평소’는 신호가 없을 때도 소매가가 그렇게 움직인 비율이에요. 신호 뒤 비율이 평소보다 높을수록 믿을 만한 신호예요.</p>
  </article>;
}
