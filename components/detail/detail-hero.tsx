"use client";

import type { ReactNode } from "react";
import type { IndicatorSignal, LivePrice, PriceIndicators, PricePoint } from "@/lib/prices/model";
import { priceNear, REFERENCES } from "@/lib/prices/reference";
import { formatNumber, longDate, shortDate, won } from "@/lib/prices/format";
import { reasonLine, ruleLine } from "@/lib/prices/why";
import { WeeklyChange } from "@/components/fv/change";
import { Skeleton } from "@/components/fv/state";
import { toHaeyo } from "@/components/fv/haeyo";
import { IngredientImage } from "@/components/prices/ingredient-image";
import { toneClass } from "@/components/prices/indicator-ui";

type Indicators = { data?: PriceIndicators; loading: boolean; error?: string };

/**
 * 데이터 상태 안내. 상자를 따로 쌓으면 첫 화면에서 근거가 밀려나므로 기준일 줄 안의 짧은 꼬리표로 둔다.
 * 날짜는 기준일 줄에 이미 있으니 반복하지 않는다. 가격이 없을 때(NO_DATA)는 결론 문장이 이미 말하므로 붙이지 않는다.
 */
/** ISO 주차(월요일 시작). */
function isoWeek(date: string) {
  const day = new Date(`${date}T00:00:00Z`);
  const shift = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - shift + 3);
  const firstThursday = new Date(Date.UTC(day.getUTCFullYear(), 0, 4));
  return { year: day.getUTCFullYear(), week: 1 + Math.round(((day.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7) };
}

function statusTags(item: LivePrice, indicators?: PriceIndicators): string[] {
  if (item.status === "NO_DATA") return [];
  const tags: string[] = [];
  if (item.status === "STALE" || item.forecastStatus === "STALE") tags.push("최신 가격 늦음");
  if (indicators?.stale && indicators.asOfDate !== item.priceDate) tags.push(`지표는 ${shortDate(indicators.asOfDate) ?? "이전"} 기준`);
  return tags;
}

/** 결론 색: 홈과 같은 기준(평년 대비). 결론 색과 홈 판단 색이 어긋나지 않게 한다. */
const judge = (signals: IndicatorSignal[]) => signals.find(signal => signal.key === "SEASONAL") ?? null;

/** 결론 문장. 서버 문장의 뜻은 그대로 두고 끝맺음만 해요체로 맞춘다. 결론은 화면에서 이 한 곳에서만 말한다. */
function Conclusion({ item, indicators }: { item: LivePrice; indicators: Indicators }) {
  const { data, loading, error } = indicators;
  if (item.status === "NO_DATA") return <p className="hero-headline">최근 가격이 없어 결론을 낼 수 없어요.</p>;
  if (loading) return <div role="status" aria-busy="true" className="hero-loading"><span className="sr-only">결론을 정리하는 중이에요</span><Skeleton className="skel-line" /><Skeleton className="skel-line skel-short" /></div>;
  if (error || !data) return <p className="hero-headline">지표를 불러오지 못해 결론을 낼 수 없어요.</p>;
  if (!data.headline) return <p className="hero-headline">{data.cards.length ? "아래 판단 근거에서 지표를 확인해 주세요." : "이 품목은 지표를 준비하고 있어요."}</p>;
  return <p className="hero-headline">{toHaeyo(data.headline)}</p>;
}

function JudgmentExplanation({ indicators }: { indicators: Indicators }) {
  const data = indicators.data;
  if (indicators.loading || indicators.error || !data) return null;
  const seasonal = data.cards.find(card => card.key === "SEASONAL");
  const position = data.cards.find(card => card.key === "PRICE_POSITION");
  const lead = data.cards.find(card => card.key === "WHOLESALE_LEAD");
  const fact = seasonal?.fact;
  const comparison = fact?.recentAvg != null && fact.normalAvg != null && fact.normalAvg > 0 && fact.diffRate != null;

  return <details className="judgment-explanation">
    <summary>왜 이렇게 판단했나요?</summary>
    <div className="judgment-explanation-body">
      {comparison && fact.diffRate !== null && <dl className="judgment-comparison">
        <div><dt>최근 {fact.windowDays ?? 28}일 평균</dt><dd className="fv-num">{won(fact.recentAvg)}</dd></div>
        <div><dt>평년 같은 시기 평균</dt><dd className="fv-num">{won(fact.normalAvg)}</dd></div>
        <div><dt>평년과의 차이</dt><dd className="fv-num">{fact.diffRate > 0 ? "+" : fact.diffRate < 0 ? "−" : ""}{formatNumber(Math.abs(fact.diffRate * 100), 1)}%</dd></div>
      </dl>}
      {comparison && <p className="judgment-formula">({won(fact.recentAvg)} − {won(fact.normalAvg)}) ÷ {won(fact.normalAvg)} × 100으로 비교했어요.</p>}
      {seasonal && <p>{ruleLine(seasonal) ?? "평년과 비교할 가격 기록이 충분하지 않아 판단을 보류했어요."}</p>}
      {comparison && <p className="fv-cap">
        평년 평균은 {fact.normalYears.length ? `${fact.normalYears.join("·")}년` : "과거 연도"}의 같은 시기 가격을 사용했어요.
        {" "}현재 하루 가격과 최근 기간의 평균 가격은 다를 수 있어요.
      </p>}
      {!seasonal && <p>평년 대비 지표가 없어 같은 시기의 가격 수준을 판단할 자료가 부족해요.</p>}
      {position && <div><h3>최근 1년에서는 어느 위치인가요?</h3><p>{ruleLine(position) ?? "1년 중 위치를 계산할 가격 기록이 부족해요."}</p></div>}
      {lead && <div><h3>도매 흐름도 함께 살펴보세요</h3><p>{reasonLine(lead) ?? "최근 도매 흐름의 비교 수치가 없어요."}</p></div>}
      {data.asOfDate && <p className="fv-cap">지표 기준일 <time dateTime={data.asOfDate}>{longDate(data.asOfDate)}</time></p>}
      <a className="fv-link" href="#why-title">관련 수급 소식과 설명 보기 <span aria-hidden="true">↓</span></a>
    </div>
  </details>;
}

/** 기준 가격 한 칸: 그때 가격 + "지금이 ○원 비싸요/싸요". 바로 위 결론 띠의 판단 색과 부딪히지 않게 색을 쓰지 않는다. */
function RefCell({ label, price, current, note }: { label: string; price: number | null; current: number | null; note?: string }) {
  const diff = price !== null && current !== null ? current - price : null;
  return <div className="ref-cell">
    <p className="ref-label">{label}</p>
    <p className="ref-price fv-num">{price === null ? "정보 없음" : won(price)}</p>
    {note ? <p className="ref-diff">{note}</p> : diff !== null && <p className="ref-diff">
      {diff === 0 ? "지금과 같아요" : `지금이 ${won(Math.abs(diff))} ${diff > 0 ? "비싸요" : "싸요"}`}</p>}
  </div>;
}

/** 지난주 · 한 달 전 · 작년 이맘때(가격 이력) + 평년(평년 대비 지표의 같은 4주 평균). */
function References({ item, indicators, history }: { item: LivePrice; indicators?: PriceIndicators; history: PricePoint[] }) {
  const base = item.priceDate;
  const seasonal = indicators?.cards.find(card => card.key === "SEASONAL");
  const normal = seasonal?.key === "SEASONAL" ? seasonal.fact : null;
  if (!base || item.currentPrice === null) return null;
  // 가격일이 늦으면 365일 이력 밖으로 작년 날짜가 나간다. 그때는 평년 대비 지표의 작년 같은 주 평균을 쓰고 이름에 밝힌다.
  const lastYearWeek = () => {
    const chart = seasonal?.key === "SEASONAL" ? seasonal.chart : null;
    // WAS 평년 지표는 ISO 주(월~일)로 묶는다. 그래프의 마지막 주가 아니라 가격일이 속한 주를 쓴다.
    const { year, week } = isoWeek(base);
    const prev = chart?.years.find(entry => entry.year === year - 1)?.points.find(point => point.week === Math.min(week, 52));
    return prev ? Math.round(prev.price) : null;
  };
  return <div className="ref-strip" aria-label="기준 가격과 비교">
    {REFERENCES.map(entry => {
      const near = priceNear(history, base, entry.daysBack)?.price ?? null;
      const week = near === null && entry.key === "year" ? lastYearWeek() : null;
      return <RefCell key={entry.key} label={week !== null ? "작년 같은 주 평균" : entry.label} price={near ?? week} current={item.currentPrice} />;
    })}
    <RefCell label="평년 (같은 4주)" price={normal?.normalAvg ?? null} current={null}
      note={normal?.recentAvg != null ? `4주 평균 ${won(normal.recentAvg)}과 비교` : undefined} />
  </div>;
}

/**
 * 상세 맨 위 카드(v3): 왼쪽 품목·현재가, 오른쪽 가격 흐름 → 한 줄 결론 띠 → 기준 가격 4칸 + AI 7일 예측 1칸(참고).
 * 가격과 추세를 한눈에 보이게 그래프를 현재가 옆에 둔다. 가격이 없으면(NO_DATA) 그래프와 예측 칸은 그리지 않는다.
 */
export function DetailHero({ item, indicators, history = [], trend, forecast, forecastControls }: { item: LivePrice; indicators: Indicators; history?: PricePoint[]; trend?: ReactNode; forecast?: ReactNode; forecastControls?: ReactNode }) {
  const tags = statusTags(item, indicators.data);
  const seasonal = judge(indicators.data?.signals ?? []);
  return <section className="hero-card" aria-labelledby="item-title">
    <div className={trend ? "hero has-trend" : "hero"}>
      <div className="hero-item">
        <p className="hero-date">{item.priceDate ? <><time dateTime={item.priceDate}>{longDate(item.priceDate)}</time> 기준</> : "기준일 정보 없음"}{item.source && ` · ${item.source} 소매가`}
          {tags.map(tag => <span key={tag} className="hero-stale"><span className="sr-only"> · </span>{tag}</span>)}</p>
        <div className="hero-name">
          <IngredientImage item={item} size={56} />
          <h1 id="item-title" className="hero-title">{item.name}<span>{item.unit}</span></h1>
        </div>
        <p className="hero-price"><strong className="fv-num">{item.currentPrice === null ? "정보 없음" : won(item.currentPrice)}</strong>
          {item.currentPrice !== null && <span className="hero-change"><span className="fv-cap">지난주보다</span><WeeklyChange value={item.weeklyChangeRate} label="" /></span>}</p>
      </div>
      {trend && <div className="hero-trend">{trend}</div>}
    </div>
    <div className={`hero-verdict ${toneClass(seasonal?.state)}`}>
      <p className="hero-eyebrow">한 줄 결론</p>
      <Conclusion item={item} indicators={indicators} />
    </div>
    {item.status !== "NO_DATA" && <JudgmentExplanation indicators={indicators} />}
    <div className="ref-row">
      <References item={item} indicators={indicators.data} history={history} />
    </div>
    {forecast && <div className="forecast-panel">
      <div className="forecast-controls"><p>예측 모델 선택</p>{forecastControls}</div>
      {forecast}
    </div>}
  </section>;
}
