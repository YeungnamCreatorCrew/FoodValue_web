/**
 * 분석실 계산. 모두 브라우저·서버에서 지금 API 응답만으로 다시 계산한다(WAS 수정 없음).
 * 기준 숫자는 WAS app/core/constants.py와 같다. 바뀌면 여기도 같이 바꾼다.
 */
import type { IndicatorState, PricePoint } from "@/lib/prices/model";
import type { ShapAnalysis, ShapFactor } from "@/lib/prices/shap";

export const SEASONAL_BAND = 0.10; // 평년 대비 ±10% 밖이면 싼 편·비싼 편
export const POSITION_LOW = 0.25; // 1년 분포 하위 25% 이하면 낮은 쪽
export const POSITION_HIGH = 0.75; // 상위 25% 이상이면 높은 쪽
export const NORMAL_YEARS = 5; // 평년 = 직전 5년
const WINDOW_WEEKS = 4; // 최근 4주(서버는 28일)
const MIN_WEEKS = 3; // 4주 중 주 평균이 3주 이상 있어야 계산
export const AHEAD_WEEKS = 4; // 성적표: 판단 뒤 몇 주 뒤 가격을 보나
export const FLAT_MOVE = 0.01; // ±1% 안은 보합

export function seasonalState(diff: number): IndicatorState {
  if (diff <= -SEASONAL_BAND) return "down";
  if (diff >= SEASONAL_BAND) return "up";
  return "neutral";
}
export function positionState(percentile: number): IndicatorState {
  if (percentile <= POSITION_LOW) return "down";
  if (percentile >= POSITION_HIGH) return "up";
  return "neutral";
}

/** WAS price_stats.percentile과 같은 식: 지금보다 낮은 날 + 같은 날의 절반. 0~1. */
export function percentileOf(values: number[], current: number) {
  if (!values.length) return null;
  let below = 0, same = 0;
  for (const value of values) { if (value < current) below++; else if (value === current) same++; }
  return (below + same / 2) / values.length;
}

const DAY = 86400000;
const time = (date: string) => Date.parse(`${date.slice(0, 10)}T00:00:00Z`);

/** 기준일까지 최근 365일 일별 가격(값 있는 날만). WAS _last_year와 같은 구간 (end-365, end]. */
export function lastYearPrices(points: PricePoint[], endDate: string | null) {
  const valid = points.filter((p): p is { date: string; price: number } => p.price !== null && Number.isFinite(p.price));
  if (!valid.length) return [];
  const end = time(endDate ?? valid.at(-1)!.date);
  return valid.filter(p => time(p.date) > end - 365 * DAY && time(p.date) <= end);
}

// ---- 판단 달력: 연도별 주 평균(평년 대비 카드 차트)으로 주마다 '평년 대비'를 다시 계산한 근사 ----
export interface WeekCell {
  year: number;
  week: number;
  price: number | null;
  recent: number | null;
  normal: number | null;
  diff: number | null;
  state: IndicatorState | null;
}
type Weekly = { year: number; points: { week: number; price: number }[] }[];

