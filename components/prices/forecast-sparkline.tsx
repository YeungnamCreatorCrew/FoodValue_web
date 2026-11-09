import type { LivePrice } from "@/lib/prices/model";
import { forecastChart } from "@/lib/prices/forecast-chart";
import { formatDate, formatNumber, won } from "@/lib/prices/format";
import { priceChartStyle } from "@/lib/prices/chart-style";
import "./forecast-sparkline.css";

export function ForecastSparkline({ item, historyDays = 14, variant = "card" }: {
  item: LivePrice; historyDays?: number; variant?: "hero" | "card" | "detail";
}) {
  const card = variant === "card", detail = variant === "detail";
  const height = card ? 156 : 168;
  const left = detail ? 44 : 12, right = 348, top = 30, bottom = height - (card ? 12 : 24);
  const chart = forecastChart(item, historyDays, { left, right, top, bottom });
  if (!chart.actual.length && !chart.forecast.length) return <p className="py-6 text-xs text-muted">가격 이력과 예측 정보가 없습니다.</p>;
  const title = `${item.name} 실제 가격 및 7일 예측`;
  const description = `실선은 ${chart.actual.length}개 실제 관측값, 점선은 서버가 제공한 ${chart.forecast.length}개 일별 예측값입니다. 결측 가격은 연결하지 않습니다.`;
  return <div className={`forecast-sparkline forecast-sparkline--${variant}`} style={priceChartStyle(item)} data-data-kind="api">
    <svg viewBox={`0 0 360 ${height}`} role="img" aria-label={title}>
      <title>{title}</title><desc>{description}</desc>
      <rect x={Math.max(left, chart.currentX)} y="2" width={Math.max(0, right - Math.max(left, chart.currentX) + 8)} height={height - 4} rx="6" fill="#e9f5ec" />
      {[chart.max, (chart.min + chart.max) / 2, chart.min].map(value => <g key={value}>
        <line x1={left} x2={right} y1={chart.y(value)} y2={chart.y(value)} stroke="#e1ebe3" />
        {detail && <text x={left - 7} y={chart.y(value) + 3} textAnchor="end" fill="#7a8c80" fontSize="10">{formatNumber(value)}</text>}
      </g>)}
      {chart.currentX >= left && <line x1={chart.currentX} x2={chart.currentX} y1={top - 4} y2={bottom + 4} stroke="#86a28e" strokeDasharray="3 4" />}
      <path data-series="history" data-point-count={chart.actual.length} d={chart.actualPath} fill="none" stroke="var(--price-chart-color)" strokeWidth="2.5" strokeLinejoin="round" />
      <path data-series="forecast" data-point-count={chart.forecast.length} d={chart.forecastPath} fill="none" stroke="var(--price-chart-color)" strokeWidth="2.5" strokeDasharray="6 4" />
      {chart.actual.map(point => <circle key={point.date} cx={chart.x(point.date)} cy={chart.y(point.price)} r="1.5" fill="var(--price-chart-color)" />)}
      {item.currentPrice !== null && chart.currentX >= left && <circle cx={chart.currentX} cy={chart.y(item.currentPrice)} r="4.5" fill="var(--price-chart-color)" stroke="white" strokeWidth="2" />}
      {item.forecastPrice !== null && <circle cx={chart.forecastX} cy={chart.y(item.forecastPrice)} r="4.5" fill="var(--price-chart-color)" stroke="white" strokeWidth="2" />}
      <text x={left} y="17" fill="#466450" fontSize="12">{`현재 ${won(item.currentPrice)}`}</text>
      <text x={right} y="17" textAnchor="end" fill="#14532d" fontSize="13" fontWeight="700">{`${won(item.forecastPrice)} 예측`}</text>
      {!card && <><text x={chart.currentX - 6} y={height - 5} textAnchor="end" fill="#708575" fontSize="10">{`관측 ${formatDate(item.priceDate ?? null)}`}</text>
      <text x={right} y={height - 5} textAnchor="end" fill="#14532d" fontSize="10">{`${formatDate(item.forecastDate)} 예측`}</text></>}
    </svg>
    <div className="forecast-sparkline-legend" aria-hidden="true"><span><i />실제 가격</span><span><i />AI 7일 예측</span></div>
    {!chart.forecast.length && <p className="text-xs text-muted">아직 예측 정보가 없습니다.</p>}
  </div>;
}
