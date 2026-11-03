import type { PriceRecord } from "@/lib/prices/poc-types";
import { forecastChart } from "@/lib/prices/forecast-chart";
import { formatDate, formatNumber, won } from "@/lib/prices/format";
import "./forecast-sparkline.css";

export function ForecastSparkline({ item, historyDays = 14, variant = "card" }: {
  item: PriceRecord; historyDays?: number; variant?: "hero" | "card" | "detail";
}) {
  const card = variant === "card", detail = variant === "detail";
  const height = card ? 156 : 168;
  const left = detail ? 44 : 12, right = 348, top = 30, bottom = height - (card ? 12 : 24);
  const chart = forecastChart(item, historyDays, { left, right, top, bottom });
  if (!chart.past.length) return null;
  const title = `${item.name} ${item.isPoc ? "실제 가격 및 AI" : "DEMO 가격 및"} 7일 예측`;
  const description = `${formatDate(item.baseDate)} 현재 ${won(item.currentPrice)}에서 ${formatDate(item.forecastDate)} 예측 ${won(item.forecastPrice)}까지 점선으로 연결합니다. 실선은 기존 ${chart.past.length}개 ${item.isPoc ? "실제" : "DEMO"} 관측값입니다. 중간 날짜의 예측값은 제공되지 않았습니다.`;
  return <div className={`forecast-sparkline forecast-sparkline--${variant}`} data-data-kind={item.isPoc ? "poc" : "demo"}>
    <svg viewBox={`0 0 360 ${height}`} role="img" aria-label={title}>
      <title>{title}</title><desc>{description}</desc>
      <rect x={chart.currentX} y="2" width={right - chart.currentX + 8} height={height - 4} rx="6" fill="#e9f5ec" />
      {[chart.max, (chart.min + chart.max) / 2, chart.min].map(value => <g key={value}>
        <line x1={left} x2={right} y1={chart.y(value)} y2={chart.y(value)} stroke="#e1ebe3" />
        {detail && <text x={left - 7} y={chart.y(value) + 3} textAnchor="end" fill="#7a8c80" fontSize="10">{formatNumber(value)}</text>}
      </g>)}
      <line x1={chart.currentX} x2={chart.currentX} y1={top - 4} y2={bottom + 4} stroke="#86a28e" strokeDasharray="3 4" />
      <path data-series="history" data-point-count={chart.past.length} d={chart.actualPath} fill="none" stroke="#23804d" strokeWidth="2.5" strokeLinejoin="round" />
      <path data-series="forecast" data-point-count="2" d={chart.forecastPath} fill="none" stroke="#14532d" strokeWidth="2.5" strokeDasharray="6 4" />
      <circle cx={chart.currentX} cy={chart.y(item.currentPrice)} r="4.5" fill="#23804d" stroke="white" strokeWidth="2" />
      <circle cx={chart.forecastX} cy={chart.y(item.forecastPrice)} r="4.5" fill="#14532d" stroke="white" strokeWidth="2" />
      <text x={left} y="17" fill="#466450" fontSize="12">{`현재 ${won(item.currentPrice)}`}</text>
      <text x={right} y="17" textAnchor="end" fill="#14532d" fontSize="13" fontWeight="700">{`${won(item.forecastPrice)} 예측`}</text>
      {!card && <><text x={chart.currentX - 6} y={height - 5} textAnchor="end" fill="#708575" fontSize="10">{`기준 ${item.baseDate.slice(5).replace("-", "/")}`}</text>
      <text x={right} y={height - 5} textAnchor="end" fill="#14532d" fontSize="10">{`${item.forecastDate.slice(5).replace("-", "/")} 예측`}</text></>}
    </svg>
    <div className="forecast-sparkline-legend" aria-hidden="true"><span><i />{item.isPoc ? "실제 가격" : "이력 · DEMO"}</span><span><i />{item.isPoc ? "AI 7일 예측" : "7일 예측 · DEMO"}</span></div>
  </div>;
}
