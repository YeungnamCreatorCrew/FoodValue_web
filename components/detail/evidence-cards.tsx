"use client";

import { useState, type ReactNode } from "react";
import type { IndicatorCard, IndicatorNotice, IndicatorSignal, IndicatorState, LevelEvidence, LivePrice, PriceIndicators } from "@/lib/prices/model";
import { formatNumber, longDate, won } from "@/lib/prices/format";
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from "@/components/fv/state";
import { INDICATOR_HELP } from "@/components/prices/indicator-help";
import { PercentileBar } from "@/components/prices/indicator-ui";
import { toHaeyo } from "@/components/fv/haeyo";
import { IndexedChart, SeasonalChart } from "@/components/prices/indicator-charts";

/**
 * 판단 근거 카드. 지표마다 '질문 + 큰 답' 한 장. 누르면 핵심 숫자 · 그림 · 짧은 설명이 펼쳐진다.
 * 결론에 쓰는 3개(평년 대비 · 1년 중 위치 · 도매 흐름)를 먼저, 나머지는 '다른 지표 더 보기'로 접는다.
 * 판단 색(파랑·회색·빨강)은 평년 대비와 도매 흐름(가격 방향)에만 쓴다. 1년 중 위치·배수·출렁임은 '자리'라서 회색 + 다른 단어를 쓴다.
 * 방향은 서버 state를 그대로 쓰고, 가격으로 다시 계산하지 않는다. 모르는 지표 key는 건너뛴다.
 */
const MAIN = ["SEASONAL", "PRICE_POSITION", "WHOLESALE_LEAD"];
const MORE = ["RETAIL_WHOLESALE_GAP", "VOLATILITY", "HARVEST_WEATHER", "ARRIVALS"];
/** 카드의 큰 답(문장). 판단 단어를 문장으로 바꾼다. 방향은 서버 state 그대로. */
const ANSWER: Record<string, Partial<Record<string, string>>> = {
  SEASONAL: { down: "평년보다 싸요", neutral: "평년 수준이에요", up: "평년보다 비싸요" },
  PRICE_POSITION: { "낮은 쪽": "1년 중 낮은 쪽이에요", "중간": "1년 중 중간쯤이에요", "높은 쪽": "1년 중 높은 쪽이에요" },
  WHOLESALE_LEAD: { down: "도매가가 먼저 내렸어요", neutral: "도매가에 큰 움직임이 없어요", up: "도매가가 먼저 올랐어요" },
  // 더 보기 지표도 질문에 문장으로 답한다(짧은 판정어만 두면 "배수 낮은 쪽"처럼 뜻이 흐려진다).
  RETAIL_WHOLESALE_GAP: { "배수 낮은 쪽": "1년 중 배수가 낮은 편이에요", "배수 보통": "1년 중 보통 배수예요", "배수 높은 쪽": "1년 중 배수가 높은 편이에요" },
  VOLATILITY: { "덜 출렁임": "1년 중 덜 흔들린 편이에요", "보통": "1년 중 보통으로 흔들렸어요", "많이 출렁임": "1년 중 많이 흔들린 편이에요" },
};
const NAMES: Record<string, { name: string; question: string }> = {
  SEASONAL: { name: "평년 대비", question: "같은 시기 평년보다 싼가요?" },
  PRICE_POSITION: { name: "1년 중 위치", question: "1년 중 어디쯤인가요?" },
  WHOLESALE_LEAD: { name: "도매 흐름", question: "도매가가 먼저 움직였나요?" },
  RETAIL_WHOLESALE_GAP: { name: "소매·도매 배수", question: "소매가가 도매가의 몇 배인가요?" },
  VOLATILITY: { name: "가격 출렁임", question: "최근 4주 얼마나 흔들렸나요?" },
  HARVEST_WEATHER: { name: "수확지 날씨", question: "수확지에 비가 많이 왔나요?" },
  ARRIVALS: { name: "시장 반입량", question: "시장에 물량이 많이 들어왔나요?" },
};

const pct = (value: number | null | undefined) => value == null ? "정보 없음" : `${Math.round(value * 100)}%`;
/** 변동률(분수) → "+4.5%". */
const rate = (value: number | null | undefined) => value == null ? "정보 없음" : `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value * 100), 1)}%`;
/** 차이율(분수) → "↓3.7%"(화살표 + 소수 1자리). */
const diffArrow = (value: number) => value === 0 ? "변화 없음" : `${value < 0 ? "↓" : "↑"}${formatNumber(Math.abs(value * 100), 1)}%`;
const day = (date: string | null | undefined) => longDate(date) ?? "정보 없음";
const period = (start: string | null | undefined, end: string | null | undefined) => start && end ? `(${day(start)} ~ ${day(end)})` : "";

