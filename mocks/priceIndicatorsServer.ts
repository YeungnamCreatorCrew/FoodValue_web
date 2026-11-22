// 가짜 가격 지표 서버 (WAS에 /indicators API가 생기기 전까지만 쓴다)
// - lib/prices/api.ts 의 pricesApi.indicators 가 이 파일을 부른다. 화면은 이 파일을 직접 쓰지 않는다.
// - 응답 모양은 PRICE_API_INTEGRATION.md "판단 보조 지표" 의 계약 초안(camelCase)과 같다.
// - 대파(id 60)만 카드가 있고, 다른 품목은 unavailableReason 으로 "준비 중"을 돌려준다.
// - ?mock=empty 는 cards: [] + unavailableReason, ?mock=error 는 호출 실패. (mockMode.ts)
import type { PriceIndicatorsDto } from "@/lib/prices/dto";
import { simulateRequest } from "./mockMode";
import { DAEPA_RECENT_INDEX, DAEPA_SEASONAL_YEARS } from "./priceIndicatorsData";

const DAEPA_ID = 60;

function daepa(): PriceIndicatorsDto {
  return {
    itemId: DAEPA_ID, market: "RETAIL", asOfDate: "2026-10-30", unavailableReason: null,
    summary: {
      headline: "대파는 지금 평년보다 싼 편이고, 당장 가격을 움직일 신호는 보이지 않습니다.",
      signals: [
        { key: "SEASONAL", label: "같은 시기 대비", state: "DOWN", stateLabel: "싼 편" },
        { key: "WHOLESALE_LEAD", label: "도매 흐름", state: "NEUTRAL", stateLabel: "신호 없음" },
        { key: "HARVEST_WEATHER", label: "수확지 날씨", state: "NEUTRAL", stateLabel: "문제 없음" },
      ],
    },
    cards: [
      {
        key: "SEASONAL", verdict: "FACT", state: "DOWN",
        fact: { currentPrice: 2658, windowDays: 28, recentAvg: 2838, normalAvg: 3334, normalYears: [2021, 2022, 2023, 2024, 2025],
          diffRate: -0.149, cheaperThanCount: 9, historyYears: 10 },
        evidence: { text: "대파는 계절마다 가격 수준이 달라서 같은 시기끼리 비교합니다." },
        chart: { type: "SEASONAL_OVERLAY", currentYear: 2026,
          years: DAEPA_SEASONAL_YEARS.map(({ year, points }) => ({ year, points: points.map(([week, price]) => ({ week, price })) })) },
      },
      {
        key: "WHOLESALE_LEAD", verdict: "PASS", state: "NEUTRAL",
        fact: { wholesaleChange2w: -0.012, retailChange2w: -0.087 },
        evidence: { upAfterRate: 0.72, baseUpRate: 0.44, downAfterRate: 0.71, baseDownRate: 0.46,
          threshold: 0.05, sampleUp: 193, sampleDown: 205, periodStart: "2016-01-04", periodEnd: "2026-10-30" },
        chart: { type: "INDEXED_LINES", baseDate: DAEPA_RECENT_INDEX[0][0],
          points: DAEPA_RECENT_INDEX.map(([date, wholesale, retail]) => ({ date, wholesale, retail })) },
      },
      {
        key: "HARVEST_WEATHER", verdict: "CONDITIONAL", state: "NEUTRAL", available: true,
        fact: { region: "이천·대관령", rain4w: 54, normalRain4w: 71 },
        evidence: { threshold: 293, upRateWhenHeavy: 0.72, upRateOtherwise: 0.53 },
      },
      {
        key: "ARRIVALS", verdict: "WEAK", state: null,
        fact: { market: "가락시장", avgTon4w: 325, normalTon: 325, diffRate: 0.0 },
      },
    ],
  };
}

const unavailable = (itemId: number, reason: string): PriceIndicatorsDto =>
  ({ itemId, market: "RETAIL", asOfDate: null, unavailableReason: reason, summary: null, cards: [] });

export async function fetchMockIndicators(itemId: number): Promise<PriceIndicatorsDto> {
  const mode = await simulateRequest();
  if (mode === "empty") return unavailable(itemId, "지금은 보여줄 지표가 없습니다. (mock=empty)");
  return itemId === DAEPA_ID ? daepa() : unavailable(itemId, "이 품목은 아직 지표를 준비 중입니다");
}
