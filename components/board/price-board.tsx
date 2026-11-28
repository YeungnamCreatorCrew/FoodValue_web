"use client";

import Link from "next/link";
import { RuleTip } from "@/components/fv/judgment-tip";
import { loadAllIndicatorCards } from "@/lib/prices/all-indicators";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LivePrice, PriceListPage } from "@/lib/prices/model";
import { useTransition } from "react";
import { formatPercent, longDate, shortDate, won } from "@/lib/prices/format";
import { WeeklyChange, ForecastChange } from "@/components/fv/change";
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from "@/components/fv/state";
import { FvIcon } from "@/components/fv/icons";
import { IngredientImage } from "@/components/prices/ingredient-image";
import { Sparkline } from "./sparkline";
import { PercentileBar, StateText } from "@/components/prices/indicator-ui";
import { countByState, filterItems, FILTERS, headline, latestDate, MANY_ITEMS, movers, PAGE_SIZE, positionWord, signalOf, SORT_NOTE, SORTS, sortItems, type FilterKey, type SortKey } from "./board-model";

const CATEGORY_LABEL: Record<string, string> = { VEGETABLE: "채소", GRAIN: "곡물", FRUIT: "과일", MEAT: "고기", SEAFOOD: "수산물", ETC: "기타" };
const SORT_LABEL: Record<SortKey, string> = { seasonal: "평년보다 싼 순", change: "지난주보다 많이 내린 순", position: "1년 중 낮은 쪽 순", name: "이름 순" };
const pick = <T extends string>(value: string | null, options: readonly T[], fallback: T) => options.includes(value as T) ? value as T : fallback;

/** 정렬할 수 있는 열 머리글. 현재가는 품목마다 단위가 달라 정렬하지 않는다. */
const COLUMNS: { key: SortKey | null; label: string; className: string; rule?: string }[] = [
  { key: "name", label: "품목", className: "col-item" },
  { key: null, label: "현재가", className: "col-price" },
  { key: "change", label: "지난주 대비", className: "col-change" },
  { key: "seasonal", label: "평년 대비", className: "col-judge", rule: "SEASONAL" },
  { key: null, label: "최근 8주", className: "col-spark" },
  { key: "position", label: "1년 중 위치", className: "col-position", rule: "PRICE_POSITION" },
];

/** 7일 뒤 예측은 판단이 아니라 참고라서 표 열이 아니라 품목 이름 아래 작은 글씨로 둔다. */
function ForecastCell({ item }: { item: LivePrice }) {
  if (item.status === "BASELINE" || item.quality === "BASELINE") return <>7일 뒤 직전 가격 · 참고</>;
  if (item.forecastPercent === null) return <>7일 뒤 정보 없음</>;
  return <>7일 뒤 <ForecastChange value={item.forecastPercent} /> · 참고</>;
}

function PositionCell({ item }: { item: LivePrice }) {
  const range = item.listIndicators?.yearRange;
  const word = positionWord(range?.percentile);
  if (!range || !word || range.percentile === null || range.low === null || range.high === null) return <span className="board-missing">정보 없음</span>;
  return <div className="board-position">
    <PercentileBar compact percentile={range.percentile} label={`최근 1년 중 지금보다 싼 날 ${Math.round(range.percentile * 100)}% (최저 ${won(range.low)}, 최고 ${won(range.high)})`} />
    <span className="board-position-word">{word.word}</span>
  </div>;
}

function Row({ item, href, latest }: { item: LivePrice; href: string; latest: string | null }) {
  const router = useRouter();
  const seasonal = signalOf(item, "SEASONAL");
  // 줄 어디를 눌러도 상세로 간다. 키보드·화면 낭독기는 품목 이름 링크로 간다.
  return <tr className="board-row" onClick={event => { if (!(event.target as HTMLElement).closest("a")) router.push(href); }}>
    <th scope="row" className="col-item">
      <Link href={href} prefetch={false} className="board-item">
        <IngredientImage item={item} size={48} />
        <span className="board-name"><b>{item.name}</b><span className="board-sub"><span className="board-unit">{item.unit}</span><span className="board-forecast"><ForecastCell item={item} /></span></span></span>
      </Link>
    </th>
    <td className="col-price" data-label="현재가">{item.currentPrice === null ? <span className="board-missing">정보 없음</span> : <><b className="fv-num">{won(item.currentPrice)}</b>{latest && item.priceDate && item.priceDate < latest && <small className="board-old">{shortDate(item.priceDate)} 값</small>}</>}</td>
    <td className="col-change" data-label="지난주 대비"><WeeklyChange value={item.weeklyChangeRate} /></td>
    <td className="col-judge" data-label="평년 대비">{seasonal ? <span className="board-seasonal"><span className={`judge-pill ${seasonal.state === "down" ? "tone-down" : seasonal.state === "up" ? "tone-up" : "tone-flat"}`}><StateText signal={seasonal} /></span>{item.listIndicators?.seasonalDiffRate != null && <small className="board-seasonal-rate">평년 {formatPercent(item.listIndicators.seasonalDiffRate * 100)}</small>}</span> : <span className="board-missing">정보 없음</span>}</td>
    <td className="col-spark" data-label="최근 8주"><Sparkline id={item.id} name={item.name} /></td>
    <td className="col-position" data-label="1년 중 위치"><PositionCell item={item} /></td>

  </tr>;
}

