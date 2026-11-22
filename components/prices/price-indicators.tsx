"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { ArrivalsCard, HarvestWeatherCard, IndicatorCard, IndicatorState, IndicatorVerdict, LivePrice, SeasonalCard, WholesaleLeadCard } from "@/lib/prices/model";
import { formatDate, formatNumber, formatPercent, won } from "@/lib/prices/format";
import { usePriceIndicators } from "@/lib/prices/use-prices";
import { ChartHover } from "./chart-hover";

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

function CardShell({ title, card, children }: { title: string; card: IndicatorCard; children: ReactNode }) {
  return <article id={cardAnchor(card.key)} className={`indicator-card ${card.key === "SEASONAL" || card.key === "WHOLESALE_LEAD" ? "has-chart" : ""}`} aria-label={title}>
    <div className="indicator-card-head"><h3>{title}</h3><StateChip state={card.state} label={card.stateLabel} /></div>
    {children}
    <span className="indicator-tag">{verdictTags[card.verdict]}</span>
  </article>;
}

function Seasonal({ card, unit }: { card: SeasonalCard; unit: string }) {
  const { fact } = card;
  const diff = fact.diffRate;
  const years = fact.normalYears.length ? `직전 ${fact.normalYears.length}년, ${fact.normalYears[0]}~${fact.normalYears.at(-1)}` : "평년";
  return <CardShell title="같은 달, 다른 해에는 얼마였나" card={card}>
    {fact.currentPrice !== null && <p className="indicator-price"><strong>{won(fact.currentPrice)}</strong><span>이번 주 소매 · {unit}</span></p>}
    {fact.month !== null && fact.monthAvg !== null && fact.normalAvg !== null && <p className="indicator-fact">
      {fact.month}월 평균 <b>{won(fact.monthAvg)}</b>, 평년({years}) {won(fact.normalAvg)}
      {diff === null ? "과 비교합니다." : diff === 0 ? "과 같습니다." : <>보다 <b>{formatNumber(Math.abs(diff * 100), 1)}% {diff < 0 ? "쌉니다" : "비쌉니다"}</b>.</>}
      {fact.cheaperThanCount !== null && fact.historyYears !== null && <> 지난 {fact.historyYears}년의 {fact.month}월 중 {fact.cheaperThanCount}번보다 쌉니다.</>}
    </p>}
    {card.chart ? <SeasonalChart card={card} /> : null}
    {card.evidenceText && <p className="indicator-why">근거: {card.evidenceText}</p>}
  </CardShell>;
}

const leadSentences: Record<IndicatorState, string> = {
  neutral: "도매가가 크게 움직이지 않아 소매가를 밀어 올리거나 끌어내릴 신호가 없습니다.",
  up: "도매가가 먼저 올랐습니다. 소매가가 따라 오를 수 있습니다.",
  down: "도매가가 먼저 내렸습니다. 소매가가 따라 내릴 수 있습니다.",
};
function WholesaleLead({ card }: { card: WholesaleLeadCard }) {
  const { fact, evidence } = card;
  const period = evidence?.periodStart && evidence.periodEnd ? `${evidence.periodStart.slice(0, 7).replace("-", ".")}~${evidence.periodEnd.slice(0, 7).replace("-", ".")}` : null;
  const threshold = evidence?.threshold != null ? `${Math.round(evidence.threshold * 100)}%` : "일정 폭";
  return <CardShell title="도매가가 먼저 움직였나" card={card}>
    <p className="indicator-fact">최근 2주 도매가 <b>{rate(fact.wholesaleChange2w)}</b>, 소매가 <b>{rate(fact.retailChange2w)}</b>.{card.state && <> {leadSentences[card.state]}</>}</p>
    {card.chart && <IndexedChart card={card} />}
    {evidence && <p className="indicator-why">근거{period ? `(${period})` : ""}: 도매가가 2주 새 {threshold} 넘게 오른 뒤 2주 안에 소매가가 오른 경우 <b>{share(evidence.upAfterRate)}</b> (평소 {share(evidence.baseUpRate)}
      {evidence.sampleUp !== null ? `, ${evidence.sampleUp}번` : ""}). 내린 뒤 내린 경우 <b>{share(evidence.downAfterRate)}</b> (평소 {share(evidence.baseDownRate)}{evidence.sampleDown !== null ? `, ${evidence.sampleDown}번` : ""}).</p>}
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

function Card({ card, unit }: { card: IndicatorCard; unit: string }) {
  switch (card.key) {
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
        ? <a href={`#${cardAnchor(signal.key)}`} onClick={event => jumpToCard(event, signal.key)} className={`indicator-chip is-link ${stateClass(signal.state)}`}>{chip}<span aria-hidden="true" className="chip-arrow">↓</span></a>
        : <span className={`indicator-chip ${stateClass(signal.state)}`}>{chip}</span>}</li>;
    })}</ul>}
    <p className="indicator-disclaimer">{DISCLAIMER}</p>
  </>;
  let evidence: ReactNode;
  if (loading) evidence = <p role="status" className="detail-view-empty">근거를 불러오는 중입니다.</p>;
  else if (error || !data) evidence = <p className="detail-view-empty">근거를 불러오지 못했습니다. 위 요약의 ‘다시 시도’를 눌러 주세요.</p>;
  else if (!data.cards.length) evidence = <p className="detail-view-empty">{data.unavailableReason ?? "아직 보여줄 근거가 없습니다."}</p>;
  else evidence = <div className="indicator-grid">{data.cards.map(card => <Card key={card.key} card={card} unit={item.unit} />)}</div>;
  return <>
    <section className="price-hero" aria-labelledby="hero-conclusion-title">
      {product}
      <div className="hero-conclusion">
        <div className="hero-conclusion-head"><h2 id="hero-conclusion-title" className="indicator-eyebrow">지금 상황 한 줄 요약</h2>
          {data?.asOfDate && <span>지표 기준일 <time dateTime={data.asOfDate}>{formatDate(data.asOfDate)}</time></span>}</div>
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