export function judgmentCalendar(years: Weekly) {
  const table = new Map<number, Map<number, number>>();
  for (const row of years) table.set(row.year, new Map(row.points.filter(p => p.week <= 52).map(p => [p.week, p.price])));
  const priceAt = (year: number, week: number) => table.get(year)?.get(week) ?? null;
  /** (year, week)에서 거꾸로 4주(연도 경계를 넘으면 전년 52주부터). */
  const windowAvg = (year: number, week: number) => {
    const values: number[] = [];
    for (let i = 0; i < WINDOW_WEEKS; i++) {
      let y = year, w = week - i;
      if (w < 1) { y -= 1; w += 52; }
      const value = priceAt(y, w);
      if (value !== null) values.push(value);
    }
    return values.length >= MIN_WEEKS ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  const allYears = [...table.keys()].toSorted((a, b) => a - b);
  const rows: { year: number; cells: WeekCell[] }[] = [];
  for (const year of allYears) {
    const cells: WeekCell[] = [];
    for (let week = 1; week <= 52; week++) {
      const price = priceAt(year, week);
      const recent = price === null ? null : windowAvg(year, week);
      const past = Array.from({ length: NORMAL_YEARS }, (_, k) => windowAvg(year - k - 1, week));
      const normal = past.every(v => v !== null) ? (past as number[]).reduce((a, b) => a + b, 0) / NORMAL_YEARS : null;
      const diff = recent !== null && normal ? recent / normal - 1 : null;
      cells.push({ year, week, price, recent, normal, diff, state: diff === null ? null : seasonalState(diff) });
    }
    if (cells.some(cell => cell.state !== null)) rows.push({ year, cells });
  }
  return { rows, priceAt };
}

export interface ScoreRow { n: number; up: number; down: number; flat: number }
export interface Scorecard { cheap: ScoreRow; expensive: ScoreRow; all: ScoreRow; aheadWeeks: number }
/** 성적표: '싼 편'·'비싼 편'이던 주 뒤 AHEAD_WEEKS주 가격이 어떻게 움직였나. 모든 주(기준선)와 견준다. */
export function scorecard(calendar: ReturnType<typeof judgmentCalendar>): Scorecard {
  const empty = (): ScoreRow => ({ n: 0, up: 0, down: 0, flat: 0 });
  const result = { cheap: empty(), expensive: empty(), all: empty(), aheadWeeks: AHEAD_WEEKS };
  for (const row of calendar.rows) for (const cell of row.cells) {
    if (cell.state === null || cell.price === null) continue;
    let y = cell.year, w = cell.week + AHEAD_WEEKS;
    if (w > 52) { y += 1; w -= 52; }
    const later = calendar.priceAt(y, w);
    if (later === null) continue;
    const move = later / cell.price - 1;
    const kind = move > FLAT_MOVE ? "up" : move < -FLAT_MOVE ? "down" : "flat";
    for (const target of [result.all, cell.state === "down" ? result.cheap : cell.state === "up" ? result.expensive : null]) {
      if (!target) continue;
      target.n++; target[kind]++;
    }
  }
  return result;
}

// ---- 영수증형 예측 분해: 기준값 + 요인 기여 = 예측가 (WAS v2_ensemble.explain과 같은 덧셈) ----
export interface ReceiptGroup { category: string; label: string; total: number; lines: { id: string; label: string; contribution: number; factor: ShapFactor | null }[] }
export function receipt(analysis: ShapAnalysis, topPerGroup = 4) {
  const groups = new Map<string, ShapFactor[]>();
  for (const factor of analysis.factors) groups.set(factor.category, [...(groups.get(factor.category) ?? []), factor]);
  const labels = new Map(analysis.categories.map(c => [c.category, c.label]));
  const result: ReceiptGroup[] = [...groups].map(([category, factors]) => {
    const sorted = factors.toSorted((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
    // 나머지가 1개뿐이면 '그 밖의 1개'로 묶지 않고 그대로 보여준다.
    const cut = sorted.length - topPerGroup <= 1 ? sorted.length : topPerGroup;
    const shown = sorted.slice(0, cut), rest = sorted.slice(cut);
    const lines: ReceiptGroup["lines"] = shown.map(f => ({ id: f.id, label: f.label, contribution: f.contribution, factor: f }));
    if (rest.length) lines.push({ id: `${category}-rest`, label: `그 밖의 ${rest.length}개`, contribution: rest.reduce((s, f) => s + f.contribution, 0), factor: null });
    return { category, label: labels.get(category) ?? factors[0].categoryLabel, total: factors.reduce((s, f) => s + f.contribution, 0), lines };
  }).toSorted((a, b) => Math.abs(b.total) - Math.abs(a.total));
  const sum = analysis.factors.reduce((s, f) => s + f.contribution, 0);
  const computed = analysis.basePrice === null ? null : analysis.basePrice + sum;
  // 서버 예측가는 반올림한 값이라 1원 안팎 차이는 반올림 차이로 보여준다.
  const rounding = computed !== null && analysis.predictedPrice !== null ? analysis.predictedPrice - computed : null;
  return { groups: result, sum, computed, rounding, count: analysis.factors.length };
}

// ---- 요인 지도(트리맵): 넓이 = |기여|. squarified 배치(Bruls et al.)로 네모가 너무 길쭉해지지 않게 한다 ----
export interface Rect { x: number; y: number; w: number; h: number }
export function squarify<T extends { size: number }>(items: T[], box: Rect): (T & { rect: Rect })[] {
  const list = items.filter(i => i.size > 0).toSorted((a, b) => b.size - a.size);
  const total = list.reduce((s, i) => s + i.size, 0);
  if (!total || box.w <= 0 || box.h <= 0) return [];
  const scale = (box.w * box.h) / total;
  const out: (T & { rect: Rect })[] = [];
  let rest = { ...box };
  let row: T[] = [];
  const worst = (r: T[], side: number) => {
    const areas = r.map(i => i.size * scale), sum = areas.reduce((a, b) => a + b, 0);
    return Math.max(...areas.map(a => Math.max((side * side * a) / (sum * sum), (sum * sum) / (side * side * a))));
  };
  const place = (r: T[]) => {
    const sum = r.reduce((s, i) => s + i.size * scale, 0);
    if (rest.w >= rest.h) { // 왼쪽에 세로 줄
      const w = sum / rest.h; let y = rest.y;
      for (const i of r) { const h = (i.size * scale) / w; out.push({ ...i, rect: { x: rest.x, y, w, h } }); y += h; }
      rest = { x: rest.x + w, y: rest.y, w: rest.w - w, h: rest.h };
    } else { // 위에 가로 줄
      const h = sum / rest.w; let x = rest.x;
      for (const i of r) { const w = (i.size * scale) / h; out.push({ ...i, rect: { x, y: rest.y, w, h } }); x += w; }
      rest = { x: rest.x, y: rest.y + h, w: rest.w, h: rest.h - h };
    }
  };
  for (const item of list) {
    const side = Math.min(rest.w, rest.h);
    if (!row.length || worst([...row, item], side) <= worst(row, side)) row.push(item);
    else { place(row); row = [item]; }
  }
  if (row.length) place(row);
  return out;
}
