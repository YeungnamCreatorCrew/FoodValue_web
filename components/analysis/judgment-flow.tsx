import type { IndicatorCard, IndicatorState, WholesaleLeadCard } from "@/lib/prices/model";
import { formatNumber, formatWon } from "@/lib/prices/format";
import { POSITION_HIGH, POSITION_LOW, positionState } from "@/lib/analysis/compute";
import { toneClass } from "@/components/prices/indicator-ui";

export const pct = (value: number, digits = 1) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value * 100), digits)}%`;
export const SEASONAL_LABEL: Record<IndicatorState, string> = { down: "싼 편", neutral: "평년 수준", up: "비싼 편" };

/** 눈금자: 구간 3개(왼쪽·가운데·오른쪽)와 지금 값 핀. 값은 0~1 위치로 받는다. */
export function Ruler({ position, cuts, labels, ends, pin, colored = true }: {
  position: number; cuts: [number, number]; labels: [string, string, string]; ends: [string, string]; pin: string; colored?: boolean;
}) {
  const at = (v: number) => `${Math.min(100, Math.max(0, v * 100))}%`;
  const zone = position <= cuts[0] ? 0 : position >= cuts[1] ? 2 : 1;
  return <div className={`an-ruler${colored ? "" : " is-plain"}`}>
    <div className="an-ruler-track">
      <span className="an-ruler-zone is-low" style={{ left: 0, width: at(cuts[0]) }} />
      <span className="an-ruler-zone is-mid" style={{ left: at(cuts[0]), width: at(cuts[1] - cuts[0]) }} />
      <span className="an-ruler-zone is-high" style={{ left: at(cuts[1]), right: 0 }} />
      <span className="an-ruler-pin" style={{ left: at(position) }}><span className="an-ruler-pin-label fv-num">{pin}</span></span>
    </div>
    <div className="an-ruler-zones fv-cap" aria-hidden="true">
      {labels.map((label, i) => <span key={label} className={i === zone ? "is-on" : undefined}>{label}</span>)}
    </div>
    <div className="an-ruler-ends fv-cap fv-num" aria-hidden="true"><span>{ends[0]}</span><span>{ends[1]}</span></div>
  </div>;
}

const RANGE = 0.3; // 눈금자 양 끝: −30% ~ +30%
export const diffToPosition = (diff: number) => (diff + RANGE) / (RANGE * 2);

/** 같이 볼 신호(판단에는 안 씀): 도매 흐름 + 1년 분포에서 자리를 정하는 지표(1년 중 위치·배수·출렁임). 카드만 돌려주고 격자는 부모가 잡는다. */
interface CalcRow { key: string; title: string; hint: string; colored: boolean; state: IndicatorState | null; labels: [string, string, string]; formula: string; value: number; extra: string }
export function PercentileCalcs({ cards, skip = [] }: { cards: IndicatorCard[]; skip?: string[] }) {
  const rows = cards.filter(card => !skip.includes(card.key)).flatMap((card): CalcRow[] => {
    if (card.key === "PRICE_POSITION" && card.fact.percentile !== null && card.fact.currentPrice !== null) {
      const p = card.fact.percentile;
      return [{ key: card.key, title: "1년 중 위치", hint: "지난 1년 가격 중 어디쯤인가", colored: true, state: positionState(p), labels: ["싼 편", "중간", "비싼 편"] as [string, string, string],
        formula: `최근 1년 중 ${formatWon(card.fact.currentPrice)}보다 싼 날의 비율`, value: p,
        extra: `1년 최저 ${formatWon(card.fact.low)} · 평균 ${formatWon(card.fact.avg)} · 최고 ${formatWon(card.fact.high)}` }];
    }
    if (card.key === "RETAIL_WHOLESALE_GAP" && card.fact.percentile !== null && card.fact.ratio !== null) {
      return [{ key: card.key, title: "소매·도매 배수", hint: "소매가가 도매가의 몇 배인가 (높고 낮음만)", colored: false, state: null, labels: ["낮은 쪽", "중간", "높은 쪽"] as [string, string, string],
        formula: `소매 ${formatWon(card.fact.retailPrice)} ÷ 도매 ${formatWon(card.fact.wholesalePrice)} = ${formatNumber(card.fact.ratio, 2)}배, 1년 중 이보다 낮았던 날의 비율`, value: card.fact.percentile,
        extra: `평소(1년 중앙값) ${card.fact.normalRatio === null ? "-" : `${formatNumber(card.fact.normalRatio, 2)}배`}` }];
    }
    if (card.key === "VOLATILITY" && card.fact.percentile !== null && card.fact.recentRange !== null) {
      return [{ key: card.key, title: "가격 출렁임", hint: "최근 가격이 얼마나 오르내렸나 (크고 작음만)", colored: false, state: null, labels: ["덜 출렁임", "보통", "많이 출렁임"] as [string, string, string],
        formula: `최근 4주 (최고 − 최저) ÷ 평균 = ${formatNumber(card.fact.recentRange * 100, 1)}%, 1년 중 이보다 덜 출렁인 날의 비율`, value: card.fact.percentile,
        extra: `평소 ${card.fact.normalRange === null ? "-" : `${formatNumber(card.fact.normalRange * 100, 1)}%`}` }];
    }
    return [];
  });
  const lead = cards.find((card): card is WholesaleLeadCard => card.key === "WHOLESALE_LEAD" && card.verdict !== "WEAK" && card.fact.wholesaleChange2w !== null);
  if (!rows.length && !lead) return null;
  return <>
    {lead && <LeadCalc card={lead} />}
    {rows.map(row => <article key={row.key} className="fv-card an-pcalc">
      <h3 className="an-card-title">{row.title} <span className="fv-cap">{row.hint}</span></h3>
      <p className="an-formula">{row.formula}</p>
      <p className="an-step-v fv-num">= {formatNumber(row.value * 100, 1)}%{row.state && <span className={`an-pcalc-state ${toneClass(row.state)}`}> → {row.labels[row.state === "down" ? 0 : row.state === "up" ? 2 : 1]}</span>}</p>
      <Ruler position={row.value} cuts={[POSITION_LOW, POSITION_HIGH]} labels={row.labels} ends={["0%", "100%"]} pin={`${formatNumber(row.value * 100, 0)}%`} colored={row.colored} />
      <p className="fv-cap">{row.extra}</p>
    </article>)}
  </>;
}

const LEAD_RANGE = 0.15; // 눈금자 양 끝: −15% ~ +15%
const leadPosition = (value: number) => (value + LEAD_RANGE) / (LEAD_RANGE * 2);
const LEAD_LABEL: Record<IndicatorState, string> = { down: "내림 신호", neutral: "신호 없음", up: "오름 신호" };

/** 도매 흐름: 도매가 2주 변화가 ±기준(5%) 밖이면 신호. 과거에 그 뒤 소매가가 따라 움직인 비율(검증)을 같이 보여준다. */
function LeadCalc({ card }: { card: WholesaleLeadCard }) {
  const change = card.fact.wholesaleChange2w!;
  const threshold = card.evidence?.threshold ?? 0.05;
  const state: IndicatorState = card.state ?? (change >= threshold ? "up" : change <= -threshold ? "down" : "neutral");
  const ev = card.evidence;
  const rate = (value: number | null) => value === null ? "-" : `${formatNumber(value * 100, 0)}%`;
  return <article className="fv-card an-pcalc">
    <h3 className="an-card-title">도매 흐름 <span className="fv-cap">시장 도매가가 먼저 움직였나</span></h3>
    <p className="an-formula">도매가 최근 2주 변화 (소매가는 같은 기간 {card.fact.retailChange2w === null ? "-" : pct(card.fact.retailChange2w)})</p>
    <p className="an-step-v fv-num">= {pct(change)}<span className={`an-pcalc-state ${toneClass(state)}`}> → {LEAD_LABEL[state]}</span></p>
    <Ruler position={leadPosition(change)} cuts={[leadPosition(-threshold), leadPosition(threshold)]}
      labels={["내림 신호", "신호 없음", "오름 신호"]} ends={["−15%", "+15%"]} pin={pct(change)} />
    <p className="fv-cap">기준: 2주 새 ±{formatNumber(threshold * 100, 0)}% 넘게 움직이면 신호</p>
    {ev && <p className="fv-cap">과거 검증({ev.periodStart?.slice(0, 4) ?? "?"}~{ev.periodEnd?.slice(0, 4) ?? "?"}): 도매가가 {formatNumber(threshold * 100, 0)}% 넘게 오른 뒤 2주 안에 소매가가 오른 비율 <b className="fv-num">{rate(ev.upAfterRate)}</b>(평소 {rate(ev.baseUpRate)}), 내린 뒤 소매가가 내린 비율 <b className="fv-num">{rate(ev.downAfterRate)}</b>(평소 {rate(ev.baseDownRate)}).</p>}
  </article>;
}
