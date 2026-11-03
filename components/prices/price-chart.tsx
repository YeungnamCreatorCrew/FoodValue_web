"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate, formatNumber, won } from "@/lib/prices/format";
import { forecastChart } from "@/lib/prices/forecast-chart";
import type { PriceRecord } from "@/lib/prices/poc-types";

export function PriceChart({ item, presentation = "detail" }: { item: PriceRecord; presentation?: "detail" | "home" }) {
  const [period, setPeriod] = useState(30);
  const container = useRef<HTMLElement>(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWide(entries[0].contentRect.width >= 640));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const width = wide ? 760 : 360;
  const left = 52, right = width - 14;
  const { past, min, max, x, y, currentX: todayX, actualPath, forecastPath } = forecastChart(item, period, { left, right, top: 45, bottom: 205 });
  const chartLabel = `${item.name} 가격 흐름 및 7일 예측`;
  const description = `${item.isPoc ? "KAMIS 실제 가격 이력" : "DEMO 가격 이력"} ${past.length}개. ${formatDate(item.baseDate)} 현재 ${won(item.currentPrice)}, ${formatDate(item.forecastDate)} 예상 ${won(item.forecastPrice)}. 점선은 두 기준점을 연결하며 중간 날짜의 예측값을 의미하지 않습니다.`;
  return <section ref={container} className="price-chart-section" aria-label={chartLabel}>
    <div className="price-chart-heading">
      {presentation === "detail" ? <h2>가격 흐름 및 7일 예측</h2> : <span className="text-sm text-muted">조회 기간</span>}
      <div className="chart-periods" role="group" aria-label="과거 가격 조회 기간">{[14, 30, 90].map(value => <button type="button" key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{`${value}일`}</button>)}</div>
    </div>
    <p className={item.isPoc ? "chart-source-notice" : "chart-demo-notice"}>{item.isPoc ? "실제 KAMIS 가격 이력과 Colab PoC의 7일 후 예측입니다." : "이 품목의 가격과 그래프는 모두 DEMO 데이터입니다."}</p>
    <div className="chart-legend"><span><i className="legend-actual" />{item.isPoc ? "실제 가격" : "가격 이력 · DEMO"}</span><span><i className="legend-dashed" />{item.isPoc ? "7일 예측" : "7일 예측 · DEMO"}</span></div>
    <svg viewBox={`0 0 ${width} 260`} className="price-trend-svg" role="img" aria-label={chartLabel}>
      <title>{chartLabel}</title>
      <desc>{description}</desc>
      <rect x={todayX} y="28" width={right - todayX} height="184" fill="#eef7f0" rx="5" />
      {[max, (max + min) / 2, min].map(value => <g key={value}><line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="#e8eee8" /><text x={left - 8} y={y(value) + 4} textAnchor="end" fill="#65776b" fontSize="11">{formatNumber(value)}</text></g>)}
      <text x={left - 8} y="19" textAnchor="end" fontSize="10" fill="#65776b">원</text>
      <path data-series="history" data-point-count={past.length} d={actualPath} fill="none" stroke="#23804d" strokeWidth="2" strokeLinejoin="round" />
      <path data-series="forecast" data-point-count="2" d={forecastPath} fill="none" stroke="#14532d" strokeWidth="2.5" strokeDasharray="6 5" />
      <line x1={todayX} x2={todayX} y1="28" y2="212" stroke="#6b8c72" strokeDasharray="4 4" />
      <circle cx={todayX} cy={y(item.currentPrice)} r="5" fill="#334c3c" stroke="white" strokeWidth="2" />
      <circle cx={right} cy={y(item.forecastPrice)} r="5" fill="#14532d" stroke="white" strokeWidth="2" />
      {past[0] && <text x={x(past[0].date)} y="231" fontSize="11" fill="#65776b">{past[0].date.slice(5)}</text>}
      <text x={todayX - 4} y="231" textAnchor="end" fontSize="11" fill="#334c3c">{`기준 ${item.baseDate.slice(5)}`}</text>
      <text x={right} y="251" textAnchor="end" fontSize="11" fill="#14532d">{`예측 ${item.forecastDate.slice(5)}`}</text>
    </svg>
    <dl className="chart-endpoints"><div><dt>현재 · {formatDate(item.baseDate)}</dt><dd>{won(item.currentPrice)}</dd></div><div><dt>7일 후 · {formatDate(item.forecastDate)}</dt><dd>{won(item.forecastPrice)}</dd></div></dl>
    <p className="chart-footnote">기준일 포함 최근 {period}일 · 관측 {past.length}건. 미제공 날짜의 가격은 생성하지 않습니다. 점선은 현재가와 7일 후 예측값의 연결선입니다.</p>
  </section>;
}