type Verdict = { label: string; tone: "tone-down" | "tone-up" | "tone-flat"; mark: "↓" | "↑" | "—" | "•"; place?: boolean };
const MARK = { down: "↓", neutral: "—", up: "↑" } as const;
/** 가격 방향 판단(평년 대비·도매 흐름): 색 + 화살표 + 서버 단어. */
const FALLBACK: Record<string, Record<IndicatorState, string>> = {
  SEASONAL: { down: "싼 편", neutral: "평년 수준", up: "비싼 편" },
  WHOLESALE_LEAD: { down: "내림 신호", neutral: "신호 없음", up: "오름 신호" },
  HARVEST_WEATHER: { down: "문제 없음", neutral: "문제 없음", up: "폭우" },
};
const direction = (key: string, state: IndicatorState | null, label: string | null): Verdict | null => {
  const word = label ?? (state ? FALLBACK[key]?.[state] : null);
  return state && word ? { label: word, tone: state === "down" ? "tone-down" : state === "up" ? "tone-up" : "tone-flat", mark: MARK[state] } : null;
};
/** 자리(1년 중 위치·배수·출렁임): 회색 + 낮은 쪽/중간/높은 쪽. 판단 색과 섞이지 않게 한다. 기준선(25%·75%)은 WAS와 같다. */
const zone = (percentile: number | null, words: [string, string, string]): Verdict | null => {
  if (percentile === null) return null;
  const index = percentile < 0.25 ? 0 : percentile > 0.75 ? 2 : 1;
  // 위치형 지표는 판단이 아니라서 싼 편·비싼 편에 쓰는 ↑↓를 쓰지 않고 점 하나로 둔다.
  return { label: words[index], tone: "tone-flat", mark: "•", place: true };
};

type Row = { describes?: boolean; key: string; now: ReactNode; nowNote: string; basis: ReactNode; verdict: Verdict | null; facts: string[]; extra?: ReactNode; record?: ReactNode; source?: string };

/** 과거 기록 표: 낮은 쪽·높은 쪽이었던 뒤 소매가가 어떻게 움직였는지(평소 비율·횟수와 함께). */
function LevelTable({ evidence, lowWord, highWord }: { evidence: LevelEvidence; lowWord: string; highWord: string }) {
  return <table className="ev-record">
    <caption>과거 기록 {period(evidence.periodStart, evidence.periodEnd)}</caption>
    <thead><tr><th scope="col">그때</th><th scope="col">{evidence.aheadWeeks ?? "몇"}주 안 소매가</th><th scope="col" className="num">비율</th><th scope="col" className="num">평소</th><th scope="col" className="num">횟수</th></tr></thead>
    <tbody>
      <tr><th scope="row">{lowWord}</th><td>올랐어요</td><td className="num">{pct(evidence.lowAfterRate)}</td><td className="num">{pct(evidence.lowBaseRate)}</td><td className="num">{evidence.sampleLow ?? "정보 없음"}</td></tr>
      <tr><th scope="row">{highWord}</th><td>내렸어요</td><td className="num">{pct(evidence.highAfterRate)}</td><td className="num">{pct(evidence.highBaseRate)}</td><td className="num">{evidence.sampleHigh ?? "정보 없음"}</td></tr>
    </tbody>
  </table>;
}

