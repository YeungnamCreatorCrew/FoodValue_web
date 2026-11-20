"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate, formatNumber, won } from "@/lib/prices/format";
import { forecastChart } from "@/lib/prices/forecast-chart";
import { priceChartStyle } from "@/lib/prices/chart-style";
import type { LivePrice, HistoryPeriod } from "@/lib/prices/model";
import { usePriceChart } from "@/lib/prices/use-prices";
import { withForecast } from "@/lib/prices/mapper";
import { ChartHover } from "./chart-hover";

export function PriceChart({ item: summary, presentation = "detail" }: { item: LivePrice; presentation?: "detail" | "home" }) {
  const [period, setPeriod] = useState<HistoryPeriod>(30);
  const { data, loading, error, reload } = usePriceChart(summary.id, period);
  const item = data ? withForecast({ ...summary, priceHistory: data.priceHistory, historyEndDate: data.historyEndDate }, data.forecast, data.forecastBaseDate) : summary;
  const container = useRef<HTMLElement>(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWide(entries[0].contentRect.width >= 640));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const width = wide ? 760 : 360;
  const left = 52, right = width - 14;
  const chart = forecastChart(item, period, { left, right, top: 45, bottom: 205 });
  const { actual, forecast, points, min, max, y, currentX, forecastX, actualPath, forecastPath } = chart;
  const chartLabel = item.name + " 가격 흐름 및 7일 예측";
  return <section ref={container} className="price-chart-section" style={priceChartStyle(item)} aria-label={chartLabel}>
    <div className="price-chart-heading">
      {presentation === "detail" ? <h2>가격 흐름 및 7일 예측</h2> : <span className="text-sm text-muted">조회 기간</span>}
      <div className="chart-periods" role="group" aria-label="과거 가격 조회 기간">{([14, 30, 90] as const).map(value => <button type="button" key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value}일</button>)}</div>
    </div>
    <p className="chart-source-notice">실제 소매 가격 이력과 일별 7일 예측입니다.</p>
    {loading ? <p role="status" className="py-10 text-sm text-muted">가격 추이를 불러오는 중입니다.</p> : error ? <div role="alert" className="py-10 text-sm text-muted"><p>{error}</p><button type="button" onClick={reload}>다시 시도</button></div> : <>
      {!actual.length && <p className="text-sm text-muted">선택한 기간의 가격 이력이 없습니다.</p>}
      {!forecast.length && <p className="text-sm text-muted">아직 예측 정보가 없습니다.</p>}
      {(actual.length > 0 || forecast.length > 0) && <>
        <div className="chart-legend"><span><i className="legend-actual" />실제 가격</span><span><i className="legend-dashed" />7일 예측</span></div>
        <svg viewBox={"0 0 " + width + " 260"} className="price-trend-svg" role="img" aria-label={chartLabel}>
          <title>{chartLabel}</title>
          <desc>실선은 가격이 조사된 {actual.length}일을 순서대로 이은 것이고(주말·공휴일 등 미조사일은 축에서 제외), 점선은 서버의 일별 예측 {forecast.length}개입니다.</desc>
          <rect x={Math.max(left, currentX)} y="28" width={Math.max(0, right - Math.max(left, currentX))} height="184" fill="#eef7f0" rx="5" />
          {[max, (max + min) / 2, min].map(value => <g key={value}><line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="#e8eee8" /><text x={left - 8} y={y(value) + 4} textAnchor="end" fill="#65776b" fontSize="11">{formatNumber(value)}</text></g>)}
          <text x={left - 8} y="19" textAnchor="end" fontSize="10" fill="#65776b">원</text>
          <path data-series="history" data-point-count={actual.length} d={actualPath} fill="none" stroke="var(--price-chart-color)" strokeWidth="2" strokeLinejoin="round" />
          <path data-series="forecast" data-point-count={forecast.length} d={forecastPath} fill="none" stroke="var(--price-chart-color)" strokeWidth="2.5" strokeDasharray="6 5" />
          {points.filter(point => point.kind === "actual").map(point => <circle key={point.date} cx={point.x} cy={point.y} r="1.5" fill="var(--price-chart-color)" />)}
          {currentX >= left && <line x1={currentX} x2={currentX} y1="28" y2="212" stroke="#6b8c72" strokeDasharray="4 4" />}
          {item.currentPrice !== null && currentX >= left && <circle cx={currentX} cy={y(item.currentPrice)} r="5" fill="var(--price-chart-color)" stroke="white" strokeWidth="2" />}
          {item.forecastPrice !== null && <circle cx={forecastX} cy={y(item.forecastPrice)} r="5" fill="var(--price-chart-color)" stroke="white" strokeWidth="2" />}
          {points[0] && <text x={points[0].x} y="231" fontSize="11" fill="#65776b">{points[0].date.slice(5)}</text>}
          {currentX >= left && <text x={currentX - 4} y="231" textAnchor="end" fontSize="11" fill="#334c3c">관측 {item.priceDate?.slice(5) ?? "-"}</text>}
          <text x={right} y="251" textAnchor="end" fontSize="11" fill="#14532d">예측 {item.forecastDate?.slice(5) ?? "-"}</text>
          <ChartHover points={points.map(point => ({ date: point.date, value: point.price, x: point.x, y: point.y, kind: point.kind,
            previous: point.previous && { date: point.previous.date, value: point.previous.price } }))} left={left} right={right} top={45} bottom={205} />
        </svg>
      </>}
      <dl className="chart-endpoints"><div><dt>현재 · {formatDate(item.priceDate ?? null)}</dt><dd>{won(item.currentPrice)}</dd></div><div><dt>7일 후 · {formatDate(item.forecastDate)}</dt><dd>{won(item.forecastPrice)}</dd></div></dl>
      <p className="chart-footnote">최근 {period}일 중 가격이 조사된 {actual.length}일 · 그래프에 커서를 올리면 날짜별 가격을 볼 수 있습니다. 점선은 서버에서 제공한 일별 예측입니다.</p>
    </>}
  </section>;
}
