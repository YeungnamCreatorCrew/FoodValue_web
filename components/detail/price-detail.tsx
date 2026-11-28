"use client";

import { useCallback, useState, type ReactNode } from "react";
import type { PriceModelTrack } from "@/lib/prices/dto";
import { useTrackDetail } from "@/lib/prices/use-prices";
import { TrackContext } from "@/lib/prices/track";
import { trackLabel } from "@/lib/prices/track-meta";
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
/** 고른 모델의 예측 부분만 바꾼다(현재가·단위·지표는 그대로). 구조식이 없는 품목은 서버가 NO_FORECAST로 준다. */
function withForecastOf(item: LivePrice, model: LivePrice): LivePrice {
  return { ...item, baseDate: model.baseDate, forecastPoints: model.forecastPoints, forecastDate: model.forecastDate, forecastPrice: model.forecastPrice,
    forecastDelta: model.forecastDelta, forecastPercent: model.forecastPercent, forecastDirection: model.forecastDirection,
    status: model.status, quality: model.quality, guide: model.guide, forecastStatus: model.forecastStatus, dataFactors: model.dataFactors, aiSummary: model.aiSummary };
}

export function PriceDetail({ item, initialIndicators, yearHistory, supplyFactors, initialTrack = "ENSEMBLE", initialStruct = null }: {
  item: LivePrice;
  initialIndicators: PriceIndicators | null;
  yearHistory: YearHistory;
  supplyFactors: ReactNode;
  /** 주소의 ?model=struct. 서버가 구조식 상세를 미리 불렀으면 initialStruct로 받는다. */
  initialTrack?: PriceModelTrack;
  initialStruct?: LivePrice | null;
}) {
  const indicators = usePriceIndicators(item.id, initialIndicators);
  const [track, setTrack] = useState<PriceModelTrack>(initialTrack);
  const struct = useTrackDetail(item.id, track, initialStruct);
  // 모델을 바꿔도 새로고침·공유 때 같은 모델이 보이게 주소에 남긴다(화면을 다시 불러오지는 않는다).
  const changeTrack = useCallback((next: PriceModelTrack) => {
    setTrack(next);
    const url = new URL(window.location.href);
    if (next === "STRUCT") url.searchParams.set("model", "struct"); else url.searchParams.delete("model");
    window.history.replaceState(window.history.state, "", url);
  }, []);
  const forecastItem = track === "ENSEMBLE" ? item : struct.data ? withForecastOf(item, struct.data) : null;
  // 구조식을 받는 동안·실패했을 때 그래프에는 예측선을 그리지 않는다(앙상블 선을 구조식처럼 보이지 않게).
  const chartItem = forecastItem ?? { ...item, forecastPoints: [], forecastPrice: null, forecastDate: null };
  const baseline = chartItem.status === "BASELINE" || chartItem.quality === "BASELINE";
  const noData = item.status === "NO_DATA";
  return <main id="main-content" className="fv-page detail-page">
    <ItemSwitcher currentId={item.id} />
    <DetailHero item={item} indicators={indicators} history={yearHistory?.priceHistory ?? []}
      trend={noData ? undefined : <PriceTrend item={chartItem} baseline={baseline} yearHistory={yearHistory} bare forecastName={track === "STRUCT" ? `${trackLabel(track)} 7일 예측` : undefined} />}
      forecast={noData ? undefined : <TrackContext value={track}><ForecastCell item={forecastItem} track={track} onTrack={changeTrack}
        pending={forecastItem ? null : { error: struct.error ?? null, reload: struct.reload }} /></TrackContext>} />
    {/* 가격이 없으면 근거·그래프·예측이 각자 "가격이 없어요"를 반복하지 않게 한 번만 말한다. */}
    {noData ? <EmptyState title="가격 기록 없음">최근 조사된 가격이 없어 판단 근거·그래프·예측을 보여드릴 수 없어요.</EmptyState>
      : <EvidenceCards item={item} {...indicators} history={yearHistory?.priceHistory ?? []} />}
    {supplyFactors}
    <p className="fv-footnote">가격은 {item.source || "출처 정보 없음"} 전국 평균 소매가예요. 판단은 지난 가격 지표로 하고, 예측은 판단에 쓰지 않아요.</p>
  </main>;
}