function rowFor(card: IndicatorCard, unit: string, signal: IndicatorSignal | null): Row | null {
  switch (card.key) {
    case "SEASONAL": {
      const { fact } = card;
      const facts = [`평년은 직전 ${fact.normalYears.length || 5}년 같은 시기 평균이에요.`, "10% 넘게 차이 나야 싼 편·비싼 편으로 봐요."];
      if (fact.cheaperThanCount !== null && fact.historyYears !== null) facts.push(`지난 ${fact.historyYears}년 중 ${fact.cheaperThanCount}개 해보다 낮아요.`);
      return { key: card.key, now: fact.recentAvg === null ? "정보 없음" : won(fact.recentAvg), nowNote: `최근 ${Math.round((fact.windowDays ?? 28) / 7)}주 평균`,
        basis: fact.normalAvg === null ? "정보 없음" : <>평년 같은 4주 {won(fact.normalAvg)}{fact.diffRate !== null && <> · <b>{diffArrow(fact.diffRate)}</b></>}</>,
        verdict: direction(card.key, card.state, signal?.stateLabel ?? null), facts, extra: card.chart ? <SeasonalChart card={card} /> : null, source: card.evidenceText ?? undefined };
    }
    case "PRICE_POSITION": {
      const { fact, evidence } = card;
      const facts: string[] = [];
      if (fact.avg !== null && fact.diffFromAvg !== null) facts.push(`1년 평균 ${won(fact.avg)}보다 ${diffArrow(fact.diffFromAvg)}`);
      if (fact.percentile !== null) facts.push(`1년 중 지금보다 싼 날은 ${pct(fact.percentile)}예요.`);
      if (fact.low !== null) facts.push(`최저 ${won(fact.low)} · ${day(fact.lowDate)}`);
      if (fact.high !== null) facts.push(`최고 ${won(fact.high)} · ${day(fact.highDate)}`);
      return { key: card.key, now: fact.currentPrice === null ? "정보 없음" : won(fact.currentPrice), nowNote: "최근 가격",
        basis: fact.percentile !== null && fact.low !== null && fact.high !== null
          ? <><PercentileBar compact percentile={fact.percentile} label={`1년 최저 ${won(fact.low)}, 최고 ${won(fact.high)} 사이에서 지금보다 싼 날 ${pct(fact.percentile)}`} />
            <span className="ev-range">최저 {won(fact.low)} · 최고 {won(fact.high)}</span></>
          : "정보 없음",
        verdict: zone(fact.percentile, ["낮은 쪽", "중간", "높은 쪽"]), facts,
        record: card.verdict === "CONDITIONAL" && evidence ? <LevelTable evidence={evidence} lowWord="1년 중 낮은 쪽" highWord="1년 중 높은 쪽" /> : null, source: card.evidenceText ?? undefined, describes: true };
    }
    case "WHOLESALE_LEAD": {
      const { fact, evidence } = card;
      const threshold = evidence?.threshold != null ? `${Math.round(evidence.threshold * 100)}%` : "일정 폭";
      return { key: card.key, now: `도매 ${rate(fact.wholesaleChange2w)}`, nowNote: "최근 2주",
        basis: <>소매 {rate(fact.retailChange2w)} · 신호 기준 ±{threshold}</>,
        verdict: direction(card.key, card.state, signal?.stateLabel ?? null),
        facts: [`도매가가 2주 새 ${threshold} 넘게 움직이면 신호로 봐요.`], extra: card.chart ? <IndexedChart card={card} /> : null,
        record: evidence ? <table className="ev-record">
          <caption>과거 기록 {period(evidence.periodStart, evidence.periodEnd)}</caption>
          <thead><tr><th scope="col">도매가가 2주 새</th><th scope="col">2주 안 소매가</th><th scope="col" className="num">비율</th><th scope="col" className="num">평소</th><th scope="col" className="num">횟수</th></tr></thead>
          <tbody>
            <tr><th scope="row">{threshold} 넘게 오른 뒤</th><td>올랐어요</td><td className="num">{pct(evidence.upAfterRate)}</td><td className="num">{pct(evidence.baseUpRate)}</td><td className="num">{evidence.sampleUp ?? "정보 없음"}</td></tr>
            <tr><th scope="row">{threshold} 넘게 내린 뒤</th><td>내렸어요</td><td className="num">{pct(evidence.downAfterRate)}</td><td className="num">{pct(evidence.baseDownRate)}</td><td className="num">{evidence.sampleDown ?? "정보 없음"}</td></tr>
          </tbody>
        </table> : null };
    }
    case "RETAIL_WHOLESALE_GAP": {
      const { fact, evidence } = card;
      const facts: string[] = [];
      if (fact.retailPrice !== null && fact.wholesalePrice !== null) facts.push(`소매 ${won(fact.retailPrice)} ÷ 도매 ${won(fact.wholesalePrice)}(${unit} 환산)`);
      if (fact.percentile !== null) facts.push(`1년 중 지금보다 배수가 낮은 날은 ${pct(fact.percentile)}예요.`);
      if (evidence?.overlapsLead) facts.push("도매 흐름과 겹치는 지표라 오르내림 신호로 쓰지 않아요.");
      return { key: card.key, now: fact.ratio === null ? "정보 없음" : `${formatNumber(fact.ratio, 2)}배`, nowNote: "소매 ÷ 도매",
        basis: fact.normalRatio === null ? "정보 없음" : `평소 ${formatNumber(fact.normalRatio, 2)}배`,
        verdict: zone(fact.percentile, ["배수 낮은 쪽", "배수 보통", "배수 높은 쪽"]), facts,
        record: evidence?.passed && !evidence.overlapsLead ? <LevelTable evidence={evidence} lowWord="배수 낮은 쪽" highWord="배수 높은 쪽" /> : null, source: card.evidenceText ?? undefined, describes: true };
    }
    case "VOLATILITY": {
      const { fact } = card;
      return { key: card.key, now: fact.recentRange === null ? "정보 없음" : `${formatNumber(fact.recentRange * 100, 1)}%`, nowNote: "최고·최저 차이 ÷ 평균",
        basis: fact.normalRange === null ? "정보 없음" : `평소 ${formatNumber(fact.normalRange * 100, 1)}%`,
        verdict: zone(fact.percentile, ["덜 출렁임", "보통", "많이 출렁임"]),
        facts: fact.percentile === null ? [] : [`1년 중 이보다 덜 출렁인 날은 ${pct(fact.percentile)}예요.`], source: card.evidenceText ?? undefined, describes: true };
    }
    case "HARVEST_WEATHER": {
      const { fact } = card;
      return { key: card.key, now: fact.rain4w === null ? "정보 없음" : `${formatNumber(fact.rain4w)}mm`, nowNote: `최근 4주 강수${fact.region ? ` · ${fact.region}` : ""}`,
        basis: fact.normalRain4w === null ? "정보 없음" : `평년 ${formatNumber(fact.normalRain4w)}mm`,
        verdict: direction(card.key, card.state, signal?.stateLabel ?? null), facts: card.available ? [] : ["이 시기에는 가격과 관계가 확인된 날씨 근거가 없어요."] };
    }
    case "ARRIVALS": {
      const { fact } = card;
      return { key: card.key, now: fact.avgTon4w === null ? "정보 없음" : `${formatNumber(fact.avgTon4w)}톤`, nowNote: `최근 4주 하루 평균${fact.market ? ` · ${fact.market}` : ""}`,
        basis: fact.normalTon === null ? "정보 없음" : `평년 ${formatNumber(fact.normalTon)}톤`,
        verdict: null, facts: ["가격과의 관계가 약해 판단에는 쓰지 않아요."] };
    }
    default: return null;
  }
}


