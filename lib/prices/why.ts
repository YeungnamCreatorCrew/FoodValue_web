/**
 * "왜 이렇게 나왔나요?" 설명 문장. 서버 지표 값(fact)과 수급 소식만 쓰고, 가격을 다시 계산하지 않는다.
 * 기준 숫자는 WAS app/core/constants.py와 같다(평년 ±10%, 1년 위치 25·75%, 도매 2주 ±5%).
 */
import type { IndicatorCard, IndicatorState } from "./model";
import { formatNumber, won } from "./format";

const pct1 = (value: number) => `${formatNumber(Math.abs(value * 100), 1)}%`;
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${pct1(value)}`;
const share = (value: number) => `${Math.round(value * 100)}%`;

/** 카드 앞면 한 줄: 판단에 쓴 숫자 두세 개. 값이 없으면 null. */
export function reasonLine(card: IndicatorCard): string | null {
  switch (card.key) {
    case "SEASONAL": {
      const { recentAvg, normalAvg, diffRate } = card.fact;
      if (recentAvg === null || normalAvg === null || diffRate === null) return null;
      return `최근 4주 ${won(recentAvg)} · 평년 ${won(normalAvg)}보다 ${pct1(diffRate)} ${diffRate < 0 ? "낮아요" : "높아요"}`;
    }
    case "PRICE_POSITION": {
      const { percentile, low, high } = card.fact;
      if (percentile === null) return null;
      return `1년 중 지금보다 싼 날 ${share(percentile)}${low !== null && high !== null ? ` · ${won(low)}~${won(high)}` : ""}`;
    }
    case "WHOLESALE_LEAD": {
      const { wholesaleChange2w, retailChange2w } = card.fact;
      if (wholesaleChange2w === null) return null;
      return `최근 2주 도매 ${signed(wholesaleChange2w)}${retailChange2w !== null ? ` · 소매 ${signed(retailChange2w)}` : ""}`;
    }
    case "RETAIL_WHOLESALE_GAP": {
      const { ratio, normalRatio } = card.fact;
      if (ratio === null) return null;
      return `소매가가 도매가의 ${formatNumber(ratio, 2)}배${normalRatio !== null ? ` · 평소 ${formatNumber(normalRatio, 2)}배` : ""}`;
    }
    case "VOLATILITY": {
      const { recentRange, normalRange } = card.fact;
      if (recentRange === null) return null;
      return `최근 4주 흔들림 ${pct1(recentRange)}${normalRange !== null ? ` · 평소 ${pct1(normalRange)}` : ""}`;
    }
    default: return null;
  }
}

/** 펼친 내용의 "이렇게 판단했어요": 숫자를 기준선에 대 본 결과. */
export function ruleLine(card: IndicatorCard): string | null {
  switch (card.key) {
    case "SEASONAL": {
      const d = card.fact.diffRate;
      if (d === null) return null;
      if (d <= -0.1) return `평년보다 ${pct1(d)} 낮아요. 기준선(−10%)보다 더 낮아서 ‘싼 편’이에요.`;
      if (d >= 0.1) return `평년보다 ${pct1(d)} 높아요. 기준선(+10%)보다 더 높아서 ‘비싼 편’이에요.`;
      return `평년과 ${pct1(d)} 차이예요. ±10% 안이라 ‘평년 수준’이에요.`;
    }
    case "PRICE_POSITION": {
      const p = card.fact.percentile;
      if (p === null) return null;
      if (p <= 0.25) return `1년 중 지금보다 싼 날이 ${share(p)}뿐이에요. 25% 이하라 1년 중 낮은 쪽이에요.`;
      if (p >= 0.75) return `1년 중 지금보다 싼 날이 ${share(p)}예요. 75% 이상이라 1년 중 높은 쪽이에요.`;
      return `1년 중 지금보다 싼 날이 ${share(p)}예요. 25~75% 사이라 중간쯤이에요.`;
    }
    case "WHOLESALE_LEAD": {
      const w = card.fact.wholesaleChange2w, t = card.evidence?.threshold ?? 0.05;
      if (w === null) return null;
      const base = `도매가가 2주 새 ${signed(w)} 움직였어요.`;
      if (w >= t) return `${base} 기준(+${share(t)})을 넘어서 소매가가 따라 오를 수 있는 신호예요.`;
      if (w <= -t) return `${base} 기준(−${share(t)})을 넘어서 소매가가 따라 내릴 수 있는 신호예요.`;
      return `${base} ±${share(t)} 안이라 아직 신호가 아니에요.`;
    }
    case "RETAIL_WHOLESALE_GAP": {
      const { ratio, normalRatio, percentile } = card.fact;
      if (ratio === null || percentile === null) return null;
      return `지금 ${formatNumber(ratio, 2)}배로${normalRatio !== null ? ` 평소(${formatNumber(normalRatio, 2)}배)보다 ${ratio < normalRatio ? "낮아요" : ratio > normalRatio ? "높아요" : "같아요"}.` : ""} 1년 중 배수가 더 낮았던 날은 ${share(percentile)}예요.`;
    }
    case "VOLATILITY": {
      const p = card.fact.percentile;
      if (p === null) return null;
      return `1년 중 이보다 덜 흔들린 날이 ${share(p)}예요. ${p >= 0.75 ? "평소보다 많이 흔들리는 중이라 며칠 새 값이 크게 바뀔 수 있어요." : p <= 0.25 ? "평소보다 차분한 편이에요." : "평소 수준으로 흔들렸어요."}`;
    }
    default: return null;
  }
}

// ---- 수급 소식이 가격을 어느 쪽으로 미는지(일반적인 수요·공급 관계로 분류. 원인을 확정하는 것은 아니다) ----
export type Push = "down" | "up" | "other";
const RULES: { push: Push; pattern: RegExp; why: string }[] = [
  // 정부가 사들여 시장에서 빼는 것은 공급을 줄인다(먼저 검사).
  { push: "up", pattern: /수매\s*비축|시장\s*격리|출하\s*정지/, why: "시장에 풀리는 물량을 줄이는 조치예요" },
  { push: "up", pattern: /수출.{0,8}(?:지원|확대|증가)/, why: "국내에 남는 물량이 줄 수 있어요" },
  { push: "up", pattern: /(?:생산량|재고|저장량|저장 물량|저장 재고|물량).{0,8}(?:감소|부족|줄)|(?:파종|정식|출하|수확).{0,8}(?:지연|늦|차질)|피해|녹아내리|썩|흉작|가뭄|폭우|한파|병해충(?!.{0,6}방제)/, why: "공급이 줄거나 늦어질 수 있는 소식이에요" },
  { push: "up", pattern: /(?:수요|소비).{0,8}(?:증가|확대|회복)/, why: "찾는 사람이 늘어나는 소식이에요" },
  { push: "down", pattern: /(?:수요|소비).{0,8}(?:감소|부진|위축|줄)/, why: "찾는 사람이 줄어드는 소식이에요" },
  { push: "down", pattern: /(?:생산량|출하량|반입량|공급).{0,8}(?:증가|늘|확대|과잉)|과잉|풍작|작황 (?:호조|회복)|출하 대기|대기 물량/, why: "시장에 나올 물량이 많아지는 소식이에요" },
  { push: "down", pattern: /비축.{0,10}(?:공급|방출)|공급 계획|물량 확보/, why: "정부가 물량을 풀어 값을 누르는 조치예요" },
];
export function classifyNews(label: string, detail: string): { push: Push; why: string | null } {
  const text = `${label} ${detail}`;
  const rule = RULES.find(entry => entry.pattern.test(text));
  return rule ? { push: rule.push, why: rule.why } : { push: "other", why: null };
}

/** 맨 아래 "그래서": 평년 대비(지금 상태) × 도매 흐름(곧 올 움직임) × 소식 개수로 한두 문장. */
export function synthesis(seasonal: IndicatorState | null, lead: IndicatorState | null, down: number, up: number, subject: string): string {
  /** subject: 조사까지 붙인 품목 이름("대파는", "깐마늘은"). */
  const name = subject;
  const now = seasonal === "down" ? `${name} 지금 평년보다 싼 편이에요` : seasonal === "up" ? `${name} 지금 평년보다 비싼 편이에요` : `${name} 지금 평년 수준이에요`;
  const news = down > up ? "최근 소식은 값을 내리는 쪽이 더 많아요" : up > down ? "최근 소식은 값을 올리는 쪽이 더 많아요" : down + up > 0 ? "최근 소식은 양쪽이 비슷해요" : null;
  // 지금 상태와 도매 흐름이 같은 방향이면 "더", 반대면 "다만"으로 잇는다.
  const next = lead === "up" ? (seasonal === "up" ? "도매가도 오르고 있어 소매가가 더 오를 수 있어요" : seasonal === "down" ? "다만 도매가가 먼저 오르고 있어 싼 값이 오래가지 않을 수 있어요" : "도매가가 먼저 오르고 있어 소매가도 따라 오를 수 있어요")
    : lead === "down" ? (seasonal === "down" ? "도매가도 내리고 있어 소매가가 더 내릴 수 있어요" : seasonal === "up" ? "다만 도매가가 먼저 내리고 있어 비싼 값이 누그러질 수 있어요" : "도매가가 먼저 내리고 있어 소매가도 따라 내릴 수 있어요")
    : "도매가에는 아직 큰 움직임이 없어 당장 방향이 바뀔 신호는 약해요";
  return `${now}. ${news ? `${news}. ` : ""}${next}.`;
}
