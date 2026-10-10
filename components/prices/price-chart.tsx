"use client";

import { useState } from "react";
import { won } from "@/lib/prices/format";
import type { DailyPrice, Forecast, Period } from "@/lib/prices/types";
import { SectionTitle } from "./ui";

export function PriceChart({ history, forecast, mape }: { history: DailyPrice[]; forecast: Forecast[]; mape: number | null }) {
  const [period, setPeriod] = useState<Period>(14);
  const [selected, setSelected] = useState<number | null>(null);
  const past = history.slice(-(period + 1));
  const points = [...past, ...forecast];
  const values = [...past.map(p => p.price), ...forecast.flatMap(p => [p.lower, p.upper])];
  const low = Math.min(...values), high = Math.max(...values);
  const pad = (high - low || high * 0.1 || 100) * 0.15;
  const min = low - pad, max = high + pad;
  // Fixed viewBox preserves Figma's chart geometry on mobile and scales on desktop.
  const x = (i: number) => 44 + i / (points.length - 1) * 278;
  const y = (price: number) => 150 - (price - min) / (max - min) * 132;
  const path = (data: DailyPrice[], offset = 0) => data.map((p, i) => `${i ? "L" : "M"}${x(i + offset).toFixed(2)},${y(p.price).toFixed(2)}`).join(" ");
  const todayIndex = past.length - 1;
  const todayX = x(todayIndex);
  const today = past[todayIndex];
  const last = forecast.at(-1)!;
  const band = [
    `${x(todayIndex)},${y(today.price)}`,
    ...forecast.map((p, i) => `${x(past.length + i)},${y(p.upper)}`),
    ...forecast.toReversed().map((p, i) => `${x(points.length - 1 - i)},${y(p.lower)}`),
  ].join(" ");
  const active = selected === null ? null : points[selected];
  const minimumIndex = forecast.reduce((best, p, i) => p.price < forecast[best].price ? i : best, 0);
  const currentLabelX = Math.max(44, Math.min(234, todayX - 80));
  const currentLabelY = Math.max(36, y(today.price) - 28);
  const todayAxisX = Math.min(todayX, 290);
  return <section aria-label="가격 추이 및 7일 예측">
    <SectionTitle icon="imgLineChart" title="시세 추이 & 7일 AI 예측">
      <div role="group" aria-label="과거 가격 조회 기간" className="flex shrink-0 rounded-lg bg-[#e9f0ec] p-0.5">
        {([14, 30, 90] as Period[]).map(value => <button key={value} aria-pressed={period === value} onClick={() => { setPeriod(value); setSelected(null); }} className={`rounded-md px-2 py-1 text-[11px] ${period === value ? "bg-white font-semibold text-[#0f6d47] shadow-sm" : "text-[#87948d]"}`}>{value}일</button>)}
      </div>
    </SectionTitle>
    <div className="rounded-2xl border border-[#e1e9e5] bg-white px-3 pt-3.5">
      <div className="flex flex-wrap gap-3 text-[11px] text-[#87948d]">
        <span className="flex items-center gap-1"><i className="h-0.5 w-3 bg-[#83918b]" />실제 가격</span>
        <span className="flex items-center gap-1"><i className="h-0.5 w-3 bg-[#169b62]" />AI 7일 예측</span>
        <span className="flex items-center gap-1"><i className="h-2 w-3 bg-[#bce8d4]" />95% 신뢰구간</span>
      </div>
      <svg className="mt-2 block w-full" viewBox="0 0 326 220" aria-label={`과거 ${period}일 가격과 7일 예측. 차트의 점을 선택하면 날짜와 가격을 확인할 수 있습니다.`}>
        {[max, (max + min) / 2, min].map(value => <g key={value}><line x1="44" x2="322" y1={y(value)} y2={y(value)} stroke="#edf1ef" /><text x="38" y={y(value) + 3} textAnchor="end" fill="#87948d" fontSize="9">{won(Math.round(value / 10) * 10)}</text></g>)}
        <polygon points={band} fill="#bce8d4" opacity="0.6" />
        <path d={path(past)} fill="none" stroke="#83918b" strokeWidth="1.8" strokeLinejoin="round" />
        <path d={path([today, ...forecast], todayIndex)} fill="none" stroke="#169b62" strokeWidth="2" strokeDasharray="4 2" strokeLinejoin="round" />
        <line x1={x(todayIndex)} x2={x(todayIndex)} y1="16" y2="156" stroke="#f97316" strokeDasharray="3 3" />
        <circle cx={x(todayIndex)} cy={y(today.price)} r="4" fill="#f97316" stroke="white" />
        <circle cx={x(points.length - 1)} cy={y(last.price)} r="4" fill="#169b62" stroke="white" />
        <text x={x(0)} y="173" fontSize="9" fill="#87948d">{period}일 전</text>
        <text x={todayAxisX} y="170" textAnchor="middle" fontSize="9" fill="#f97316"><tspan x={todayAxisX}>오늘</tspan><tspan x={todayAxisX} dy="11">D-Day</tspan></text>
        <text x="322" y="173" textAnchor="end" fontSize="9" fill="#0f6d47">+7일</text>
        <g aria-label={`오늘 현재가 ${won(today.price)}`}><rect x={currentLabelX} y={currentLabelY} width="88" height="22" rx="6" fill="#17251f" /><text x={currentLabelX + 44} y={currentLabelY + 15} textAnchor="middle" fill="white" fontSize="10">오늘 {won(today.price)}</text></g>
        <g aria-label={`7일 후 예상가 ${won(last.price)}`}><rect x="222" y="0" width="104" height="22" rx="6" fill="#0f6d47" /><text x="274" y="15" textAnchor="middle" fill="white" fontSize="10">7일 후 {won(last.price)}</text></g>
        <text x="44" y="201" fontSize="10" fill="#607068">오늘 {won(today.price)} · 예상 최저 {minimumIndex + 1}일 뒤 {won(forecast[minimumIndex].price)}</text>
        {points.map((p, i) => <circle key={p.date} cx={x(i)} cy={y(p.price)} r="5" fill="transparent" stroke="transparent" tabIndex={0} role="button" aria-label={`${p.date} ${i > todayIndex ? "예측" : "실제"} ${won(p.price)}`} onMouseEnter={() => setSelected(i)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(i)} onBlur={() => setSelected(null)} onClick={() => setSelected(i)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(i); } }} />)}
        {active && selected !== null && <g pointerEvents="none">
          <circle cx={x(selected)} cy={y(active.price)} r="4" fill="#17251f" />
          <rect x={Math.min(210, Math.max(44, x(selected) - 58))} y={Math.max(25, y(active.price) - 37)} width="112" height="28" rx="6" fill="#17251f" />
          <text x={Math.min(210, Math.max(44, x(selected) - 58)) + 56} y={Math.max(25, y(active.price) - 37) + 18} textAnchor="middle" fill="white" fontSize="10">{active.date.slice(5)} · {won(active.price)}</text>
        </g>}
      </svg>
      {active && <p role="status" className="sr-only">{active.date}: {won(active.price)}{"lower" in active && "upper" in active ? `, 95% 신뢰구간 ${won(active.lower as number)} ~ ${won(active.upper as number)}` : ""}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e1e9e5] py-3 text-[10px]"><span className="text-[#87948d]">KAMIS 기준 · 샘플 데이터</span>{mape !== null && <span className="rounded-full bg-[#ecf8f2] px-2 py-1 font-semibold text-[#0f6d47]">예측 오차 MAPE {mape}%</span>}</div>
    </div>
  </section>;
}
