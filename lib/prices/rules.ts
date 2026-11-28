/**
 * 판단 기준(지표별 설명·기준선)과 '믿을 만한가요?' 문장. 홈·상세의 도움말이 같은 문장을 쓴다.
 * 기준 숫자는 WAS app/core/constants.py와 같다(SEASONAL_BAND 0.10, POSITION_LOW/HIGH 0.25/0.75, LEAD_WHOLESALE_MOVE 0.05).
 */
import type { IndicatorCard, LevelEvidence } from "./model";
import { formatNumber } from "./format";

export interface Rule {
  key: string; name: string; what: string; rule: string; note: string | null;
  zones: [string, string, string]; cuts: [string, string]; widths: [number, number, number]; colored: boolean;
}
export const RULES: Record<string, Rule> = {
  SEASONAL: { key: "SEASONAL", name: "평년 대비", what: "최근 4주 평균 가격을 직전 5년 같은 시기 평균과 견줘요.", note: "홈의 판단(싼 편·평년 수준·비싼 편)은 이 지표로 해요.",
    rule: "10% 이상 낮으면 싼 편, 10% 이상 높으면 비싼 편, 그 사이는 평년 수준이에요.", zones: ["싼 편", "평년 수준", "비싼 편"], cuts: ["−10%", "+10%"], widths: [1, 1, 1], colored: true },
  PRICE_POSITION: { key: "PRICE_POSITION", name: "1년 중 위치", what: "최근 1년 하루하루 가격 중 지금보다 싼 날이 몇 %인지로 자리를 정해요.", note: null,
    rule: "지금보다 싼 날이 25% 이하면 낮은 쪽, 75% 이상이면 높은 쪽, 그 사이는 중간이에요.", zones: ["낮은 쪽", "중간", "높은 쪽"], cuts: ["25%", "75%"], widths: [1, 2, 1], colored: true },
  WHOLESALE_LEAD: { key: "WHOLESALE_LEAD", name: "도매 흐름", what: "시장 도매가가 최근 2주에 얼마나 움직였는지 봐요. 소매가는 보통 도매가를 1~2주 늦게 따라가요.", note: null,
    rule: "2주 새 5% 넘게 오르거나 내리면 신호예요. 과거에 소매가가 실제로 따라 움직인 품목만 신호를 보여줘요.", zones: ["내림 신호", "신호 없음", "오름 신호"], cuts: ["−5%", "+5%"], widths: [1, 1, 1], colored: true },
  RETAIL_WHOLESALE_GAP: { key: "RETAIL_WHOLESALE_GAP", name: "소매·도매 배수", what: "소매가를 도매가로 나눈 값이에요. 유통비와 이윤 때문에 보통 1보다 커요.", note: "지금 자리만 알려주고, 오르내림 판단에는 쓰지 않아요.",
    rule: "1년 중 지금보다 배수가 낮았던 날이 25% 이하면 낮은 쪽, 75% 이상이면 높은 쪽이에요.", zones: ["낮은 쪽", "중간", "높은 쪽"], cuts: ["25%", "75%"], widths: [1, 2, 1], colored: false },
  VOLATILITY: { key: "VOLATILITY", name: "가격 출렁임", what: "최근 4주 최고·최저 가격 차이를 평균 가격에 견준 값이에요.", note: "지금 자리만 알려주고, 오르내림 판단에는 쓰지 않아요.",
    rule: "1년 중 덜 출렁인 날이 25% 이하면 덜 출렁임, 75% 이상이면 많이 출렁임이에요.", zones: ["덜 출렁임", "보통", "많이 출렁임"], cuts: ["25%", "75%"], widths: [1, 2, 1], colored: false },
};

