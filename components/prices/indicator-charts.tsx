"use client";

import { niceScale } from "@/lib/prices/ticks";

import { useEffect, useRef, useState } from "react";
import type { SeasonalCard, WholesaleLeadCard } from "@/lib/prices/model";
import { formatDate, shortDate, formatNumber, won } from "@/lib/prices/format";
import { ChartHover } from "./chart-hover";
import { josa } from "@/components/fv/text";

// 계열 색은 상승·하락 뜻이 있는 빨강·파랑을 피한다(tokens.css).
const COLORS = { current: "var(--fv-chart-actual)", mean: "var(--fv-text-3)", band: "var(--fv-chart-band)", past: "var(--fv-chart-past)", wholesale: "var(--fv-text-3)", retail: "var(--fv-chart-actual)" };

function useWidth<T extends HTMLElement>(initial: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Path through consecutive points; a null value breaks the line instead of being filled. */
function linePath(points: { x: number; y: number | null }[]) {
  let pen = false;
  return points.map(point => {
    if (point.y === null) { pen = false; return ""; }
    const command = pen ? "L" : "M";
    pen = true;
    return `${command}${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join("");
}

const weekMonth = (week: number) => Math.min(12, Math.floor((week - 1) / 52 * 12) + 1);

export function SeasonalChart({ card }: { card: SeasonalCard }) {
  const [ref, width] = useWidth<HTMLDivElement>(520);
  const chart = card.chart!;
  const height = 260, left = 52, right = width - 10, top = 30, bottom = 230;
  const current = chart.years.find(row => row.year === chart.currentYear);
  const normal = chart.years.filter(row => card.fact.normalYears.includes(row.year));
  const past = chart.years.filter(row => row.year !== chart.currentYear && !card.fact.normalYears.includes(row.year));
  const maxWeek = Math.max(52, ...chart.years.flatMap(row => row.points.map(point => point.week)));
  const high = Math.max(...chart.years.flatMap(row => row.points.map(point => point.price)));
  // 세로축은 0이 아니라 값이 있는 범위로 잡아 변동이 눌리지 않게 한다. 눈금은 보기 좋은 단위로.
  const low = Math.min(...chart.years.flatMap(row => row.points.map(point => point.price)));
  const { min: yMin, max: yMax, ticks } = niceScale(low, high, 4, 0);
  const x = (week: number) => left + (week - 1) / (maxWeek - 1) * (right - left);
  const y = (price: number) => bottom - (price - yMin) / Math.max(1, yMax - yMin) * (bottom - top);
  const weeks = Array.from({ length: maxWeek }, (_, index) => index + 1);
  const priceAt = (row: { points: { week: number; price: number }[] } | undefined, week: number) => row?.points.find(point => point.week === week)?.price ?? null;
  // Prior-5-year range and mean per week, from the years the server marks as normal.
  const stats = weeks.map(week => {
    const values = normal.flatMap(row => priceAt(row, week) ?? []);
    return { week, min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null,
      mean: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null };
  });
  const banded = stats.filter(row => row.min !== null && row.max !== null);
  const band = banded.length ? banded.map((row, index) => `${index ? "L" : "M"}${x(row.week).toFixed(1)},${y(row.max!).toFixed(1)}`).join("")
    + banded.toReversed().map(row => `L${x(row.week).toFixed(1)},${y(row.min!).toFixed(1)}`).join("") + "Z" : "";
  const series = (row: { points: { week: number; price: number }[] }) => linePath(weeks.map(week => {
    const price = priceAt(row, week);
    return { x: x(week), y: price === null ? null : y(price) };
  }));
  const last = current?.points.at(-1);
  const hover = stats.flatMap(row => {
    const price = priceAt(current, row.week);
    if (price === null && row.mean === null) return [];
    return [{ date: "", value: price ?? row.mean!, x: x(row.week), y: y(price ?? row.mean!), week: row.week, price, mean: row.mean }];
  });
  const label = `${chart.currentYear}년과 지난 해들의 같은 주차 소매가 비교`;
  // 글로 된 요약(화면 낭독기와 그래프 아래 한 줄 공통).
  const lastMean = last ? stats.find(row => row.week === last.week)?.mean ?? null : null;
  const seasonalSummary = last ? `주간 값: 올해 최근 주 ${won(last.price)}, 평년 같은 주 ${lastMean === null ? "정보 없음" : won(Math.round(lastMean))}` : "올해 값이 아직 없어요.";
  return <div ref={ref} className="indicator-chart">
    <div className="indicator-legend" aria-hidden="true">
      <span><i style={{ borderColor: COLORS.current, borderTopWidth: 3 }} />{chart.currentYear}년</span>
      {normal.length > 0 && <><span><i className="is-band" style={{ background: COLORS.band }} />직전 {normal.length}년 범위</span>
        <span><i style={{ borderColor: COLORS.mean, borderTopStyle: "dashed" }} />직전 {normal.length}년 평균</span></>}
      {past.length > 0 && <span><i style={{ borderColor: COLORS.past }} />그 이전 해</span>}
    </div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="indicator-svg">
      <title>{label}</title>
      <desc>{seasonalSummary}</desc>
      <text x={left - 6} y={top - 14} textAnchor="end" fontSize="12" fill="var(--fv-text-3)">원</text>
      {ticks.map(tick => <g key={tick}><line x1={left} x2={right} y1={y(tick)} y2={y(tick)} stroke="var(--fv-chart-grid)" />
        <text x={left - 6} y={y(tick) + 4} textAnchor="end" fontSize="12" fill="var(--fv-text-3)">{formatNumber(tick)}</text></g>)}
      {[1, 3, 5, 7, 9, 11].map(month => { const week = Math.round((month - 1) * 52 / 12) + 1; return <text key={month} x={x(week)} y={height - 8} textAnchor="middle" fontSize="12" fill="var(--fv-text-3)">{month}월</text>; })}
      {past.map(row => <path key={row.year} d={series(row)} fill="none" stroke={COLORS.past} strokeWidth="1.2" />)}
      {band && <path d={band} fill={COLORS.band} fillOpacity="0.85" />}
      <path d={linePath(stats.map(row => ({ x: x(row.week), y: row.mean === null ? null : y(row.mean) })))} fill="none" stroke={COLORS.mean} strokeWidth="1.5" strokeDasharray="4 3" />
      {current && <path d={series(current)} fill="none" stroke={COLORS.current} strokeWidth="2.6" strokeLinejoin="round" />}
      {last && <circle cx={x(last.week)} cy={y(last.price)} r="4.5" fill={COLORS.current} stroke="var(--fv-bg)" strokeWidth="2" />}
      <ChartHover points={hover} left={left} right={right} top={top + 20} bottom={bottom} color={COLORS.current}
        tooltip={point => ({ title: `${weekMonth(point.week)}월 · ${point.week}주차`,
          lines: [...(point.price !== null ? [{ text: `${chart.currentYear}년 ${won(point.price)}`, bold: true }] : []),
            ...(point.mean !== null ? [{ text: `직전 ${normal.length}년 평균 ${won(Math.round(point.mean))}`, color: "var(--fv-tooltip-sub)" }] : [])],
          markers: [...(point.mean !== null ? [{ y: y(point.mean), color: COLORS.mean }] : []), ...(point.price !== null ? [{ y: y(point.price), color: COLORS.current }] : [])] })} />
    </svg>
    <p className="chart-footnote">{seasonalSummary}</p>
  </div>;
}

export function IndexedChart({ card }: { card: WholesaleLeadCard }) {
  const [ref, width] = useWidth<HTMLDivElement>(480);
  const chart = card.chart!;
  const points = chart.points;
  const height = 200, left = 36, right = width - 38, top = 14, bottom = 172;
  const values = points.flatMap(point => [point.wholesale, point.retail]).filter((value): value is number => value !== null);
  const { min: low, max: high, ticks } = niceScale(Math.min(100, ...values), Math.max(100, ...values), 3);
  const x = (index: number) => left + index / Math.max(1, points.length - 1) * (right - left);
  const y = (value: number) => bottom - (value - low) / Math.max(1, high - low) * (bottom - top);
  const lastIndex = points.length - 1;
  const ends = (["wholesale", "retail"] as const).map(key => {
    const index = points.findLastIndex(point => point[key] !== null);
    return { key, index, y: index < 0 ? null : y(points[index][key]!) };
  });
  // Keep the two end labels from overlapping.
  const [wEnd, rEnd] = ends;
  const labelY = { wholesale: wEnd.y, retail: rEnd.y };
  if (wEnd.y !== null && rEnd.y !== null && Math.abs(wEnd.y - rEnd.y) < 13) {
    const middle = (wEnd.y + rEnd.y) / 2, up = wEnd.y <= rEnd.y;
    labelY.wholesale = middle + (up ? -7 : 7); labelY.retail = middle + (up ? 7 : -7);
  }
  const dateTicks = [...new Set([0, Math.round(lastIndex / 3), Math.round(lastIndex * 2 / 3), lastIndex])];
  const hover = points.flatMap((point, index) => {
    const value = point.retail ?? point.wholesale;
    return value === null ? [] : [{ date: point.date, value, x: x(index), y: y(value), wholesale: point.wholesale, retail: point.retail }];
  });
  const label = `최근 ${points.length}주 도매·소매 가격 지수 (${formatDate(chart.baseDate)} = 100)`;
  const lastPoint = points.at(-1);
  // 글로 된 요약(화면 낭독기와 그래프 아래 한 줄 공통).
  const retailNow = lastPoint?.retail == null ? "정보 없음" : formatNumber(lastPoint.retail, 1);
  const indexSummary = `${shortDate(chart.baseDate)}=100 기준, 지금 도매 ${lastPoint?.wholesale == null ? "정보 없음" : formatNumber(lastPoint.wholesale, 1)}, 소매 ${josa(retailNow, "이에요", "예요")}.`;
  return <div ref={ref} className="indicator-chart">
    <div className="indicator-legend" aria-hidden="true">
      <span><i style={{ borderColor: COLORS.wholesale, borderTopStyle: "dashed" }} />도매</span><span><i style={{ borderColor: COLORS.retail }} />소매</span>
      <span>{shortDate(chart.baseDate)} = 100</span>
    </div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="indicator-svg">
      <title>{label}</title>
      <desc>{indexSummary}</desc>
      {ticks.map(tick => <g key={tick}><line x1={left} x2={right} y1={y(tick)} y2={y(tick)} stroke="var(--fv-chart-grid)" />
        <text x={left - 6} y={y(tick) + 4} textAnchor="end" fontSize="12" fill="var(--fv-text-3)">{tick}</text></g>)}
      <line x1={left} x2={right} y1={y(100)} y2={y(100)} stroke="var(--fv-line-strong)" strokeDasharray="2 3" />
      {dateTicks.map(index => <text key={index} x={x(index)} y={height - 8} textAnchor={index === 0 ? "start" : index === lastIndex ? "end" : "middle"} fontSize="12" fill="var(--fv-text-3)">{points[index].date.slice(5).replace("-", ".")}</text>)}
      {(["wholesale", "retail"] as const).map(key => <path key={key} d={linePath(points.map((point, index) => ({ x: x(index), y: point[key] === null ? null : y(point[key]!) })))}
        fill="none" stroke={COLORS[key]} strokeWidth="2" strokeLinejoin="round" strokeDasharray={key === "wholesale" ? "5 4" : undefined} />)}
      {ends.map(end => end.y !== null && <g key={end.key}>
        <circle cx={x(end.index)} cy={end.y} r="4" fill={COLORS[end.key]} stroke="var(--fv-bg)" strokeWidth="2" />
        <text x={x(end.index) + 8} y={labelY[end.key]! + 4} fontSize="12" fontWeight="600" fill={COLORS[end.key]}>{end.key === "wholesale" ? "도매" : "소매"}</text>
      </g>)}
      <ChartHover points={hover} left={left} right={right} top={top + 20} bottom={bottom} color={COLORS.retail}
        tooltip={point => ({ title: `${point.date.slice(5).replace("-", ".")} 주`,
          lines: [{ text: `도매 ${point.wholesale === null ? "-" : formatNumber(point.wholesale, 1)}`, color: "var(--fv-tooltip-sub)" },
            { text: `소매 ${point.retail === null ? "-" : formatNumber(point.retail, 1)}`, bold: true }],
          markers: [...(point.wholesale !== null ? [{ y: y(point.wholesale), color: COLORS.wholesale }] : []), ...(point.retail !== null ? [{ y: y(point.retail), color: COLORS.retail }] : [])] })} />
    </svg>
    <p className="chart-footnote">{indexSummary}</p>
  </div>;
}
