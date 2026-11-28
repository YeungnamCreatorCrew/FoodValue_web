import type { PricePositionCard, RetailWholesaleGapCard, WholesaleLeadCard } from "@/lib/prices/model";
import type { AboutItem } from "@/lib/about/data";
import { formatNumber } from "@/lib/prices/format";

interface Pair { label: string; after: number | null; base: number | null; n: number | null; weak?: boolean }
interface Row { name: string; pairs: [Pair, Pair]; note?: string }

const pct = (v: number | null) => v === null ? "-" : `${formatNumber(v * 100, 0)}%`;

/** 신호 뒤 비율과 평소 비율을 막대 두 개로. 차이(%p)를 굵게. 색은 브랜드(신호 뒤)·회색(평소)만 쓴다. */
function PairBars({ pair }: { pair: Pair }) {
  if (pair.after === null || pair.base === null) return <div className="ab-pair is-empty fv-cap">검증 기록 없음</div>;
  const lift = (pair.after - pair.base) * 100;
  return <div className={`ab-pair${pair.weak ? " is-weak" : ""}`} title={`${pair.label}: 신호 뒤 ${pct(pair.after)}, 평소 ${pct(pair.base)}${pair.n ? `, 신호 ${pair.n}번` : ""}`}>
    <div className="ab-bar-row"><span className="ab-bar-key">신호 뒤</span><span className="ab-bar-track"><span className="ab-bar is-after" style={{ width: `${pair.after * 100}%` }} /></span><span className="fv-num ab-bar-val">{pct(pair.after)}</span></div>
    <div className="ab-bar-row"><span className="ab-bar-key">평소</span><span className="ab-bar-track"><span className="ab-bar is-base" style={{ width: `${pair.base * 100}%` }} /></span><span className="fv-num ab-bar-val">{pct(pair.base)}</span></div>
    <p className="ab-lift fv-num">{lift >= 0 ? "+" : "−"}{formatNumber(Math.abs(lift), 0)}%p{pair.n !== null && <span className="fv-cap"> · {formatNumber(pair.n)}번</span>}{pair.weak && <span className="fv-badge tone-flat">근거 약함</span>}</p>
  </div>;
}

function EvidenceCard({ title, question, heads, rows, foot }: { title: string; question: string; heads: [string, string]; rows: Row[]; foot: string }) {
  if (!rows.length) return null;
  return <article className="fv-card ab-ev">
    <h3 className="ab-card-title">{title}</h3>
    <p className="fv-cap">{question}</p>
    <div className="ab-ev-grid" role="table" aria-label={`${title} 과거 검증`}>
      <div className="ab-ev-head" role="row"><span role="columnheader">품목</span><span role="columnheader">{heads[0]}</span><span role="columnheader">{heads[1]}</span></div>
      {rows.map(row => <div key={row.name} className="ab-ev-row" role="row">
        <span className="ab-ev-name" role="rowheader">{row.name}{row.note && <span className="fv-cap">{row.note}</span>}</span>
        <span role="cell"><PairBars pair={row.pairs[0]} /></span>
        <span role="cell"><PairBars pair={row.pairs[1]} /></span>
      </div>)}
    </div>
    <p className="fv-cap">{foot}</p>
  </article>;
}

export function EvidenceSection({ items }: { items: AboutItem[] }) {
  const card = <K extends string>(row: AboutItem, key: K) => row.indicators?.cards.find(c => c.key === key);
  const lead = items.flatMap(row => {
    const c = card(row, "WHOLESALE_LEAD") as WholesaleLeadCard | undefined;
    if (!c?.evidence) return [];
    const e = c.evidence;
    return [{ name: row.item.name, pairs: [
      { label: "도매가 5% 넘게 오른 뒤 소매가 오름", after: e.upAfterRate, base: e.baseUpRate, n: e.sampleUp },
      { label: "도매가 5% 넘게 내린 뒤 소매가 내림", after: e.downAfterRate, base: e.baseDownRate, n: e.sampleDown },
    ] as [Pair, Pair] }];
  });
  const level = (key: "PRICE_POSITION" | "RETAIL_WHOLESALE_GAP") => items.flatMap(row => {
    const c = card(row, key) as PricePositionCard | RetailWholesaleGapCard | undefined;
    if (!c?.evidence) return [];
    const e = c.evidence;
    const overlaps = "overlapsLead" in e && e.overlapsLead;
    return [{ name: row.item.name, note: overlaps ? "도매 흐름과 겹침" : undefined, pairs: [
      { label: "낮은 쪽일 때 그 뒤 소매가 오름", after: e.lowAfterRate, base: e.lowBaseRate, n: e.sampleLow, weak: e.weakSide === "low" },
      { label: "높은 쪽일 때 그 뒤 소매가 내림", after: e.highAfterRate, base: e.highBaseRate, n: e.sampleHigh, weak: e.weakSide === "high" },
    ] as [Pair, Pair] }];
  });
  const position = level("PRICE_POSITION"), gap = level("RETAIL_WHOLESALE_GAP");
  if (!lead.length && !position.length && !gap.length) return <p className="fv-notice">지금은 과거 검증 기록을 불러오지 못했어요.</p>;
  return <div className="ab-evs">
    <EvidenceCard title="도매 흐름" question="도매가가 2주 새 5% 넘게 움직인 뒤, 2주 안에 소매가가 같은 방향으로 움직였나요?"
      heads={["도매 5%↑ 뒤 소매 오름", "도매 5%↓ 뒤 소매 내림"]} rows={lead}
      foot={`품목마다 기록이 있는 기간 동안 주마다 센 값이에요. ‘평소’는 아무 신호가 없을 때도 소매가가 그렇게 움직인 비율이에요. 신호 뒤가 평소보다 높을수록 믿을 만해요.`} />
    <EvidenceCard title="1년 중 위치" question="1년 중 싼 편(하위 25%)일 때 그 뒤 소매가가 올랐나요? 비싼 편(상위 25%)일 때 내렸나요?"
      heads={["싼 편 뒤 오름", "비싼 편 뒤 내림"]} rows={position}
      foot="과거 검증을 통과한 품목만 나와요. 몇 주 뒤를 보는지는 품목마다 달라요(1~4주). ‘근거 약함’은 한쪽 신호가 다른 쪽보다 훨씬 약하다는 뜻이에요." />
    <EvidenceCard title="소매·도매 배수" question="배수가 낮을 때 그 뒤 소매가가 올랐나요? 높을 때 내렸나요?"
      heads={["낮은 쪽 뒤 오름", "높은 쪽 뒤 내림"]} rows={gap}
      foot="과거 검증 기록이 있는 품목만 나와요. ‘도매 흐름과 겹침’은 배수 신호가 도매가 움직임과 거의 같이 움직여 따로 판단할 근거가 적다는 뜻이에요. 그래서 배수는 자리만 알려줘요." />
  </div>;
}