export interface TrustLine { when: string; then: string; rate: number; base: number; count: number | null; items?: number }
const fromLevel = (e: LevelEvidence, lowWhen: string, highWhen: string): TrustLine[] => [
  ...(e.lowAfterRate != null && e.lowBaseRate != null ? [{ when: lowWhen, then: `${e.aheadWeeks ?? "몇"}주 안에 소매가가 올랐어요`, rate: e.lowAfterRate, base: e.lowBaseRate, count: e.sampleLow }] : []),
  ...(e.highAfterRate != null && e.highBaseRate != null ? [{ when: highWhen, then: `${e.aheadWeeks ?? "몇"}주 안에 소매가가 내렸어요`, rate: e.highAfterRate, base: e.highBaseRate, count: e.sampleHigh }] : []),
];

/** 지표 카드 하나(한 품목)의 과거 검증. 서버 evidence만 쓴다. 검증이 없으면 빈 배열. */
export function trustOf(card: IndicatorCard): TrustLine[] {
  if (card.key === "WHOLESALE_LEAD" && card.evidence) {
    const e = card.evidence, t = e.threshold != null ? `${Math.round(e.threshold * 100)}%` : "5%";
    return [
      ...(e.upAfterRate != null && e.baseUpRate != null ? [{ when: `도매가가 2주 새 ${t} 넘게 오른 뒤`, then: "2주 안에 소매가도 올랐어요", rate: e.upAfterRate, base: e.baseUpRate, count: e.sampleUp }] : []),
      ...(e.downAfterRate != null && e.baseDownRate != null ? [{ when: `도매가가 2주 새 ${t} 넘게 내린 뒤`, then: "2주 안에 소매가도 내렸어요", rate: e.downAfterRate, base: e.baseDownRate, count: e.sampleDown }] : []),
    ];
  }
  if (card.key === "PRICE_POSITION" && card.evidence) return fromLevel(card.evidence, "1년 중 낮은 쪽(하위 25%)일 때", "1년 중 높은 쪽(상위 25%)일 때");
  if (card.key === "RETAIL_WHOLESALE_GAP" && card.evidence && !card.evidence.overlapsLead && card.evidence.passed) return fromLevel(card.evidence, "배수가 낮은 쪽일 때", "배수가 높은 쪽일 때");
  return [];
}

/** 여러 품목을 합친 검증(신호 횟수로 가중 평균). 같은 문장(when·then)끼리 묶는다. */
export function pooledTrust(cards: IndicatorCard[]): TrustLine[] {
  const groups = new Map<string, { line: TrustLine; after: number; base: number; n: number; items: number }>();
  for (const card of cards) for (const line of trustOf(card)) {
    const n = line.count ?? 0; if (!n) continue;
    const key = `${line.when}|${line.then.replace(/\d+주/, "몇 주")}`;
    const g = groups.get(key) ?? { line: { ...line, then: line.then.replace(/^\d+주 안에/, "몇 주 안에") }, after: 0, base: 0, n: 0, items: 0 };
    g.after += line.rate * n; g.base += line.base * n; g.n += n; g.items += 1; groups.set(key, g);
  }
  return [...groups.values()].map(g => ({ ...g.line, rate: g.after / g.n, base: g.base / g.n, count: g.n, items: g.items }));
}

/** 검증이 없는 지표에 대한 솔직한 한 줄. */
export function noTrustText(key: string) {
  if (key === "SEASONAL") return "평년 대비는 지금 값이 평년보다 싼지 비싼지를 알려주는 사실 지표예요. 앞으로 오르내릴지를 예측하지 않아서 맞았다·틀렸다로 따지지 않아요.";
  if (key === "VOLATILITY" || key === "RETAIL_WHOLESALE_GAP") return "지금 자리만 알려주는 지표라 과거 적중률을 따로 재지 않아요.";
  return "이 품목은 과거 기록으로 검증된 신호가 아직 없어요.";
}
export const pct = (value: number) => `${Math.round(value * 100)}%`;
export const lift = (line: TrustLine) => `${line.rate >= line.base ? "+" : "−"}${formatNumber(Math.abs((line.rate - line.base) * 100), 0)}%p`;
