"use client";

import { useMemo, useState } from "react";
import type { IndicatorState, SeasonalCard } from "@/lib/prices/model";
import { formatNumber, formatWon } from "@/lib/prices/format";
import { judgmentCalendar, scorecard, type ScoreRow, type WeekCell } from "@/lib/analysis/compute";
import { toneClass } from "@/components/prices/indicator-ui";
import { SEASONAL_LABEL } from "./judgment-flow";

const MONTH_WEEKS = [1, 5, 9, 14, 18, 22, 27, 31, 36, 40, 44, 49];
const pct = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value * 100), 1)}%`;
const level = (cell: WeekCell) => cell.diff === null ? "" : Math.abs(cell.diff) >= 0.2 ? " is-strong" : "";
const rate = (part: number, n: number) => n ? part / n : null;
const showRate = (value: number | null) => value === null ? "-" : `${formatNumber(value * 100, 0)}%`;

export function JudgmentCalendar({ years, card }: { years: NonNullable<SeasonalCard["chart"]>["years"]; card: SeasonalCard }) {
  const { calendar, score, current } = useMemo(() => {
    const calendar = judgmentCalendar(years);
    // 이번 주 칸은 근사치 대신 서버 판단(28일 기준)을 쓴다.
    const useServer = card.state !== null && card.fact.diffRate !== null;
    let current: { year: number; week: number } | null = null;
    const latestYear = calendar.rows.at(-1);
    if (useServer && latestYear) {
      const last = latestYear.cells.findLast(cell => cell.price !== null);
      if (last) {
        current = { year: last.year, week: last.week };
        Object.assign(last, { recent: card.fact.recentAvg, normal: card.fact.normalAvg, diff: card.fact.diffRate, state: card.state });
      }
    }
    return { calendar, score: scorecard(calendar), current };
  }, [years, card]);
  const [focus, setFocus] = useState<WeekCell | null>(null);
  const counts = (cells: WeekCell[], state: IndicatorState) => cells.filter(c => c.state === state).length;

  return <div className="an-trust">
    <TrustVerdict score={score} />
    <div className="an-cal-wrap">
    <article className="fv-card an-cal">
      <div className="an-cal-legend fv-cap" aria-hidden="true">
        <span><i className="an-cell tone-down is-strong" />20% 넘게 쌈</span>
        <span><i className="an-cell tone-down" />싼 편</span>
        <span><i className="an-cell tone-flat" />평년 수준</span>
        <span><i className="an-cell tone-up" />비싼 편</span>
        <span><i className="an-cell tone-up is-strong" />20% 넘게 비쌈</span>
        <span><i className="an-cell is-none" />기록 없음</span>
      </div>
      <div className="an-cal-grid" onMouseLeave={() => setFocus(null)} aria-hidden="true">
        <span />
        <div className="an-cal-months fv-cap">{MONTH_WEEKS.map((w, i) => <span key={w} style={{ gridColumnStart: w }}>{i + 1}월</span>)}</div>
        {calendar.rows.map(row => <div key={row.year} className="an-cal-row" style={{ display: "contents" }}>
          <span className="an-cal-year fv-cap fv-num">{row.year}</span>
          <div className="an-cal-cells">
            {row.cells.map(cell => <span key={cell.week} onMouseEnter={() => setFocus(cell)} onClick={() => setFocus(cell)}
              className={`an-cell ${cell.state ? toneClass(cell.state) : "is-none"}${cell.state && cell.state !== "neutral" ? level(cell) : ""}${current?.year === cell.year && current.week === cell.week ? " is-now" : ""}`} />)}
          </div>
        </div>)}
      </div>
      <p className="an-cal-detail" aria-live="polite">
        {focus ? <>
          <b className="fv-num">{focus.year}년 {focus.week}주</b>{" "}
          {focus.state ? <>최근 4주 {formatWon(focus.recent === null ? null : Math.round(focus.recent))} · 평년 {formatWon(focus.normal === null ? null : Math.round(focus.normal))} · <span className="fv-num">{pct(focus.diff!)}</span> → <b className={toneClass(focus.state)}>{SEASONAL_LABEL[focus.state]}</b>
            {current?.year === focus.year && current.week === focus.week && <span className="fv-cap"> (이번 주: 서버 값)</span>}</>
            : "평년을 만들 기록이 모자란 주예요."}
        </> : <span className="fv-cap">칸에 마우스를 올리거나 누르면 그 주의 계산이 보여요. 테두리 칸이 이번 주예요.</span>}
      </p>
      <table className="sr-only">
        <caption>연도별 평년 대비 판단 주 수(주 평균 근사)</caption>
        <thead><tr><th>연도</th><th>싼 편</th><th>평년 수준</th><th>비싼 편</th></tr></thead>
        <tbody>{calendar.rows.map(row => <tr key={row.year}><th>{row.year}</th><td>{counts(row.cells, "down")}</td><td>{counts(row.cells, "neutral")}</td><td>{counts(row.cells, "up")}</td></tr>)}</tbody>
      </table>
    </article>
    <Scorecard cheap={score.cheap} expensive={score.expensive} all={score.all} ahead={score.aheadWeeks} />
    </div>
  </div>;
}

/** 판단 뒤 가격이 판단과 맞는 쪽(싼 편→오름, 비싼 편→내림)으로 움직인 비율이 평소보다 몇 %p 높았나. */
function gaps({ cheap, expensive, all }: ReturnType<typeof scorecard>) {
  const up = rate(cheap.up, cheap.n), baseUp = rate(all.up, all.n), down = rate(expensive.down, expensive.n), baseDown = rate(all.down, all.n);
  return {
    up: up !== null && baseUp !== null ? (up - baseUp) * 100 : null,
    down: down !== null && baseDown !== null ? (down - baseDown) * 100 : null,
  };
}
const CLEAR = 3; // ±3%p 안은 '평소와 비슷'

/** 성적표의 한 줄 결론. 표를 읽기 전에 '그래서 믿어도 되나'를 먼저 말한다. */
function TrustVerdict({ score }: { score: ReturnType<typeof scorecard> }) {
  const g = gaps(score);
  const line = (gap: number | null, label: string, move: string) => gap === null ? null
    : Math.abs(gap) < CLEAR ? `‘${label}’이던 주 뒤에 가격이 ${move} 비율은 평소와 비슷했어요`
    : `‘${label}’이던 주 뒤에는 평소보다 ${move} 경우가 ${formatNumber(Math.abs(gap), 0)}%p ${gap > 0 ? "많았어요" : "적었어요"}`;
  const lines = [line(g.up, "싼 편", "오른"), line(g.down, "비싼 편", "내린")].filter((l): l is string => l !== null);
  if (!lines.length) return null;
  const predictive = g.up !== null && g.down !== null && g.up >= CLEAR && g.down >= CLEAR;
  return <div className={`an-trust-verdict${predictive ? " is-good" : ""}`}>
    <p className="an-trust-head">{predictive
      ? "과거에는 판단 뒤 가격이 판단과 맞는 쪽으로 움직인 경우가 평소보다 많았어요."
      : "이 판단은 ‘앞으로 오를지·내릴지’보다 ‘지금 가격이 평년보다 어떤 자리인지’를 보는 데 쓰세요."}</p>
    <p className="fv-cap">{score.aheadWeeks}주 뒤 가격 기준: {lines.join(" · ")}.</p>
  </div>;
}

function Scorecard({ cheap, expensive, all, ahead }: { cheap: ScoreRow; expensive: ScoreRow; all: ScoreRow; ahead: number }) {
  const rows = [
    { key: "cheap", label: "싼 편이던 주", row: cheap, expect: "up" as const, tone: "tone-down" },
    { key: "exp", label: "비싼 편이던 주", row: expensive, expect: "down" as const, tone: "tone-up" },
    { key: "all", label: "모든 주 (기준선)", row: all, expect: null, tone: "" },
  ];
  return <article className="fv-card an-score">
    <h3 className="an-card-title">규칙 성적표 <span className="fv-cap">판단 {ahead}주 뒤 가격</span></h3>
    <table className="an-score-table">
      <thead><tr><th scope="col">판단</th><th scope="col" className="num">주 수</th><th scope="col" className="num">올랐다</th><th scope="col" className="num">그대로</th><th scope="col" className="num">내렸다</th></tr></thead>
      <tbody>{rows.map(({ key, label, row, expect, tone }) => <tr key={key} className={expect ? undefined : "is-base"}>
        <th scope="row"><span className={tone}>{label}</span></th>
        <td className="num fv-num">{formatNumber(row.n)}</td>
        {(["up", "flat", "down"] as const).map(kind => <td key={kind} className={`num fv-num${expect === kind ? " is-expect" : ""}`}
          title={`${formatNumber(row.n)}주 중 ${formatNumber(row[kind])}주`}>
          {showRate(rate(row[kind], row.n))}<span className="sr-only"> ({formatNumber(row.n)}주 중 {formatNumber(row[kind])}주)</span>
        </td>)}
      </tr>)}</tbody>
    </table>
    <p className="fv-cap">칸은 그 줄의 주 수 중 몇 %인지예요(마우스를 올리면 주 수가 보여요). ±1% 안은 ‘그대로’로 셌어요. 색칠한 칸이 맞는 쪽으로 움직인 비율이에요. 주 평균으로 다시 계산한 근사치라 서버의 과거 검증과는 조금 다를 수 있어요.</p>
  </article>;
}

