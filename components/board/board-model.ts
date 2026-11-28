import type { IndicatorSignal, IndicatorState, LivePrice } from "@/lib/prices/model";
import { formatNumber } from "@/lib/prices/format";
import { josa } from "@/components/fv/text";

/** 홈 품목 표의 계산(정렬·거르기·요약 문장). 판단은 서버가 준 '평년 대비'(SEASONAL) 상태만 쓴다. */
export type SortKey = "seasonal" | "change" | "position" | "name";
export type FilterKey = "all" | IndicatorState;

export const SORTS: SortKey[] = ["seasonal", "change", "position", "name"];
export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" }, { key: "down", label: "싼 편" }, { key: "neutral", label: "평년 수준" }, { key: "up", label: "비싼 편" },
];
export const SORT_NOTE: Record<SortKey, string> = {
  seasonal: "평년보다 싼 품목부터, 같은 판단은 1년 중 낮은 쪽부터예요.",
  change: "지난주보다 많이 내린 품목부터 보여요.",
  position: "1년 중 낮은 쪽에 있는 품목부터 보여요.",
  name: "이름 순서예요.",
};
/** 품목이 이 수 이상이면 페이지를 나눈다. 검색은 품목 수와 관계없이 제공한다. */
export const MANY_ITEMS = 9;
export const PAGE_SIZE = 20;

/** 1년 중 위치 단어. 평년 대비 판단(싼 편·비싼 편)과 섞이지 않게 다른 말을 쓴다. 기준선 25%·75%는 WAS와 같다. */
export function positionWord(percentile: number | null | undefined) {
  if (percentile == null) return null;
  // 위치는 판단이 아니라서 ↑↓(싼 편·비싼 편에 쓰는 화살표)를 쓰지 않는다. 막대와 낱말로만 말한다.
  return { word: percentile < 0.25 ? "낮은 쪽" : percentile > 0.75 ? "높은 쪽" : "중간" };
}
export const signalOf = (item: LivePrice, key: string): IndicatorSignal | null => item.listIndicators?.signals.find(signal => signal.key === key) ?? null;
export const seasonalState = (item: LivePrice) => signalOf(item, "SEASONAL")?.state ?? null;

const stateRank = (state: IndicatorState | null) => state === "down" ? 0 : state === "neutral" ? 1 : state === "up" ? 2 : 3;
/** 값이 없으면 늘 맨 뒤. */
const byNumber = (a: number | null | undefined, b: number | null | undefined) => (a ?? Infinity) - (b ?? Infinity);

export function sortItems(items: LivePrice[], key: SortKey) {
  const name = (a: LivePrice, b: LivePrice) => a.name.localeCompare(b.name, "ko");
  const compare: Record<SortKey, (a: LivePrice, b: LivePrice) => number> = {
    // 목록 응답에는 평년 대비 %가 없어서, 같은 판단 안에서는 1년 중 낮은 쪽(백분위가 작은 품목)부터 놓는다.
    seasonal: (a, b) => stateRank(seasonalState(a)) - stateRank(seasonalState(b)) || byNumber(a.listIndicators?.yearRange?.percentile, b.listIndicators?.yearRange?.percentile) || name(a, b),
    change: (a, b) => byNumber(a.weeklyChangeRate, b.weeklyChangeRate) || name(a, b),
    position: (a, b) => byNumber(a.listIndicators?.yearRange?.percentile, b.listIndicators?.yearRange?.percentile) || name(a, b),
    name,
  };
  return items.toSorted(compare[key]);
}

export function filterItems(items: LivePrice[], filter: FilterKey, keyword: string, category: string) {
  const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
  const word = normalize(keyword);
  return items.filter(item => (filter === "all" || seasonalState(item) === filter)
    && (category === "ALL" || item.categoryCode === category)
    && (!word || [item.name, ...(item.aliases ?? [])].some(name => normalize(name).includes(word))));
}

export function countByState(items: LivePrice[]) {
  const counts = { all: items.length, down: 0, neutral: 0, up: 0 } as Record<FilterKey, number>;
  for (const item of items) { const state = seasonalState(item); if (state) counts[state] += 1; }
  return counts;
}

/** 홈 맨 위 한 문장. 품목 수(1개 · 몇 개 · 수십 개)에 상관없이 맞는 말이 되게 한다. */
export function headline(items: LivePrice[]) {
  const total = items.length;
  const counts = countByState(items);
  const judged = counts.down + counts.neutral + counts.up;
  if (!total) return "보여드릴 품목이 없어요.";
  if (!judged) return "아직 평년과 견줄 수 있는 품목이 없어요.";
  if (total === 1) {
    const state = seasonalState(items[0]);
    const tail = state === "down" ? "평년보다 싸요." : state === "up" ? "평년보다 비싸요." : "평년 수준이에요.";
    return `${josa(items[0].name, "은", "는")} ${tail}`;
  }
  if (counts.down) return `${total}개 중 ${counts.down}개가 평년보다 싸요.`;
  if (counts.up) return `${total}개 중 ${counts.up}개가 평년보다 비싸요.`;
  return `${total}개 모두 평년 수준이에요.`;
}

/** 두 번째 줄: 지난주보다 가장 많이 내린 품목과 가장 많이 오른 품목. 없으면 빈 배열. */
export function movers(items: LivePrice[]) {
  const priced = items.filter(item => item.weeklyChangeRate !== null && item.weeklyChangeRate !== 0);
  if (!priced.length) return [];
  const sorted = priced.toSorted((a, b) => a.weeklyChangeRate! - b.weeklyChangeRate!);
  const lines: { tone: "down" | "up"; lead: string; strong: string; tail: string }[] = [];
  const fall = sorted[0], rise = sorted.at(-1)!;
  if (fall.weeklyChangeRate! < 0) { const strong = `${fall.name} ↓${formatNumber(Math.abs(fall.weeklyChangeRate!), 1)}%`; lines.push({ tone: "down", lead: "지난주보다 가장 많이 내린 품목은 ", strong, tail: josa(strong, "이에요", "예요").slice(strong.length) + "." }); }
  if (rise.weeklyChangeRate! > 0) { const strong = `${rise.name} ↑${formatNumber(rise.weeklyChangeRate!, 1)}%`; lines.push({ tone: "up", lead: "가장 많이 오른 품목은 ", strong, tail: josa(strong, "이에요", "예요").slice(strong.length) + "." }); }
  return lines;
}

/** 가장 최근 가격 기준일(품목마다 다를 수 있어 가장 늦은 날). */
export function latestDate(items: LivePrice[]) {
  return items.reduce<string | null>((best, item) => item.priceDate && (!best || item.priceDate > best) ? item.priceDate : best, null);
}