/**
 * 홈 품목 표. 목록은 서버가 불러와 넘겨준다(initial). 서버에서 실패하면 브라우저가 WAS를 직접 부르지 않고,
 * '다시 시도'를 누르면 화면을 서버에서 새로 그린다(router.refresh). 그래서 오류가 콘솔에 남지 않는다.
 */
export function PriceBoard({ initial }: { initial: PriceListPage | null }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const sort = pick<SortKey>(params.get("sort"), SORTS, "seasonal");
  const filter = pick<FilterKey>(params.get("f"), FILTERS.map(entry => entry.key), "all");
  const keyword = params.get("q") ?? "";
  const category = params.get("c") ?? "ALL";
  const page = Math.max(1, Number(params.get("p")) || 1);
  // 품목은 한 번에 최대 50개까지 받아 화면에서 정렬·거른다(WAS 정렬 기준에 '평년 대비'가 없다).
  const data = initial;
  const [refreshing, startRefresh] = useTransition();

  function update(next: Record<string, string | null>) {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) if (value === null || value === "") query.delete(key); else query.set(key, value);
    if (!("p" in next)) query.delete("p");
    const text = query.toString();
    // 거르기·정렬은 화면에서만 바뀌므로 서버를 다시 부르지 않게 브라우저 주소만 바꾼다(useSearchParams와 연동됨).
    window.history.replaceState(null, "", text ? `${pathname}?${text}` : pathname);
  }

  if (refreshing) return <LoadingRegion label="품목 시세를 다시 불러오는 중이에요">
    <div className="board-skel"><Skeleton className="skel-head" /><Skeleton className="skel-chips" /><Skeleton className="skel-table" /></div>
  </LoadingRegion>;
  if (!data) return <><h1 className="fv-h1">품목 시세</h1><ErrorState message="" onRetry={() => startRefresh(() => router.refresh())} /></>;

  const items = data.items;
  if (!items.length) return <><h1 className="fv-h1">품목 시세</h1><EmptyState title="품목 없음">아직 시세를 제공하는 품목이 없어요.</EmptyState></>;
  const many = items.length >= MANY_ITEMS;
  const counts = countByState(items);
  const shown = sortItems(filterItems(items, filter, keyword, category), sort);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = many ? shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) : shown;
  const date = latestDate(items);
  const staleItems = items.filter(item => item.status === "STALE" || (!!date && !!item.priceDate && item.priceDate < date));
  const sources = [...new Set(items.map(item => item.source).filter(Boolean))].join("·");
  const categories = [...new Set(items.map(item => item.categoryCode))];
  const lines = movers(items);
  const detailHref = (item: LivePrice) => `/prices/${item.id}`;

  return <>
    <section className="board-hero" aria-labelledby="board-title">
      <p className="board-date">{date ? <><time dateTime={date}>{longDate(date)}</time> 기준</> : "기준일 정보 없음"}{sources && ` · ${sources} 소매가`}
        {/* 상세와 같은 짧은 꼬리표. 상자로 두면 첫 화면에서 품목 줄이 밀려난다. */}
        {staleItems.length > 0 && <span className="hero-stale"><span className="sr-only"> · </span>{staleItems.length === items.length ? "최신 가격 늦음" : `${staleItems.map(item => item.name).join("·")} 최신 가격 늦음`}</span>}</p>
      <h1 id="board-title" className="board-headline">{headline(items)}</h1>
      {lines.length > 0 && <ul className="board-movers">{lines.map(line => <li key={line.tone}>{line.lead}<b className={`tone-${line.tone}`}>{line.strong}</b>{line.tail}</li>)}</ul>}
    </section>

    <section className="board" aria-labelledby="board-list-title">
      <div className="board-tools">
        <h2 id="board-list-title" className="sr-only">품목별 시세</h2>
        <div className="fv-chips" role="group" aria-label="평년 대비로 거르기">
          {FILTERS.map(entry => <button key={entry.key} type="button" className="fv-chip" aria-pressed={filter === entry.key}
            onClick={() => update({ f: entry.key === "all" ? null : entry.key })}>{entry.label} <span className="count">{counts[entry.key]}</span></button>)}
          {/* 모바일은 표 머리글이 없어서 판단(평년 대비) 도움말을 거르기 버튼 옆에도 둔다. */}
          <span className="board-filter-tip"><RuleTip ruleKey="SEASONAL" loadCards={() => loadAllIndicatorCards(items.map(item => item.id))} scope={`품목 ${items.length}개 과거 기록 합산`} /></span>
        </div>
        <label className="fv-search board-search"><FvIcon name="search" size={18} /><span className="sr-only">품목 이름이나 별칭으로 찾기</span>
          <input type="search" value={keyword} placeholder="품목 검색 · 예: 오이, 청상추" maxLength={50}
            onChange={event => update({ q: event.target.value })} /></label>
      </div>
      {categories.length > 1 && <div className="fv-chips board-categories" role="group" aria-label="분류">
        {["ALL", ...categories].map(code => <button key={code} type="button" className="fv-chip" aria-pressed={category === code}
          onClick={() => update({ c: code === "ALL" ? null : code })}>{code === "ALL" ? "모든 분류" : CATEGORY_LABEL[code] ?? code}</button>)}
      </div>}
      <div className="board-sortline">
        <p className="board-sortnote" aria-live="polite">{SORT_NOTE[sort]} <span className="board-sorthint">열 이름을 누르면 순서가 바뀌어요.</span></p>
        <label className="board-sortselect"><span className="fv-cap">순서</span>
          <select value={sort} onChange={event => update({ sort: event.target.value === "seasonal" ? null : event.target.value })}>
            {SORTS.map(key => <option key={key} value={key}>{SORT_LABEL[key]}</option>)}
          </select></label>
      </div>
      <p className="board-result-count fv-cap" role="status">{keyword.trim() ? `‘${keyword.trim()}’ 검색 · ` : ""}{shown.length}개 품목{shown.length !== items.length && ` / 전체 ${items.length}개`}</p>
      <p className="fv-cap board-judgment-note">평년 대비는 최근 4주 평균을 직전 5년 같은 시기와 비교해요. +10% 이상은 비싼 편, −10% 이하는 싼 편이에요.</p>

      {shown.length === 0 ? <EmptyState title="맞는 품목이 없어요" action={<button type="button" className="fv-btn is-quiet" onClick={() => update({ f: null, q: null, c: null })}>조건 지우기</button>}>
        {keyword ? `‘${keyword}’에 맞는 품목이 없어요.` : "이 조건에 맞는 품목이 없어요."}</EmptyState>
        : <table className="board-table">
          <caption className="sr-only">품목별 시세 표예요. 7일 뒤 예측은 품목 이름 아래에 참고로 적었어요. {SORT_NOTE[sort]}</caption>
          <thead><tr>{COLUMNS.map(column => <th key={column.label} scope="col" className={column.className}
            aria-sort={column.key && column.key === sort ? "ascending" : undefined}>
            <span className="board-th">{column.key ? <button type="button" className="board-sort" aria-pressed={column.key === sort} onClick={() => update({ sort: column.key === "seasonal" ? null : column.key })}>
              {column.label}<span aria-hidden="true" className="board-sort-mark">{column.key === sort ? "▲" : "↕"}</span></button> : column.label}
              {column.rule && <RuleTip ruleKey={column.rule} loadCards={() => loadAllIndicatorCards(items.map(item => item.id))} scope={`품목 ${items.length}개 과거 기록 합산`} />}</span>
          </th>)}</tr></thead>
          <tbody>{visible.map(item => <Row key={item.id} item={item} href={detailHref(item)} latest={date} />)}</tbody>
        </table>}

      {many && pages > 1 && <nav className="board-pages" aria-label="쪽 이동">
        {Array.from({ length: pages }, (_, index) => index + 1).map(number => <button key={number} type="button" className="fv-chip" aria-current={number === current ? "page" : undefined}
          aria-pressed={number === current} onClick={() => update({ p: number === 1 ? null : String(number) })}>{number}</button>)}
      </nav>}
    </section>
    <p className="fv-footnote">판단(싼 편·평년 수준·비싼 편)은 지난 가격으로 만든 지표로 해요. 7일 뒤 예측은 AI 모델이 계산한 참고값이라 판단에 쓰지 않아요. 표 머리글의 <span aria-hidden="true">?</span> 를 누르면 지표마다 판단 기준을 볼 수 있어요. <a href="/images/items/credits.html" className="fv-link">사진 출처</a></p>
  </>;
}
