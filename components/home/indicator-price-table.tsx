"use client";

import Link from "next/link";
import { useState } from "react";
import type { IndicatorState, LivePrice } from "@/lib/prices/model";
import { favoriteIdentity, isFavoriteItem } from "@/lib/prices/identity";
import { useFavorites } from "@/lib/home/favorites";
import { formatDate, formatPercent, won } from "@/lib/prices/format";
import { FavoriteStar } from "@/components/prices/favorite-star";
import { IngredientImage } from "@/components/prices/ingredient-image";
import { changeTone, ForecastLabel, StateText, toneClass, YearRangeBar } from "@/components/prices/indicator-ui";

const signalOf = (item: LivePrice, key: string) => item.listIndicators?.signals.find(signal => signal.key === key) ?? null;
const stateIs = (item: LivePrice, key: string, state: IndicatorState) => signalOf(item, key)?.state === state;

export const FILTERS = [
  { id: "all", label: "전체", test: () => true },
  { id: "seasonal-low", label: "평년보다 싼 품목", test: (item: LivePrice) => stateIs(item, "SEASONAL", "down") },
  { id: "year-low", label: "1년 중 싼 쪽", test: (item: LivePrice) => stateIs(item, "PRICE_POSITION", "down") },
  { id: "wholesale-up", label: "도매가 오르는 품목", test: (item: LivePrice) => stateIs(item, "WHOLESALE_LEAD", "up") },
] as const;
export type FilterId = (typeof FILTERS)[number]["id"];

type SortKey = "price" | "weekly" | "position" | "forecast";
const SORT_VALUE: Record<SortKey, (item: LivePrice) => number | null> = {
  price: item => item.currentPrice,
  weekly: item => item.weeklyChangeRate,
  position: item => item.listIndicators?.yearRange?.percentile ?? null,
  forecast: item => item.forecastPercent,
};

function SortHeader({ label, sortKey, sort, onSort, className = "" }: {
  label: React.ReactNode; sortKey: SortKey; sort: { key: SortKey; dir: 1 | -1 } | null; onSort: (key: SortKey) => void; className?: string;
}) {
  const active = sort?.key === sortKey;
  return <th scope="col" className={className} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
    <button type="button" className="table-sort" onClick={() => onSort(sortKey)}>
      {label}<span aria-hidden="true" className="table-sort-mark">{active ? (sort.dir === 1 ? "▲" : "▼") : ""}</span>
    </button>
  </th>;
}

/** 지표로 품목을 비교하는 시세표. AI 7일 예측은 맨 오른쪽 회색 열로 참고만 한다. */
export function IndicatorPriceTable({ items, filter, onFilterChange: setFilter }: {
  items: LivePrice[]; filter: FilterId; onFilterChange: (filter: FilterId) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const hasIndicators = items.some(item => item.listIndicators);
  const priceDate = items.map(item => item.priceDate).filter((date): date is string => Boolean(date)).toSorted().at(-1) ?? null;

  const test = FILTERS.find(entry => entry.id === filter)?.test ?? (() => true);
  const filtered = items.filter(test);
  const rows = sort ? filtered.toSorted((a, b) => {
    const left = SORT_VALUE[sort.key](a), right = SORT_VALUE[sort.key](b);
    if (left === null) return right === null ? 0 : 1; // 값 없는 행은 항상 아래
    if (right === null) return -1;
    return (left - right) * sort.dir;
  }) : filtered;
  // 고정한 품목은 정렬·필터 결과 안에서 항상 맨 위에 둔다.
  const favorites = useFavorites();
  const pinned = new Set(rows.filter(item => isFavoriteItem(item, favorites)).map(item => item.id));
  const ordered = [...rows.filter(item => pinned.has(item.id)), ...rows.filter(item => !pinned.has(item.id))];
  const onSort = (key: SortKey) => setSort(current => current?.key !== key ? { key, dir: 1 } : current.dir === 1 ? { key, dir: -1 } : null);

  return <div className="price-table-wrap">
    <div className="price-table-tools">
      {hasIndicators ? <div className="price-table-filters" role="group" aria-label="지표로 품목 거르기">
        {FILTERS.map(entry => <button type="button" key={entry.id} aria-pressed={filter === entry.id}
          onClick={() => setFilter(entry.id)}>{entry.label}</button>)}
      </div> : <p className="price-table-pending">가격 지표를 준비 중이라 지금은 가격과 AI 예측만 보여드려요.</p>}
      <p className="price-table-source">전국 평균 소매가 · KAMIS · 가격 기준일 {formatDate(priceDate)}</p>
    </div>
    {rows.length === 0 ? <p className="price-table-empty">조건에 맞는 품목이 없습니다.</p> : <div className="price-table-scroll">
      <table className="price-table">
        <thead><tr>
          <th scope="col">품목</th>
          <SortHeader label="현재가" sortKey="price" sort={sort} onSort={onSort} className="num" />
          <SortHeader label="주간" sortKey="weekly" sort={sort} onSort={onSort} className="num" />
          {hasIndicators && <>
            <SortHeader label="1년 중 위치" sortKey="position" sort={sort} onSort={onSort} />
            <th scope="col">평년 대비</th>
            <th scope="col">도매 흐름</th>
          </>}
          <SortHeader label={<>AI 7일 예측 <span className="table-ref">참고</span></>} sortKey="forecast" sort={sort} onSort={onSort} className="num col-ai" />
          <th scope="col"><span className="sr-only">상단 고정</span></th>
        </tr></thead>
        <tbody>{ordered.map((item, index) => <tr key={item.id} className={pinned.has(item.id) ? (index === pinned.size - 1 ? "is-pinned is-last-pinned" : "is-pinned") : undefined}>
          <th scope="row" className="col-item">
            <Link href={`/prices/${item.id}`} className="row-link"><IngredientImage item={item} /><span><strong>{item.name}</strong><small>{item.unit}</small></span></Link>
          </th>
          <td className="num col-price">{won(item.currentPrice)}</td>
          <td className={`num col-weekly ${changeTone(item.weeklyChangeRate)}`}>
            {item.weeklyChangeRate === null ? "—" : formatPercent(item.weeklyChangeRate)}</td>
          {hasIndicators && <>
            <td className="col-position"><span className="mobile-label">1년 중 </span><span className={`position-cell ${toneClass(signalOf(item, "PRICE_POSITION")?.state)}`}><YearRangeBar item={item} /><StateText signal={signalOf(item, "PRICE_POSITION")} /></span></td>
            <td className="col-seasonal"><span className="mobile-label">평년 대비 </span><StateText signal={signalOf(item, "SEASONAL")} /></td>
            <td className="col-lead"><span className="mobile-label">도매 </span><StateText signal={signalOf(item, "WHOLESALE_LEAD")} /></td>
          </>}
          <td className="num col-ai"><ForecastLabel item={item} /></td>
          <td className="col-star"><FavoriteStar {...favoriteIdentity(item)} name={item.name} className="favorite-star-row" /></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </div>;
}
