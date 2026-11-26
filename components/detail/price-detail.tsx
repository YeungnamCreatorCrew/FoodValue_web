"use client";

import type { LivePrice, PriceIndicators, PricePoint } from "@/lib/prices/model";
import { usePriceIndicators } from "@/lib/prices/use-prices";
import { PriceTrend } from "@/components/prices/price-trend";
import { DetailHero } from "./detail-hero";
import { EvidenceCards } from "./evidence-cards";
import { ForecastSection } from "./forecast-section";
import { ItemSwitcher } from "./item-switcher";
import { EmptyState } from "@/components/fv/state";

type YearHistory = { priceHistory: PricePoint[]; historyEndDate: string } | null;

/**
 * 품목 상세(PC 2단): 위 = 품목·현재가·한 줄 결론·기준 가격 4칸,
 * 아래 왼쪽 = 판단 근거(질문 + 큰 답), 아래 오른쪽 = 가격 흐름 + AI 7일 예측(참고, 자세한 내용은 팝업).
 * 가격 이력(365일)은 서버에서 한 번 받아 기준 가격과 그래프가 같이 쓴다.
 */
export function PriceDetail({ item, initialIndicators, yearHistory }: { item: LivePrice; initialIndicators: PriceIndicators | null; yearHistory: YearHistory }) {
  const indicators = usePriceIndicators(item.id, initialIndicators);
  const baseline = item.status === "BASELINE" || item.quality === "BASELINE";
  return <main id="main-content" className="fv-page detail-page">
    <ItemSwitcher currentId={item.id} />
    <DetailHero item={item} indicators={indicators} history={yearHistory?.priceHistory ?? []} />
    {/* 가격이 없으면 근거·그래프·예측이 각자 "가격이 없어요"를 반복하지 않게 한 번만 말한다. */}
    {item.status === "NO_DATA" ? <EmptyState title="가격 기록 없음">최근 조사된 가격이 없어 판단 근거·그래프·예측을 보여드릴 수 없어요.</EmptyState> : <div className="detail-grid">
      <EvidenceCards item={item} {...indicators} />
      <div className="detail-side">
        <PriceTrend item={item} baseline={baseline} yearHistory={yearHistory} />
        <ForecastSection item={item} />
      </div>
    </div>}
    <p className="fv-footnote">가격은 {item.source || "출처 정보 없음"} 전국 평균 소매가예요. 판단은 지난 가격 지표로 하고, 예측은 판단에 쓰지 않아요.</p>
  </main>;
}
