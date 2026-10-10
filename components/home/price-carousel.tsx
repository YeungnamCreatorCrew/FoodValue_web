"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { HomePriceSummary } from "@/lib/home/types";
import { FigmaIcon } from "./figma-icon";

const recommendations = {
  BUY_NOW: { label: "지금 구매 추천", tone: "bg-emerald-50 text-emerald-700" },
  BUY_LATER: { label: "조금 기다려보세요", tone: "bg-blue-50 text-blue-700" },
  HOLD: { label: "가격을 지켜보세요", tone: "bg-amber-50 text-amber-700" },
  STABLE: { label: "필요할 때 구매해요", tone: "bg-slate-100 text-slate-600" },
};
const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export function PriceCarousel({ prices }: { prices: HomePriceSummary[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  function updateActive() {
    const list = track.current;
    const first = list?.children[0] as HTMLElement | undefined;
    if (!list || !first) return;
    const step = first.getBoundingClientRect().width + 10;
    setActive(Math.min(prices.length - 1, Math.max(0, Math.round(list.scrollLeft / step))));
  }

  function showCard(index: number) {
    const list = track.current;
    const first = list?.children[0] as HTMLElement | undefined;
    if (!list || !first) return;
    list.scrollTo({ left: index * (first.getBoundingClientRect().width + 10), behavior: "instant" });
    setActive(index);
  }

  return (
    <div role="region" aria-roledescription="캐러셀" aria-label="주요 품목 시세">
      <ul id="home-prices" ref={track} onScroll={updateActive} tabIndex={0}
        aria-label="좌우로 넘겨 품목 보기"
        className="scrollbar-none flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain rounded-[14px] pb-1 pr-[max(0px,calc(100%-262px))]">
        {prices.map((item) => {
          const recommendation = recommendations[item.recommendation];
          const trend = item.forecastPrice - item.currentPrice;
          return (
            <li key={item.itemId} className="w-[262px] max-w-full shrink-0 snap-start rounded-[14px] border border-border bg-white p-3.5">
              <article aria-label={`${item.name} 시세`} className="flex h-full flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Image src={item.imageUrl} alt="" width={48} height={48} className="size-12 shrink-0 rounded-[10px] object-cover" />
                  <div className="min-w-0">
                    <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{item.category}</span>
                    <h3 className="mt-1 text-base leading-5 font-bold">{item.name}</h3>
                    <p className="mt-0.5 text-[10px] leading-[14px] text-muted">{item.unit}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] leading-4 text-muted">오늘 평균가</p>
                  <p className="text-[26px] leading-[34px] font-extrabold tracking-[-0.26px] tabular-nums">{won(item.currentPrice)}</p>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                  <div>
                    <p className="text-[10px] leading-[14px] text-muted">7일 뒤 AI 예상가</p>
                    <p className="mt-0.5 text-base leading-5 font-bold text-primary tabular-nums">{won(item.forecastPrice)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${trend > 0 ? "bg-red-50 text-red-600" : trend < 0 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {trend > 0 ? "↗ 상승 예상" : trend < 0 ? "↘ 하락 예상" : "— 안정 예상"}
                  </span>
                </div>
                <div className={`mt-auto rounded-lg px-2.5 py-2.5 ${recommendation.tone}`}>
                  <p className="text-xs leading-[18px] font-semibold">{recommendation.label}</p>
                  <p className="mt-1 text-[11px] leading-4">{item.buyingGuide}</p>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      <div className="flex h-11 items-center justify-center" aria-label="시세 카드 선택">
        {prices.map((item, index) => (
          <button key={item.itemId} type="button" onClick={() => showCard(index)} aria-label={`${item.name} 시세 보기`}
            aria-pressed={active === index} aria-controls="home-prices" className="flex size-11 items-center justify-center rounded-lg">
            <FigmaIcon name={active === index ? "dot-active" : "dot"} />
          </button>
        ))}
      </div>
    </div>
  );
}
