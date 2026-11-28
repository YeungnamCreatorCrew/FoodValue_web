"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LivePrice, PriceHistoryPeriod, PricePoint } from "@/lib/prices/model";
import { forecastChart } from "@/lib/prices/forecast-chart";
import { formatNumber, shortDate, won } from "@/lib/prices/format";
import { usePriceHistory } from "@/lib/prices/use-prices";
import { EmptyState, ErrorState, Skeleton } from "@/components/fv/state";
import { ChartHover } from "./chart-hover";

const PERIODS: { days: PriceHistoryPeriod; label: string }[] = [{ days: 30, label: "1개월" }, { days: 90, label: "3개월" }, { days: 180, label: "6개월" }, { days: 365, label: "1년" }];
const PERIOD_WORD: Record<number, string> = { 30: "1개월", 90: "3개월", 180: "6개월", 365: "1년" };
const FULL_H = 256, FULL_TOP = 36, FULL_BOTTOM = 204;
/** 상세 위 카드 안(bare)에서는 첫 화면에 결론·근거까지 들어오도록 그래프를 낮게 그린다. */
const BARE_H = 172, BARE_TOP = 22, BARE_BOTTOM = 146;

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(288, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** 실제 가격 선. 주말·공휴일(4일 이하)은 이어 그리고, 그보다 긴 조사 공백(값 없음)은 선을 끊는다. */
function gapPath(points: { date: string; x: number; y: number }[]) {
  const day = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000;
  return points.map((point, index) => `${index && day(point.date) - day(points[index - 1].date) <= 4 ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join("");
}

/** 그래프를 읽어 주는 한 문장(화면 낭독기용 설명과 같은 내용). */
function describe(item: LivePrice, days: number, first: number | null, last: number | null) {
  const past = first !== null && last !== null ? `최근 ${PERIOD_WORD[days] ?? `${days}일`} 동안 ${won(first)}에서 ${won(last)}이 됐어요(${item.unit}).` : `최근 ${PERIOD_WORD[days] ?? `${days}일`} 가격 기록이 없어요.`;
  // 예측 값은 아래 'AI 7일 예측' 상자에서 한 번만 말한다(같은 말 반복 방지).
  return past;
}

/** 상세 가격 흐름 그래프: 실제 가격 = 실선, AI 7일 예측 = 점선 + 범위 띠 + '참고'. 기간을 바꿔도 높이가 그대로다. */
/** yearHistory: 서버가 미리 받은 365일 이력. 있으면 기간을 바꿔도 다시 부르지 않고 잘라서 쓴다. */
/** bare: 상세 위 카드 안에 넣을 때 카드 테두리 없이 그린다. */
export function PriceTrend({ item, baseline, yearHistory = null, bare = false, forecastName }: { item: LivePrice; baseline: boolean; yearHistory?: { priceHistory: PricePoint[]; historyEndDate: string } | null; bare?: boolean; /** 범례의 예측 이름(기본 "AI 7일 예측"). */ forecastName?: string }) {
  // 기간은 주소(?period=)에 남겨 뒤로 가기로 돌아와도 그대로다. history.replaceState라 서버를 다시 부르지 않는다.
  const params = useSearchParams();
  const fromUrl = Number(params.get("period"));
  const [period, setPeriodState] = useState<PriceHistoryPeriod>(PERIODS.some(entry => entry.days === fromUrl) ? fromUrl as PriceHistoryPeriod : 90);
  const setPeriod = (days: PriceHistoryPeriod) => {
    setPeriodState(days);
    const query = new URLSearchParams(window.location.search);
    if (days === 90) query.delete("period"); else query.set("period", String(days));
    window.history.replaceState(null, "", `${window.location.pathname}${query.size ? `?${query}` : ""}${window.location.hash}`);
  };
  const fetched = usePriceHistory(item.id, period, yearHistory !== null);
  const { data, loading, error, reload } = yearHistory ? { data: yearHistory, loading: false, error: undefined, reload: () => {} } : fetched;
  // 기간을 바꾸는 동안 이전 그래프를 흐리게 남겨 높이가 튀지 않게 한다.
  const [kept, setKept] = useState(data);
  if (data && data !== kept) setKept(data);
  const history = data ?? kept;
  const LABEL = bare ? 4 : 20;
  const H = bare ? BARE_H : FULL_H, TOP = bare ? BARE_TOP : FULL_TOP, BOTTOM = bare ? BARE_BOTTOM : FULL_BOTTOM;
  const [ref, width] = useWidth();
  const right = width - 16;
  // 세로축 숫자 폭에 맞춰 왼쪽 여백을 잡는다(큰 값도 카드 밖으로 나가지 않게).
  const LEFT = Math.max(56, formatNumber(Math.round(Math.max(item.currentPrice ?? 0, ...(history?.priceHistory ?? []).map(point => point.price ?? 0), ...item.forecastPoints.map(point => point.upper ?? point.price ?? 0)))).length * 9 + 16);
  const chartItem = history ? { ...item, priceHistory: history.priceHistory, historyEndDate: history.historyEndDate } : item;
  const chart = forecastChart(chartItem, period, { left: LEFT, right, top: TOP + 16, bottom: BOTTOM });
  const forecastLabel = baseline ? "직전 가격 유지" : forecastName ?? "AI 7일 예측";
  const fp = chart.points.filter(point => point.kind === "forecast");
  const range = item.forecastPoints.filter(point => point.lower !== null && point.upper !== null && fp.some(slot => slot.date === point.date));
  // 직전 가격 유지(BASELINE)는 AI 예측이 아니라서 범위 띠를 그리지 않는다(범례에 "AI 예측 범위"가 뜨면 거짓이 된다).
  const band = !baseline && range.length > 1 ? range.map((point, i) => `${i ? "L" : "M"}${chart.x(point.date).toFixed(1)},${chart.y(point.upper!).toFixed(1)}`).join("")
    + range.toReversed().map(point => `L${chart.x(point.date).toFixed(1)},${chart.y(point.lower!).toFixed(1)}`).join("") + "Z" : null;
  // 기간 처음 대비 마지막이 1% 넘게 오르면 빨강, 내리면 파랑(홈 흐름선·지난주 대비와 같은 색 규칙). 선과 아래 면에 쓴다.
  const first = chart.actual[0]?.price ?? null, lastPrice = chart.actual.at(-1)?.price ?? null;
  const change = first && lastPrice ? (lastPrice - first) / first : 0;
  const tone = change > 0.01 ? "chart-up" : change < -0.01 ? "chart-down" : "chart-flat";
  const actualPoints = chart.points.filter(point => point.kind === "actual" && point.price !== null);
  const area = actualPoints.length > 1 ? `M${actualPoints[0].x.toFixed(1)},${BOTTOM}` + actualPoints.map(point => `L${point.x.toFixed(1)},${point.y.toFixed(1)}`).join("") + `L${actualPoints.at(-1)!.x.toFixed(1)},${BOTTOM}Z` : null;
  const summary = describe(item, period, chart.actual[0]?.price ?? null, chart.actual.at(-1)?.price ?? null);
  const forecastStart = fp.length ? chart.currentX : null;
  const actualDates = chart.points.filter(point => point.kind === "actual").map(point => Date.parse(`${point.date}T00:00:00Z`));
  const hasGap = actualDates.some((time, index) => index > 0 && time - actualDates[index - 1] > 4 * 86_400_000);
  return <section className={`${bare ? "trend is-bare" : "fv-card trend"} ${tone}`} aria-labelledby="trend-title">
    <div className="trend-head">
      <h2 id="trend-title" className="fv-h2">가격 흐름</h2>
      {item.status !== "NO_DATA" && <div className="fv-chips" role="group" aria-label="그래프 기간">
        {PERIODS.map(entry => <button key={entry.days} type="button" className="fv-chip" aria-pressed={period === entry.days} onClick={() => setPeriod(entry.days)}>{entry.label}</button>)}
      </div>}
    </div>
    {(chart.actual.length > 0 || fp.length > 0) && <ul className="trend-legend" aria-hidden="true">
      <li><i className="is-actual" />실제 가격</li>
      {fp.length > 0 && <li><i className="is-forecast" />{forecastLabel} · 참고</li>}
      {band && <li><i className="is-band" />{forecastName ?? "AI 7일 예측"} 범위</li>}
    </ul>}
    <div ref={ref} className="trend-plot" aria-busy={loading}>
      {error && !history ? <ErrorState message={error} onRetry={reload} /> : !history ? <Skeleton className="trend-skel" />
        : !chart.actual.length && !fp.length ? <EmptyState title="가격 기록 없음">{item.status === "NO_DATA" ? "조사된 가격이 없어 그래프와 예측을 그릴 수 없어요." : `최근 ${PERIOD_WORD[period]} 기록이 없어요. 기간을 늘려 보세요.`}</EmptyState> :
        <svg viewBox={`0 0 ${width} ${H}`} width={width} height={H} role="img" aria-label={`${item.name} 가격 흐름`} className={loading ? "is-updating" : undefined}>
          <title>{`${item.name} 가격 흐름`}</title>
          <desc>{summary}</desc>
          {forecastStart !== null && <g><rect x={forecastStart} y={TOP} width={Math.max(0, right - forecastStart)} height={BOTTOM - TOP + 8} fill="var(--fv-subtle)" />
            <text x={right - 4} y={TOP - 8} textAnchor="end" fontSize="12" fontWeight="700" fill="var(--fv-ref)">참고</text></g>}
          {chart.ticks.map(value => <g key={value}>
            <line x1={LEFT} x2={right} y1={chart.y(value)} y2={chart.y(value)} stroke="var(--fv-chart-grid)" />
            <text x={LEFT - 8} y={chart.y(value) + 4} textAnchor="end" fontSize="12" fill="var(--fv-text-3)">{formatNumber(value)}</text></g>)}
          <text x={LEFT - 8} y={TOP - 8} textAnchor="end" fontSize="12" fill="var(--fv-text-3)">원</text>
          {band && <path d={band} fill="var(--fv-chart-band)" />}
          {area && <path d={area} fill="var(--fv-chart-actual)" fillOpacity="0.08" />}
          <path d={gapPath(chart.points.filter(point => point.kind === "actual"))} fill="none" stroke="var(--fv-chart-actual)" strokeWidth="2.5" strokeLinejoin="round" />
          <path d={chart.forecastPath} fill="none" stroke="var(--fv-ref)" strokeWidth="2.5" strokeDasharray="6 5" />
          {item.currentPrice !== null && chart.currentX >= LEFT && <circle cx={chart.currentX} cy={chart.y(chart.actual.at(-1)?.price ?? item.currentPrice)} r="5" fill="var(--fv-chart-actual)" stroke="var(--fv-bg)" strokeWidth="2" />}
          {chart.points[0] && <text x={chart.points[0].x} y={H - LABEL} fontSize="12" fill="var(--fv-text-3)">{shortDate(chart.points[0].date)}</text>}
          {chart.currentX >= LEFT && chart.currentX - chart.points[0]?.x > 64 && <text x={chart.currentX} y={H - LABEL} textAnchor={fp.length ? "end" : "middle"} fontSize="12" fontWeight="700" fill="var(--fv-text)">{shortDate(chart.actual.at(-1)?.date ?? null)}</text>}
          {fp.length > 0 && right - chart.currentX > 48 && <text x={right} y={H - LABEL} textAnchor="end" fontSize="12" fill="var(--fv-ref)">{shortDate(fp.at(-1)!.date)}</text>}
          <ChartHover points={chart.points.map(point => ({ date: point.date, value: point.price, x: point.x, y: point.y, kind: point.kind,
            previous: point.previous && { date: point.previous.date, value: point.previous.price } }))} left={LEFT} right={right} top={TOP + 16} bottom={BOTTOM} color="var(--fv-chart-actual)" unit={`원(${item.unit})`} />
        </svg>}
    </div>
    {!bare && (chart.actual.length > 0 || fp.length > 0) && <p className="fv-cap trend-note">{summary} <span className="nowrap">주말·공휴일은</span> 건너뛰어요.{hasGap && " 4일 넘게 조사가 없던 구간은 선을 끊었어요."}</p>}
  </section>;
}
