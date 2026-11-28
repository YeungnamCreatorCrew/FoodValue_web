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

  return <div className="an-cal-wrap">
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
            {row.cells.map(cell => <span key={cell.week} onMouseEnter={() => setFocus(cell)}
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
        </> : <span className="fv-cap">칸에 마우스를 올리면 그 주의 계산이 보여요. 테두리 칸이 이번 주예요.</span>}
      </p>
      <table className="sr-only">
        <caption>연도별 평년 대비 판단 주 수(주 평균 근사)</caption>
        <thead><tr><th>연도</th><th>싼 편</th><th>평년 수준</th><th>비싼 편</th></tr></thead>
        <tbody>{calendar.rows.map(row => <tr key={row.year}><th>{row.year}</th><td>{counts(row.cells, "down")}</td><td>{counts(row.cells, "neutral")}</td><td>{counts(row.cells, "up")}</td></tr>)}</tbody>
      </table>
    </article>
    <Scorecard cheap={score.cheap} expensive={score.expensive} all={score.all} ahead={score.aheadWeeks} />
  </div>;
}

function Scorecard({ cheap, expensive, all, ahead }: { cheap: ScoreRow; expensive: ScoreRow; all: ScoreRow; ahead: number }) {
  const rows = [
    { key: "cheap", label: "싼 편이던 주", row: cheap, expect: "up" as const, tone: "tone-down" },
    { key: "exp", label: "비싼 편이던 주", row: expensive, expect: "down" as const, tone: "tone-up" },
    { key: "all", label: "모든 주 (기준선)", row: all, expect: null, tone: "" },
  ];
  const upGap = rate(cheap.up, cheap.n) !== null && rate(all.up, all.n) !== null ? (rate(cheap.up, cheap.n)! - rate(all.up, all.n)!) * 100 : null;
  const downGap = rate(expensive.down, expensive.n) !== null && rate(all.down, all.n) !== null ? (rate(expensive.down, expensive.n)! - rate(all.down, all.n)!) * 100 : null;
  const gapText = (gap: number | null, what: string) => gap === null ? null
    : Math.abs(gap) < 3 ? `${what} 비율이 평소와 비슷했어요` : `${what} 비율이 평소보다 ${formatNumber(Math.abs(gap), 0)}%p ${gap > 0 ? "높았어요" : "낮았어요"}`;
  return <article className="fv-card an-score">
    <h3 className="an-card-title">규칙 성적표 <span className="fv-cap">판단 {ahead}주 뒤 가격</span></h3>
    <table className="an-score-table">
      <thead><tr><th scope="col">판단</th><th scope="col" className="num">주 수</th><th scope="col" className="num">올랐다</th><th scope="col" className="num">보합</th><th scope="col" className="num">내렸다</th></tr></thead>
      <tbody>{rows.map(({ key, label, row, expect, tone }) => <tr key={key} className={expect ? undefined : "is-base"}>
        <th scope="row"><span className={tone}>{label}</span></th>
        <td className="num fv-num">{formatNumber(row.n)}</td>
        {(["up", "flat", "down"] as const).map(kind => <td key={kind} className={`num fv-num${expect === kind ? " is-expect" : ""}`}>
          {showRate(rate(row[kind], row.n))}<span className="fv-cap"> {formatNumber(row[kind])}</span>
        </td>)}
      </tr>)}</tbody>
    </table>
    <ul className="an-score-notes">
      {gapText(upGap, "싼 편 뒤에 오른") && <li>{gapText(upGap, "싼 편 뒤에 오른")}.</li>}
      {gapText(downGap, "비싼 편 뒤에 내린") && <li>{gapText(downGap, "비싼 편 뒤에 내린")}.</li>}
    </ul>
    <p className="fv-cap">±1% 안은 보합이에요. 주 평균으로 다시 계산한 근사치라 서버의 과거 검증과는 다를 수 있어요. 평년 대비는 ‘지금 자리’를 알려주는 지표라, 성적표는 참고로만 보세요.</p>
  </article>;
}

