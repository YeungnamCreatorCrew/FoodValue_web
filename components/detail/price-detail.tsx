"use client";

import type { LivePrice, PriceIndicators, PricePoint } from "@/lib/prices/model";
import { usePriceIndicators } from "@/lib/prices/use-prices";
import { PriceTrend } from "@/components/prices/price-trend";
import { DetailHero } from "./detail-hero";
import { EvidenceCards } from "./evidence-cards";
import { ForecastCell } from "./forecast-section";
import { ItemSwitcher } from "./item-switcher";
import { EmptyState } from "@/components/fv/state";

type YearHistory = { priceHistory: PricePoint[]; historyEndDate: string } | null;

/**
 * 품목 상세(v3): 위 카드 = 품목·현재가 + 가격 흐름, 한 줄 결론, 기준 가격 4칸 + AI 7일 예측(참고),
 * 그 아래 = 판단 근거 카드 가로 한 줄(누르면 그 아래에 전체 폭으로 펼침).
 * 가격 이력(365일)은 서버에서 한 번 받아 기준 가격과 그래프가 같이 쓴다.
 */
export function PriceDetail({ item, initialIndicators, yearHistory }: { item: LivePrice; initialIndicators: PriceIndicators | null; yearHistory: YearHistory }) {
  const indicators = usePriceIndicators(item.id, initialIndicators);
  const baseline = item.status === "BASELINE" || item.quality === "BASELINE";
  const noData = item.status === "NO_DATA";
  return <main id="main-content" className="fv-page detail-page">
    <ItemSwitcher currentId={item.id} />
    <DetailHero item={item} indicators={indicators} history={yearHistory?.priceHistory ?? []}
      trend={noData ? undefined : <PriceTrend item={item} baseline={baseline} yearHistory={yearHistory} bare />}
      forecast={noData ? undefined : <ForecastCell item={item} />} />
    {/* 가격이 없으면 근거·그래프·예측이 각자 "가격이 없어요"를 반복하지 않게 한 번만 말한다. */}
    {noData ? <EmptyState title="가격 기록 없음">최근 조사된 가격이 없어 판단 근거·그래프·예측을 보여드릴 수 없어요.</EmptyState>
      : <EvidenceCards item={item} {...indicators} history={yearHistory?.priceHistory ?? []} />}
    <p className="fv-footnote">가격은 {item.source || "출처 정보 없음"} 전국 평균 소매가예요. 판단은 지난 가격 지표로 하고, 예측은 판단에 쓰지 않아요.</p>
  </main>;
}