const VERDICT_NOTE: Partial<Record<IndicatorCard["verdict"], string>> = { PASS: "과거 기록으로 확인한 근거예요.", CONDITIONAL: "참고용 근거예요. 더 확인이 필요해요." };

function answerOf(card: IndicatorCard, verdict: Verdict | null) {
  if (!verdict) return "정보 없음";
  const byState = ANSWER[card.key];
  return byState?.[card.state ?? ""] ?? byState?.[verdict.label] ?? verdict.label;
}

function EvidenceCard({ card, unit, signal }: { card: IndicatorCard; unit: string; signal: IndicatorSignal | null }) {
  const [open, setOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const row = rowFor(card, unit, signal);
  if (!row) return null;
  const names = NAMES[card.key];
  const help = INDICATOR_HELP[card.key];
  const panel = `ev-panel-${card.key.toLowerCase()}`;
  const tone = row.verdict && !row.verdict.place ? row.verdict.tone : "tone-flat";
  return <article id={`ev-${card.key.toLowerCase()}`} className={`ev-card ${open ? "is-open" : ""}`}>
    <h3 className="ev-card-head">
      <button type="button" className="ev-toggle" aria-expanded={open} aria-controls={panel} onClick={() => setOpen(value => !value)}>
        <span className="ev-q">{names.question.replace(/\?$/, "")}?<span className="sr-only"> ({names.name})</span></span>
        <span className={`ev-a ${tone}`}>{row.verdict && <span aria-hidden="true" className="ev-mark">{row.verdict.mark}</span>}{answerOf(card, row.verdict)}</span>
        <svg className="ev-chevron" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </h3>
    {open && <div id={panel} className="ev-body">
      <div className="ev-key"><span className="ev-key-now"><strong>{row.now}</strong><span>{row.nowNote}</span></span><span className="ev-key-basis">{row.basis}</span></div>
      {row.source && row.describes ? <p className="ev-read">{toHaeyo(row.source)}</p> : help && <p className="ev-read">{help.read}</p>}
      {row.extra && <div className="ev-chart">{row.extra}</div>}
      {row.facts.length > 0 && <ul className="ev-facts">{row.facts.map(fact => <li key={fact}>{fact}</li>)}</ul>}
      {row.source && !row.describes && <div className="ev-source"><p className="ev-label">근거</p><p>{toHaeyo(row.source)}</p></div>}
      {row.record && <div className="ev-recordbox">
        <button type="button" className="fv-link ev-recordtoggle" aria-expanded={recordOpen} aria-controls={`${panel}-record`} onClick={() => setRecordOpen(value => !value)}>{recordOpen ? "과거 기록 접기" : "과거 기록 보기"}</button>
        {recordOpen && <div id={`${panel}-record`} className="ev-recordbox">{row.record}<p className="ev-recordnote">‘평소’는 조건 없이 아무 때나 그랬던 비율이에요.</p></div>}
      </div>}
      {help && <div className="ev-tipbox"><p className="ev-label">알아 둘 점</p><ul className="ev-tips">{help.tips.map(tip => <li key={tip}>{tip}</li>)}</ul></div>}
      {VERDICT_NOTE[card.verdict] && <p className="ev-kind">{VERDICT_NOTE[card.verdict]}</p>}
    </div>}
  </article>;
}

const NOTICE_NAME: Record<string, string> = { WHOLESALE_LEAD: "도매 흐름", VOLATILITY: "가격 출렁임", PRICE_POSITION: "1년 중 위치", SEASONAL: "평년 대비", RETAIL_WHOLESALE_GAP: "소매·도매 배수" };
/** 지표를 만들지 않은 이유(작형 전환 직후 등). 빈자리 대신 서버가 쓴 이유를 그대로 보여준다. */
function NoticeCard({ notice }: { notice: IndicatorNotice }) {
  return <article id={`ev-${notice.key.toLowerCase()}`} className="ev-card is-notice">
    <h3 className="ev-notice-head"><span className="ev-q">{NOTICE_NAME[notice.key] ?? "잠시 쉬는 지표"}</span><span className="ev-a tone-flat">잠시 쉬어요</span></h3>
    <p className="ev-notice-text">{notice.text}</p>
  </article>;
}

export function EvidenceCards({ item, data, loading, error, reload }: { item: LivePrice; data?: PriceIndicators; loading: boolean; error?: string; reload: () => void }) {
  const [more, setMore] = useState(false);
  const pick = (keys: string[]) => data ? keys.flatMap(key => data.cards.find(card => card.key === key) ?? []) : [];
  const main = pick(MAIN), extra = pick(MORE);
  const notices = data ? data.notices.filter(notice => !data.cards.some(card => card.key === notice.key)) : [];
  const signal = (key: string) => data?.signals.find(entry => entry.key === key) ?? null;
  return <section className="evidence" aria-labelledby="evidence-title">
    <div className="section-head"><h2 id="evidence-title" className="fv-h2">판단 근거{main.length > 0 && ` ${main.length}가지`}</h2>{(main.length > 0 || extra.length > 0) && <p className="fv-cap">누르면 숫자와 그래프가 나와요.</p>}</div>
    {loading ? <LoadingRegion label="판단 근거를 불러오는 중이에요"><Skeleton className="evidence-skel" /></LoadingRegion>
      : error || !data ? <ErrorState message={error ?? ""} onRetry={reload} />
      : !main.length && !extra.length && !notices.length ? <EmptyState title="판단 근거 없음">{item.status === "NO_DATA" ? "최근 조사된 가격이 없어요." : "이 품목은 아직 판단 근거를 만들지 않았어요."}</EmptyState>
      : <div className="ev-cards">
        {main.map(card => <EvidenceCard key={card.key} card={card} unit={item.unit} signal={signal(card.key)} />)}
        {notices.map(notice => <NoticeCard key={notice.key} notice={notice} />)}
        {extra.length > 0 && <button type="button" className="fv-btn is-quiet ev-more" aria-expanded={more} aria-controls="ev-extra" onClick={() => setMore(value => !value)}>
          {more ? "다른 지표 접기" : `다른 지표 ${extra.length}개 더 보기`}</button>}
        {more && <div id="ev-extra" className="ev-cards">{extra.map(card => <EvidenceCard key={card.key} card={card} unit={item.unit} signal={signal(card.key)} />)}</div>}
      </div>}
  </section>;
}
