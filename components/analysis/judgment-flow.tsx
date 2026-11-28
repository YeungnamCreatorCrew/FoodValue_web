import type { IndicatorCard, IndicatorState, SeasonalCard, WholesaleLeadCard } from "@/lib/prices/model";
import { formatNumber, formatWon } from "@/lib/prices/format";
import { POSITION_HIGH, POSITION_LOW, SEASONAL_BAND, positionState, seasonalState } from "@/lib/analysis/compute";
import { toneClass } from "@/components/prices/indicator-ui";

const pct = (value: number, digits = 1) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value * 100), digits)}%`;
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

export function JudgmentFlow({ card }: { card: SeasonalCard }) {
  const { recentAvg, normalAvg, diffRate, normalYears, windowDays, cheaperThanCount, historyYears } = card.fact;
  if (recentAvg === null || normalAvg === null || diffRate === null) return <p className="fv-notice">평년 대비 계산에 필요한 값이 모자라요.</p>;
  const state = card.state ?? seasonalState(diffRate);
  const span = normalYears.length ? `${normalYears[0]}~${normalYears.at(-1)}년` : "직전 5년";
  const branches: { key: IndicatorState; test: string }[] = [
    { key: "down", test: `−${SEASONAL_BAND * 100}% 이하` },
    { key: "neutral", test: `−${SEASONAL_BAND * 100}% ~ +${SEASONAL_BAND * 100}%` },
    { key: "up", test: `+${SEASONAL_BAND * 100}% 이상` },
  ];
  return <article className="fv-card an-judge">
    <h3 className="an-card-title">평년 대비 <span className="fv-cap">홈 판단에 쓰는 지표</span></h3>
    <ol className="an-steps">
      <li className="an-stepbox">
        <span className="an-stepnum">①</span>
        <p className="an-step-q">최근 {windowDays ? Math.round(windowDays / 7) : 4}주 평균</p>
        <p className="an-step-v fv-num">{formatWon(recentAvg)}</p>
        <p className="fv-cap">기준일까지 {windowDays ?? 28}일 동안 조사된 날의 평균</p>
      </li>
      <li className="an-stepbox">
        <span className="an-stepnum">②</span>
        <p className="an-step-q">평년 같은 시기 평균</p>
        <p className="an-step-v fv-num">{formatWon(normalAvg)}</p>
        <p className="fv-cap">{span} 같은 날짜 기준 {windowDays ?? 28}일 평균을 다시 평균</p>
      </li>
      <li className="an-stepbox is-calc">
        <span className="an-stepnum">③</span>
        <p className="an-step-q">차이 계산</p>
        <p className="an-formula fv-num">({formatNumber(recentAvg)} − {formatNumber(normalAvg)}) ÷ {formatNumber(normalAvg)}</p>
        <p className="an-step-v fv-num">= {pct(diffRate)}</p>
      </li>
      <li className="an-stepbox is-tree">
        <span className="an-stepnum">④</span>
        <p className="an-step-q">기준선과 비교</p>
        <ul className="an-branches">
          {branches.map(b => <li key={b.key} className={b.key === state ? `is-on ${toneClass(b.key)}` : undefined} aria-current={b.key === state ? "step" : undefined}>
            <span className="fv-num">{b.test}</span><span aria-hidden="true">→</span><b>{SEASONAL_LABEL[b.key]}</b>
          </li>)}
        </ul>
      </li>
    </ol>
    <Ruler position={diffToPosition(diffRate)} cuts={[diffToPosition(-SEASONAL_BAND), diffToPosition(SEASONAL_BAND)]}
      labels={["싼 편", "평년 수준", "비싼 편"]} ends={["−30%", "+30%"]} pin={pct(diffRate)} />
    <p className="an-judge-foot fv-cap">
      <span>싼 편 기준가: <b className="fv-num">{formatWon(Math.round(normalAvg * (1 - SEASONAL_BAND)))}</b> 이하</span>
      <span>비싼 편 기준가: <b className="fv-num">{formatWon(Math.round(normalAvg * (1 + SEASONAL_BAND)))}</b> 이상</span>
      {cheaperThanCount !== null && historyYears !== null && <span>기록이 있는 {historyYears}개 연도 중 {cheaperThanCount}개 해가 이번보다 비쌌어요</span>}
    </p>
  </article>;
}

/** 1년 분포에서 자리를 정하는 지표(1년 중 위치·배수·출렁임). 계산식 + 백분위 눈금자. */
interface CalcRow { key: string; title: string; colored: boolean; state: IndicatorState | null; labels: [string, string, string]; formula: string; value: number; extra: string }
export function PercentileCalcs({ cards }: { cards: IndicatorCard[] }) {
  const rows = cards.flatMap((card): CalcRow[] => {
    if (card.key === "PRICE_POSITION" && card.fact.percentile !== null && card.fact.currentPrice !== null) {
      const p = card.fact.percentile;
      return [{ key: card.key, title: "1년 중 위치", colored: true, state: positionState(p), labels: ["싼 편", "중간", "비싼 편"] as [string, string, string],
        formula: `최근 1년 중 ${formatWon(card.fact.currentPrice)}보다 싼 날의 비율`, value: p,
        extra: `1년 최저 ${formatWon(card.fact.low)} · 평균 ${formatWon(card.fact.avg)} · 최고 ${formatWon(card.fact.high)}` }];
    }
    return [];
  });
  const lead = cards.find((card): card is WholesaleLeadCard => card.key === "WHOLESALE_LEAD" && card.verdict !== "WEAK" && card.fact.wholesaleChange2w !== null);
  if (!rows.length && !lead) return null;
  return <div className="an-pcalcs">
    {lead && <LeadCalc card={lead} />}
    {rows.map(row => <article key={row.key} className="fv-card an-pcalc">
      <h3 className="an-card-title">{row.title}{!row.colored && <span className="fv-badge tone-flat">자리만 알려줘요</span>}</h3>
      <p className="an-formula">{row.formula}</p>
      <p className="an-step-v fv-num">= {formatNumber(row.value * 100, 1)}%{row.state && <span className={`an-pcalc-state ${toneClass(row.state)}`}> → {row.labels[row.state === "down" ? 0 : row.state === "up" ? 2 : 1]}</span>}</p>
      <Ruler position={row.value} cuts={[POSITION_LOW, POSITION_HIGH]} labels={row.labels} ends={["0%", "100%"]} pin={`${formatNumber(row.value * 100, 0)}%`} colored={row.colored} />
      <p className="fv-cap">{row.extra}</p>
    </article>)}
  </div>;
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
