"use client";

import { createContext, useContext, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { ArrivalsCard, HarvestWeatherCard, IndicatorCard, IndicatorNotice, IndicatorState, IndicatorVerdict, LevelEvidence, LivePrice, PricePositionCard, RetailWholesaleGapCard, SeasonalCard, VolatilityCard, WholesaleLeadCard } from "@/lib/prices/model";
import { formatDate, formatNumber, formatPercent, won } from "@/lib/prices/format";
import { usePriceIndicators } from "@/lib/prices/use-prices";
import { ChartHover } from "./chart-hover";
import { INDICATOR_HELP } from "./indicator-help";

// Judgement-aid cards. Chip color and wording come from the server's state; nothing here recomputes a direction from prices.
const DISCLAIMER = "예측이 아니라 지금 상황을 정리한 것입니다. 판단은 직접 내려 주세요.";
const verdictTags: Record<IndicatorVerdict, string> = {
  FACT: "사실", PASS: "검증된 근거", CONDITIONAL: "조건부 근거 · 추가 확인 필요", WEAK: "참고 사실 · 방향 표시 안 함",
};
// Series colors avoid red/blue, which mean 상승/하락 on this site.
const COLORS = { current: "#14532d", mean: "#6f8276", band: "#e3ece0", past: "#d3dbd2", wholesale: "#a0742f", retail: "#14532d" };

/** Draft contract rates are fractions; formatPercent expects percent units. */
const rate = (value: number | null) => formatPercent(value === null ? null : value * 100);
const share = (value: number | null) => value === null ? "-" : `${Math.round(value * 100)}%`;
const cardAnchor = (key: string) => `indicator-${key.toLowerCase()}`;
const stateClass = (state: IndicatorState | null) => state === "up" ? "is-up" : state === "down" ? "is-down" : "is-neutral";

function StateChip({ state, label }: { state: IndicatorState | null; label: string | null }) {
  if (!label) return null;
  return <span className={`indicator-chip ${stateClass(state)}`}>{label}</span>;
}

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

function SeasonalChart({ card }: { card: SeasonalCard }) {
  const [ref, width] = useWidth<HTMLDivElement>(520);
  const chart = card.chart!;
  const height = 280, left = 40, right = width - 10, top = 14, bottom = 250;
  const current = chart.years.find(row => row.year === chart.currentYear);
  const normal = chart.years.filter(row => card.fact.normalYears.includes(row.year));
  const past = chart.years.filter(row => row.year !== chart.currentYear && !card.fact.normalYears.includes(row.year));
  const maxWeek = Math.max(52, ...chart.years.flatMap(row => row.points.map(point => point.week)));
  const high = Math.max(...chart.years.flatMap(row => row.points.map(point => point.price)));
  const yMax = Math.ceil(high / 1000) * 1000;
  const step = yMax > 6000 ? 2000 : 1000;
  const ticks = Array.from({ length: yMax / step + 1 }, (_, index) => index * step);
  const x = (week: number) => left + (week - 1) / (maxWeek - 1) * (right - left);
  const y = (price: number) => bottom - price / yMax * (bottom - top);
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
  return <div ref={ref} className="indicator-chart">
    <div className="indicator-legend" aria-hidden="true">
      <span><i style={{ borderColor: COLORS.current, borderTopWidth: 3 }} />{chart.currentYear}년</span>
      {normal.length > 0 && <><span><i className="is-band" style={{ background: COLORS.band }} />직전 {normal.length}년 범위</span>
        <span><i style={{ borderColor: COLORS.mean, borderTopStyle: "dashed" }} />직전 {normal.length}년 평균</span></>}
      {past.length > 0 && <span><i style={{ borderColor: COLORS.past }} />그 이전 해</span>}
    </div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="indicator-svg">
      <title>{label}</title>
      <desc>{`가로축은 1~${maxWeek}주차, 세로축은 원. ${chart.currentYear}년 마지막 값 ${last ? won(last.price) : "-"}.`}</desc>
      {ticks.map(tick => <g key={tick}><line x1={left} x2={right} y1={y(tick)} y2={y(tick)} stroke="#e9ece9" />
        <text x={left - 6} y={y(tick) + 4} textAnchor="end" fontSize="10" fill="#727c76">{tick ? `${tick / 1000}천` : "0"}</text></g>)}
      {[1, 9, 18, 27, 35, 44].filter(week => week <= maxWeek).map(week => <text key={week} x={x(week)} y={height - 10} textAnchor="middle" fontSize="10" fill="#727c76">{weekMonth(week)}월</text>)}
      {past.map(row => <path key={row.year} d={series(row)} fill="none" stroke={COLORS.past} strokeWidth="1.2" />)}
      {band && <path d={band} fill={COLORS.band} fillOpacity="0.85" />}
      <path d={linePath(stats.map(row => ({ x: x(row.week), y: row.mean === null ? null : y(row.mean) })))} fill="none" stroke={COLORS.mean} strokeWidth="1.5" strokeDasharray="4 3" />
      {current && <path d={series(current)} fill="none" stroke={COLORS.current} strokeWidth="2.6" strokeLinejoin="round" />}
      {last && <circle cx={x(last.week)} cy={y(last.price)} r="4.5" fill={COLORS.current} stroke="white" strokeWidth="2" />}
      <ChartHover points={hover} left={left} right={right} top={top + 20} bottom={bottom} color={COLORS.current}
        tooltip={point => ({ title: `${weekMonth(point.week)}월 · ${point.week}주차`,
          lines: [...(point.price !== null ? [{ text: `${chart.currentYear}년 ${won(point.price)}`, bold: true }] : []),
            ...(point.mean !== null ? [{ text: `직전 ${normal.length}년 평균 ${won(Math.round(point.mean))}`, color: "#cfdcd3" }] : [])],
          markers: [...(point.mean !== null ? [{ y: y(point.mean), color: COLORS.mean }] : []), ...(point.price !== null ? [{ y: y(point.price), color: COLORS.current }] : [])] })} />
    </svg>
  </div>;
}

function IndexedChart({ card }: { card: WholesaleLeadCard }) {
  const [ref, width] = useWidth<HTMLDivElement>(480);
  const chart = card.chart!;
  const points = chart.points;
  const height = 200, left = 36, right = width - 38, top = 14, bottom = 172;
  const values = points.flatMap(point => [point.wholesale, point.retail]).filter((value): value is number => value !== null);
  const low = Math.floor(Math.min(100, ...values) / 10) * 10, high = Math.ceil(Math.max(100, ...values) / 10) * 10;
  const step = high - low > 60 ? 20 : 10;
  const ticks = Array.from({ length: Math.floor((high - low) / step) + 1 }, (_, index) => low + index * step);
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
  return <div ref={ref} className="indicator-chart">
    <div className="indicator-legend" aria-hidden="true">
      <span><i style={{ borderColor: COLORS.wholesale }} />도매</span><span><i style={{ borderColor: COLORS.retail }} />소매</span>
      <span className="text-muted">{chart.baseDate.slice(5).replace("-", "/")} = 100</span>
    </div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="indicator-svg">
      <title>{label}</title>
      <desc>{`마지막 주 도매 ${points.at(-1)?.wholesale ?? "-"}, 소매 ${points.at(-1)?.retail ?? "-"}.`}</desc>
      {ticks.map(tick => <g key={tick}><line x1={left} x2={right} y1={y(tick)} y2={y(tick)} stroke="#e9ece9" />
        <text x={left - 6} y={y(tick) + 4} textAnchor="end" fontSize="10" fill="#727c76">{tick}</text></g>)}
      <line x1={left} x2={right} y1={y(100)} y2={y(100)} stroke="#a3aba6" strokeDasharray="2 3" />
      {dateTicks.map(index => <text key={index} x={x(index)} y={height - 8} textAnchor={index === 0 ? "start" : index === lastIndex ? "end" : "middle"} fontSize="10" fill="#727c76">{points[index].date.slice(5).replace("-", "/")}</text>)}
      {(["wholesale", "retail"] as const).map(key => <path key={key} d={linePath(points.map((point, index) => ({ x: x(index), y: point[key] === null ? null : y(point[key]!) })))}
        fill="none" stroke={COLORS[key]} strokeWidth="2" strokeLinejoin="round" />)}
      {ends.map(end => end.y !== null && <g key={end.key}>
        <circle cx={x(end.index)} cy={end.y} r="4" fill={COLORS[end.key]} stroke="white" strokeWidth="2" />
        <text x={x(end.index) + 8} y={labelY[end.key]! + 4} fontSize="11" fontWeight="600" fill={COLORS[end.key]}>{end.key === "wholesale" ? "도매" : "소매"}</text>
      </g>)}
      <ChartHover points={hover} left={left} right={right} top={top + 20} bottom={bottom} color={COLORS.retail}
        tooltip={point => ({ title: `${point.date.slice(5).replace("-", "/")} 주`,
          lines: [{ text: `도매 ${point.wholesale === null ? "-" : formatNumber(point.wholesale, 1)}`, color: "#f3c98a" },
            { text: `소매 ${point.retail === null ? "-" : formatNumber(point.retail, 1)}`, bold: true }],
          markers: [...(point.wholesale !== null ? [{ y: y(point.wholesale), color: COLORS.wholesale }] : []), ...(point.retail !== null ? [{ y: y(point.retail), color: COLORS.retail }] : [])] })} />
    </svg>
  </div>;
}

/** 카드 맨 위 한 줄 결론. 서버 state만 문장으로 바꾼다(가격으로 방향을 다시 계산하지 않는다). state가 없으면 보이지 않는다. */
const CONCLUSION: Record<string, Record<IndicatorState, string>> = {
  PRICE_POSITION: { down: "1년 중 싼 쪽에 있어요", neutral: "1년 중 중간쯤에 있어요", up: "1년 중 비싼 쪽에 있어요" },
  SEASONAL: { down: "같은 시기 평년보다 싼 편이에요", neutral: "같은 시기 평년 수준이에요", up: "같은 시기 평년보다 비싼 편이에요" },
  WHOLESALE_LEAD: { down: "도매가가 먼저 내렸어요. 소매가도 따라 내릴 수 있어요", neutral: "도매가가 크게 움직이지 않아 소매가를 움직일 신호는 없어요", up: "도매가가 먼저 올랐어요. 소매가도 따라 오를 수 있어요" },
};

/** 전체 "자세히" 토글 값. 카드는 이 값을 따르다가 직접 누르면 그 카드만 따로 열고 닫는다. */
const DetailContext = createContext(false);

/** 접힌 상태에서 눌러보고 싶게 만드는 한 줄. 이 품목의 검증 숫자가 있으면 그 숫자를 보여준다. */
function teaserFor(card: IndicatorCard): string {
  if (card.key === "WHOLESALE_LEAD" && card.evidence?.upAfterRate != null) return `과거엔 도매가가 크게 오른 뒤 ${share(card.evidence.upAfterRate)}가 소매가도 올랐어요`;
  if (card.key === "PRICE_POSITION" && card.verdict === "CONDITIONAL" && card.evidence?.lowAfterRate != null) return `1년 중 싼 쪽일 때 ${share(card.evidence.lowAfterRate)}가 이후 올랐어요`;
  if (card.key === "RETAIL_WHOLESALE_GAP" && card.evidence?.overlapsLead) return "도매 흐름과 겹치는 지표예요";
  return "이 숫자가 무슨 뜻인지, 보통 어떻게 흘러가는지 알려드려요";
}

/** 카드 공통 틀. 한눈에 볼 것(결론·숫자·그림·한 줄 설명)은 항상 보이고, 근거·읽는 법·보통 흐름은 눈에 띄는 버튼으로 펼친다. */
function CardShell({ title, card, children, details, caution }: { title: string; card: IndicatorCard; children: ReactNode; details?: ReactNode; caution?: string }) {
  const all = useContext(DetailContext);
  // 직접 누른 값은 그때의 전체 토글 값과 함께 기억한다. 전체 토글이 바뀌면 직접 누른 값은 무시하고 전체 값을 따른다.
  const [own, setOwn] = useState<{ value: boolean; whenAll: boolean } | null>(null);
  const open = own && own.whenAll === all ? own.value : all;
  const help = INDICATOR_HELP[card.key];
  const panelId = `indicator-fold-${card.key.toLowerCase()}`;
  return <article id={cardAnchor(card.key)} className={`indicator-card ${card.key === "SEASONAL" || card.key === "WHOLESALE_LEAD" ? "has-chart" : ""}`} aria-label={title}>
    <div className="indicator-card-head"><h3>{title}</h3><StateChip state={card.state} label={card.stateLabel} /></div>
    {card.state && CONCLUSION[card.key] && <p className={`indicator-conclusion ${stateClass(card.state)}`}>{CONCLUSION[card.key][card.state]}</p>}
    {children}
    <button type="button" className={`indicator-more ${open ? "is-open" : ""}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOwn({ value: !open, whenAll: all })}>
      <span className="more-text"><b>{open ? "접기" : "근거·읽는 법 보기"}</b>{!open && <em>{teaserFor(card)}</em>}</span>
      <svg className="more-chevron" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    {open && <div id={panelId} className="indicator-fold">
      {help && <p className="indicator-sub"><b>이렇게 읽어요</b>{help.read}</p>}
      {details}
      {help && <div className="indicator-flow"><b>보통 이런 흐름이에요</b><p>{help.tip}{caution ? ` ${caution}` : ""}</p></div>}
    </div>}
    <span className="indicator-tag">{verdictTags[card.verdict]}</span>
  </article>;
}

function Seasonal({ card, unit }: { card: SeasonalCard; unit: string }) {
  const { fact } = card;
  const diff = fact.diffRate;
  const years = fact.normalYears.length ? `직전 ${fact.normalYears.length}년` : "평년";
  return <CardShell title="같은 시기, 다른 해에는 얼마였나" card={card} details={card.evidenceText ? <p className="indicator-why">근거: {card.evidenceText}</p> : null}>
    {fact.currentPrice !== null && <p className="indicator-price"><strong>{won(fact.currentPrice)}</strong><span>이번 주 소매 · {unit}</span></p>}
    {fact.windowDays !== null && fact.recentAvg !== null && fact.normalAvg !== null && <p className="indicator-fact">
      최근 {Math.round(fact.windowDays / 7)}주 평균 <b>{won(fact.recentAvg)}</b>, 평년({years}) {won(fact.normalAvg)}
      {diff === null ? "과 비교합니다." : diff === 0 ? "과 같습니다." : <>보다 <b>{formatNumber(Math.abs(diff * 100), 1)}% {diff < 0 ? "쌉니다" : "비쌉니다"}</b>.</>}
      {fact.cheaperThanCount !== null && fact.historyYears !== null && <> 지난 {fact.historyYears}년 중 {fact.cheaperThanCount}번보다 쌉니다.</>}
    </p>}
    {card.chart ? <SeasonalChart card={card} /> : null}
  </CardShell>;
}

function WholesaleLead({ card }: { card: WholesaleLeadCard }) {
  const { fact, evidence } = card;
  const period = evidence?.periodStart && evidence.periodEnd ? `${evidence.periodStart.slice(0, 7).replace("-", ".")}~${evidence.periodEnd.slice(0, 7).replace("-", ".")}` : null;
  const threshold = evidence?.threshold != null ? `${Math.round(evidence.threshold * 100)}%` : "일정 폭";
  return <CardShell title="도매가가 먼저 움직였나" card={card} details={evidence ? <p className="indicator-why">근거{period ? `(${period})` : ""}: 도매가가 2주 새 {threshold} 넘게 오른 뒤 소매가가 2주 안에 오른 비율 <b>{share(evidence.upAfterRate)}</b>(평소 {share(evidence.baseUpRate)}
      {evidence.sampleUp !== null ? `, ${evidence.sampleUp}번` : ""}), 내린 뒤 내린 비율 <b>{share(evidence.downAfterRate)}</b>(평소 {share(evidence.baseDownRate)}{evidence.sampleDown !== null ? `, ${evidence.sampleDown}번` : ""}).</p> : null}>
    <p className="indicator-fact">최근 2주 도매가 <b>{rate(fact.wholesaleChange2w)}</b>, 소매가 <b>{rate(fact.retailChange2w)}</b>.</p>
    {card.chart && <IndexedChart card={card} />}
  </CardShell>;
}

function HarvestWeather({ card }: { card: HarvestWeatherCard }) {
  const { fact, evidence } = card;
  return <CardShell title="수확지 날씨에 문제가 있나" card={card}>
    {!card.available ? <p className="indicator-fact">이 시기에는 가격과 관계가 확인된 날씨 근거가 없습니다.</p>
      : <p className="indicator-fact">수확지{fact.region ? `(${fact.region})` : ""}의 최근 4주 강수량은 <b>{fact.rain4w === null ? "-" : `${formatNumber(fact.rain4w)}mm`}</b>
        {fact.normalRain4w !== null && <>, 같은 시기 평년은 {formatNumber(fact.normalRain4w)}mm</>}입니다.{card.state === "up" ? " 수확·출하에 차질이 생길 만한 폭우 수준입니다." : card.state ? " 특별한 문제는 없습니다." : ""}</p>}
    {card.available && evidence && evidence.threshold !== null && <p className="indicator-why">근거: 수확지에 4주간 {formatNumber(evidence.threshold)}mm 넘게 비가 온 시기에는 4주 안에 도매가가 오른 경우 <b>{share(evidence.upRateWhenHeavy)}</b> (그 외 {share(evidence.upRateOtherwise)}).</p>}
  </CardShell>;
}

function Arrivals({ card }: { card: ArrivalsCard }) {
  const { fact } = card;
  return <CardShell title="시장에 들어온 물량" card={card}>
    <p className="indicator-fact">최근 4주 {fact.market ?? "도매시장"} 하루 평균 <b>{fact.avgTon4w === null ? "-" : `${formatNumber(fact.avgTon4w)}톤`}</b>
      {fact.normalTon !== null && <>, 평년 {formatNumber(fact.normalTon)}톤 대비 <b>{rate(fact.diffRate)}</b></>}.</p>
    <p className="indicator-why">반입량은 가격과의 관계가 약하게 나와서 상승·하락 판단에는 쓰지 않습니다.</p>
  </CardShell>;
}

/** 한 줄 막대: low~high 범위에서 현재 위치(굵은 점)와 평소 값(세로 눈금). 색은 방향이 아니라 위치만 나타낸다. */
function RangeBar({ low, high, current, mark, lowLabel, highLabel, label }: { low: number; high: number; current: number; mark: number | null;
  lowLabel: string; highLabel: string; label: string }) {
  const at = (value: number) => `${Math.min(100, Math.max(0, (value - low) / Math.max(1e-9, high - low) * 100))}%`;
  return <div className="indicator-range" role="img" aria-label={label}>
    <div className="range-track">{mark !== null && <i className="range-mark" style={{ left: at(mark) }} />}<b className="range-dot" style={{ left: at(current) }} /></div>
    <div className="range-labels"><span>{lowLabel}</span><span>{highLabel}</span></div>
  </div>;
}
const pct = (value: number | null) => value === null ? "-" : `${Math.round(value * 100)}%`;
const md = (date: string | null) => date ? date.slice(5).replace("-", "/") : "";
const periodText = (evidence: LevelEvidence) => evidence.periodStart && evidence.periodEnd
  ? `${evidence.periodStart.slice(0, 7).replace("-", ".")}~${evidence.periodEnd.slice(0, 7).replace("-", ".")}` : null;

/** 과거 기록: 하위·상위 25%였던 주 이후 소매가가 어느 쪽으로 움직였는지(평소 비율과 함께). */
function LevelRecord({ evidence, lowWord, highWord }: { evidence: LevelEvidence; lowWord: string; highWord: string }) {
  const period = periodText(evidence);
  return <p className="indicator-why">과거 기록{period ? `(${period})` : ""}: {lowWord} 뒤 {evidence.aheadWeeks ?? "-"}주 안에 소매가가 오른 비율 <b>{share(evidence.lowAfterRate)}</b>(평소 {share(evidence.lowBaseRate)}
    {evidence.sampleLow !== null ? `, ${evidence.sampleLow}번` : ""}), {highWord} 뒤 내린 비율 <b>{share(evidence.highAfterRate)}</b>(평소 {share(evidence.highBaseRate)}
    {evidence.sampleHigh !== null ? `, ${evidence.sampleHigh}번` : ""}).{evidence.weakSide === "high" ? " 비싼 쪽은 차이가 작아 근거가 약합니다." : evidence.weakSide === "low" ? " 싼 쪽은 차이가 작아 근거가 약합니다." : ""}</p>;
}

function PricePosition({ card, unit }: { card: PricePositionCard; unit: string }) {
  const { fact, evidence } = card;
  const ready = fact.low !== null && fact.high !== null && fact.currentPrice !== null;
  return <CardShell title="지금 가격은 1년 중 어디쯤인가" card={card}
    details={card.verdict === "CONDITIONAL" && evidence ? <LevelRecord evidence={evidence} lowWord="1년 중 싼 쪽(하위 25%)일 때" highWord="비싼 쪽(상위 25%)일 때" /> : null}>
    {fact.currentPrice !== null && <p className="indicator-price"><strong>{won(fact.currentPrice)}</strong><span>최근 가격 · {unit}</span></p>}
    {ready && <RangeBar low={fact.low!} high={fact.high!} current={fact.currentPrice!} mark={fact.avg} label="최근 1년 최저·최고 가격 범위에서 현재 위치"
      lowLabel={`최저 ${won(fact.low!)} (${md(fact.lowDate)})`} highLabel={`최고 ${won(fact.high!)} (${md(fact.highDate)})`} />}
    <p className="indicator-fact">1년 평균({fact.avg === null ? "-" : won(fact.avg)})보다 {fact.diffFromAvg === null ? "" : <><b>{formatNumber(Math.abs(fact.diffFromAvg * 100), 1)}% {fact.diffFromAvg < 0 ? "낮고" : fact.diffFromAvg > 0 ? "높고" : "같고"}</b>, </>}
      1년 중 지금보다 싼 날은 <b>{pct(fact.percentile)}</b>입니다.</p>
  </CardShell>;
}

function RetailWholesaleGap({ card }: { card: RetailWholesaleGapCard }) {
  const { fact, evidence } = card;
  const ready = fact.low !== null && fact.high !== null && fact.ratio !== null;
  const showRecord = evidence?.passed === true;
  return <CardShell title="소매가는 도매가의 몇 배인가" card={card}
    details={showRecord && evidence ? <LevelRecord evidence={evidence} lowWord="배수가 낮은 쪽(하위 25%)일 때" highWord="높은 쪽(상위 25%)일 때" /> : null}
    caution={evidence?.overlapsLead ? "이 배수는 도매 흐름과 같은 이야기를 다르게 보여주는 면이 커서, 따로 믿을 근거로는 세우지 않았습니다." : undefined}>
    {fact.ratio !== null && <p className="indicator-price"><strong>{formatNumber(fact.ratio, 2)}배</strong>
      <span>{fact.retailPrice !== null && fact.wholesalePrice !== null ? `소매 ${won(fact.retailPrice)} ÷ 도매 ${won(fact.wholesalePrice)}(소매 단위로 환산)` : "소매 ÷ 도매"}</span></p>}
    {ready && <RangeBar low={fact.low!} high={fact.high!} current={fact.ratio!} mark={fact.normalRatio} label="최근 1년 소매÷도매 배수 범위에서 현재 위치"
      lowLabel={`${formatNumber(fact.low!, 2)}배`} highLabel={`${formatNumber(fact.high!, 2)}배`} />}
    <p className="indicator-fact">1년 평소 <b>{fact.normalRatio === null ? "-" : `${formatNumber(fact.normalRatio, 2)}배`}</b>, 1년 중 지금보다 배수가 낮은 날은 <b>{pct(fact.percentile)}</b>입니다.</p>
  </CardShell>;
}

function Volatility({ card }: { card: VolatilityCard }) {
  const { fact } = card;
  const weeks = fact.windowDays === null ? null : Math.round(fact.windowDays / 7);
  return <CardShell title="최근 가격이 얼마나 출렁였나" card={card}>
    {fact.recentRange !== null && <p className="indicator-price"><strong>{formatNumber(fact.recentRange * 100, 1)}%</strong>
      <span>최근 {weeks ?? "-"}주 최고와 최저의 차이 ÷ 평균</span></p>}
    <p className="indicator-fact">1년 평소 <b>{fact.normalRange === null ? "-" : `${formatNumber(fact.normalRange * 100, 1)}%`}</b>, 1년 중 이보다 덜 출렁인 날은 <b>{pct(fact.percentile)}</b>입니다.</p>
  </CardShell>;
}

/** 사용자가 던질 질문별로 묶어 보여준다. cols는 카드 폭 배분(차트가 있는 카드를 넓게). */
const SECTIONS: { id: string; title: string; lead: string; keys: string[]; cols: string }[] = [
  { id: "level", title: "지금 가격은 싼 편인가요?", lead: "최근 1년, 그리고 지난 해 같은 시기와 견줘 지금 가격의 수준을 봅니다.", keys: ["PRICE_POSITION", "SEASONAL"], cols: "is-5-7" },
  { id: "signal", title: "가격이 움직일 신호가 있나요?", lead: "도매가와 소매가의 관계에서 앞으로의 방향 단서를 찾아봅니다.", keys: ["WHOLESALE_LEAD", "RETAIL_WHOLESALE_GAP"], cols: "is-7-5" },
  { id: "stability", title: "가격이 안정적인 때인가요?", lead: "최근 4주 동안 가격이 얼마나 흔들렸는지 봅니다.", keys: ["VOLATILITY"], cols: "is-1" },
  { id: "other", title: "그 밖의 근거", lead: "날씨·물량 등 다른 자료로 본 근거입니다.", keys: ["HARVEST_WEATHER", "ARRIVALS"], cols: "is-7-5" },
];

/** 카드를 만들지 않은 이유(작형 전환 직후 등). 빈자리 대신 이유를 보여줘서 다른 품목과 비교해 헷갈리지 않게 한다. */
const NOTICE_TITLE: Record<string, string> = { WHOLESALE_LEAD: "도매가가 먼저 움직였나", VOLATILITY: "최근 가격이 얼마나 출렁였나" };
function NoticeCard({ notice }: { notice: IndicatorNotice }) {
  return <article id={cardAnchor(notice.key)} className="indicator-card is-notice" aria-label={NOTICE_TITLE[notice.key] ?? "잠시 쉬는 지표"}>
    <div className="indicator-card-head"><h3>{NOTICE_TITLE[notice.key] ?? "잠시 쉬는 지표"}</h3><span className="indicator-chip is-neutral">잠시 쉬어요</span></div>
    <p className="indicator-fact">{notice.text}</p>
  </article>;
}

function Card({ card, unit }: { card: IndicatorCard; unit: string }) {
  switch (card.key) {
    case "PRICE_POSITION": return <PricePosition card={card} unit={unit} />;
    case "RETAIL_WHOLESALE_GAP": return <RetailWholesaleGap card={card} />;
    case "VOLATILITY": return <Volatility card={card} />;
    case "SEASONAL": return <Seasonal card={card} unit={unit} />;
    case "WHOLESALE_LEAD": return <WholesaleLead card={card} />;
    case "HARVEST_WEATHER": return <HarvestWeather card={card} />;
    case "ARRIVALS": return <Arrivals card={card} />;
  }
}

type DetailView = "evidence" | "opinion";
const VIEWS: { key: DetailView; label: string; note: string }[] = [
  { key: "evidence", label: "판단 근거", note: "과거 데이터로 확인한 사실" },
  { key: "opinion", label: "모델 의견", note: "AI 7일 예측 · 참고용" },
];

/**
 * Hero card (product + headline + signal chips), then a tab switch between the evidence cards and the model's opinion.
 * The product block and the opinion panel are rendered by the server page and passed in.
 * The opinion panel mounts on first selection, so its chart and factor requests wait until someone looks.
 */
export function PriceIndicators({ item, product, opinion }: { item: LivePrice; product: ReactNode; opinion: ReactNode }) {
  const { data, error, loading, reload } = usePriceIndicators(item.id);
  const [view, setView] = useState<DetailView>("evidence");
  const [detailAll, setDetailAll] = useState(false);
  const [opinionSeen, setOpinionSeen] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const cardKeys = new Set<string>(data?.cards.map(card => card.key) ?? []);
  function select(next: DetailView, focus = false) {
    setView(next);
    if (next === "opinion") setOpinionSeen(true);
    if (focus) tabs.current[VIEWS.findIndex(entry => entry.key === next)]?.focus();
  }
  function jumpToCard(event: MouseEvent<HTMLAnchorElement>, key: string) {
    // The card may sit in the hidden tab, so switch first and scroll once it is rendered.
    event.preventDefault();
    select("evidence");
    requestAnimationFrame(() => {
      const anchor = cardAnchor(key);
      if (window.location.hash === `#${anchor}`) document.getElementById(anchor)?.scrollIntoView({ block: "start" });
      else window.location.hash = anchor;
    });
  }
  let conclusion: ReactNode;
  if (loading) conclusion = <p role="status" className="hero-muted">지금 상황을 정리하는 중입니다.</p>;
  else if (error || !data) conclusion = <div role="alert" className="hero-muted"><p>{error ?? "지표를 불러오지 못했습니다."}</p><button type="button" className="hero-retry" onClick={reload}>다시 시도</button></div>;
  else if (!data.headline) conclusion = <p className="hero-muted">{data.unavailableReason ?? "아직 보여줄 지표가 없습니다."}</p>;
  else conclusion = <>
    <p className="indicator-headline">{data.headline}</p>
    {data.signals.length > 0 && <ul className="indicator-signals" aria-label="지표별 상태 (누르면 해당 근거로 이동)">{data.signals.map(signal => {
      const chip = <>{signal.label} · {signal.stateLabel}</>;
      return <li key={signal.key}>{cardKeys.has(signal.key)
        ? <a href={`#${cardAnchor(signal.key)}`} onClick={event => jumpToCard(event, signal.key)} className={`indicator-chip is-link ${stateClass(signal.state)}`}>{chip}<svg aria-hidden="true" className="chip-arrow" width="12" height="12" viewBox="0 0 16 16"><path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
        : <span className={`indicator-chip ${stateClass(signal.state)}`}>{chip}</span>}</li>;
    })}</ul>}
    <p className="indicator-disclaimer">{DISCLAIMER}</p>
  </>;
  let evidence: ReactNode;
  if (loading) evidence = <p role="status" className="detail-view-empty">근거를 불러오는 중입니다.</p>;
  else if (error || !data) evidence = <p className="detail-view-empty">근거를 불러오지 못했습니다. 위 요약의 ‘다시 시도’를 눌러 주세요.</p>;
  else if (!data.cards.length) evidence = <p className="detail-view-empty">{data.unavailableReason ?? "아직 보여줄 근거가 없습니다."}</p>;
  else evidence = <DetailContext.Provider value={detailAll}><div className="indicator-sections">
    <div className="indicator-viewmode"><div role="group" aria-label="카드 보기 방식">
      <button type="button" aria-pressed={!detailAll} onClick={() => setDetailAll(false)}>한눈에 보기</button>
      <button type="button" aria-pressed={detailAll} onClick={() => setDetailAll(true)}>모두 자세히 보기</button></div>
      <p>카드마다 &ldquo;근거·읽는 법 보기&rdquo;를 눌러 펼칠 수도 있어요.</p></div>
    {SECTIONS.map(section => {
    const cards = section.keys.flatMap(key => data.cards.find(card => card.key === key) ?? []);
    const notices = section.keys.flatMap(key => data.notices.find(notice => notice.key === key && !cards.some(card => card.key === key)) ?? []);
    if (!cards.length && !notices.length) return null;
    return <section key={section.id} className="indicator-section" aria-labelledby={`indicator-section-${section.id}`}>
      <div className="indicator-section-head"><h3 id={`indicator-section-${section.id}`}>{section.title}</h3><p>{section.lead}</p></div>
      <div className={`indicator-grid ${section.cols}`}>{cards.map(card => <Card key={card.key} card={card} unit={item.unit} />)}{notices.map(notice => <NoticeCard key={notice.key} notice={notice} />)}</div>
    </section>;
  })}</div></DetailContext.Provider>;
  return <>
    <section className="price-hero" aria-labelledby="hero-conclusion-title">
      {product}
      <div className="hero-conclusion">
        <div className="hero-conclusion-head"><h2 id="hero-conclusion-title" className="indicator-eyebrow">지금 상황 한 줄 요약</h2>
          {data?.asOfDate && <span>지표 기준일 <time dateTime={data.asOfDate}>{formatDate(data.asOfDate)}</time>{data.stale && <b className="indicator-stale"> · 오래된 기준일</b>}</span>}</div>
        {conclusion}
      </div>
    </section>
    <div className="detail-views">
      <div role="tablist" aria-label="상세 보기 전환" className="detail-tabs" onKeyDown={event => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault();
        const index = VIEWS.findIndex(entry => entry.key === view);
        const next = event.key === "Home" ? 0 : event.key === "End" ? VIEWS.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + VIEWS.length) % VIEWS.length;
        select(VIEWS[next].key, true);
      }}>
        {VIEWS.map((entry, index) => <button key={entry.key} ref={element => { tabs.current[index] = element; }} type="button" role="tab" id={`detail-tab-${entry.key}`}
          aria-selected={view === entry.key} aria-controls={`detail-panel-${entry.key}`} tabIndex={view === entry.key ? 0 : -1}
          className="detail-tab" onClick={() => select(entry.key)}>
          <span className="detail-tab-label">{entry.label}</span><span className="detail-tab-note">{entry.note}</span>
        </button>)}
      </div>
      <section role="tabpanel" id="detail-panel-evidence" aria-labelledby="detail-tab-evidence" hidden={view !== "evidence"} className="price-indicators">{evidence}</section>
      <section role="tabpanel" id="detail-panel-opinion" aria-labelledby="detail-tab-opinion" hidden={view !== "opinion"}>{opinionSeen && opinion}</section>
    </div>
  </>;
}
