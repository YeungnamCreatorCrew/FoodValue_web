// 목록 지표 mock (WAS feat/price-list-indicators가 붙기 전 화면 확인용)
// - lib/prices/api.ts 의 pricesApi.list 가 ?mock=indicators 일 때만 부른다. 화면은 이 파일을 직접 쓰지 않는다.
// - 서버가 이미 indicators를 내려준 행은 건드리지 않는다.
// - 문구는 WAS app/services/indicators/summary.py 의 라벨·문장 규칙과 같다. 값은 품목 id로 정해져 새로고침해도 같다.
import type { ListIndicatorsDto, PricePageDto, PriceSummaryDto } from "@/lib/prices/dto";

type State = "UP" | "NEUTRAL" | "DOWN";
const STATES: State[] = ["DOWN", "NEUTRAL", "UP"];
const POSITION_LABEL: Record<State, string> = { DOWN: "싼 편", UP: "비싼 편", NEUTRAL: "중간" };
const SEASONAL_LABEL: Record<State, string> = { DOWN: "싼 편", UP: "비싼 편", NEUTRAL: "평년 수준" };
const LEAD_LABEL: Record<State, string> = { UP: "상승 신호", DOWN: "하락 신호", NEUTRAL: "신호 없음" };
const SEASONAL_PHRASE: Record<State, string> = { DOWN: "평년보다 싼 편", UP: "평년보다 비싼 편", NEUTRAL: "평년 수준" };
const LEAD_PHRASE: Record<State, string> = {
  UP: "도매가가 크게 올라 앞으로 소매가도 오를 수 있는 신호가 보입니다",
  DOWN: "도매가가 크게 내려 앞으로 소매가도 내릴 수 있는 신호가 보입니다",
  NEUTRAL: "당장 가격을 움직일 신호는 보이지 않습니다",
};

function topic(name: string) {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 ? (code % 28 ? "은" : "는") : "은(는)");
}

// 대파(id 60)는 상세 mock(priceIndicatorsServer.ts)과 같은 값을 써서 홈과 상세의 지표가 어긋나지 않게 한다.
// 상세 mock에는 1년 중 위치 카드가 없어서 여기서도 넣지 않는다.
const DAEPA: ListIndicatorsDto = {
  asOfDate: "2026-10-30", stale: false,
  headline: "대파는 지금 평년보다 싼 편이고, 당장 가격을 움직일 신호는 보이지 않습니다.",
  signals: [
    { key: "SEASONAL", label: "같은 시기 대비", state: "DOWN", stateLabel: "싼 편" },
    { key: "WHOLESALE_LEAD", label: "도매 흐름", state: "NEUTRAL", stateLabel: "신호 없음" },
  ],
  yearRange: null,
};

function mockFor(item: PriceSummaryDto): ListIndicatorsDto | null {
  if (item.id === 60) return DAEPA;
  if (item.currentPrice === null) return null;
  const pick = (salt: number) => STATES[(item.id * 7 + salt * 3) % 3];
  const position = pick(1), seasonal = pick(2), lead = pick(4);
  const percentile = position === "DOWN" ? 0.18 : position === "UP" ? 0.82 : 0.5;
  // 현재가가 percentile 위치에 오도록 1년 범위를 만든다.
  const span = Math.round(item.currentPrice * 0.8);
  const low = Math.round(item.currentPrice - span * percentile);
  return {
    asOfDate: item.priceDate ?? "2026-11-20",
    stale: false,
    headline: `${topic(item.name)} 지금 ${SEASONAL_PHRASE[seasonal]}이고, ${LEAD_PHRASE[lead]}.`,
    signals: [
      { key: "PRICE_POSITION", label: "1년 중 위치", state: position, stateLabel: POSITION_LABEL[position] },
      { key: "SEASONAL", label: "같은 시기 대비", state: seasonal, stateLabel: SEASONAL_LABEL[seasonal] },
      { key: "WHOLESALE_LEAD", label: "도매 흐름", state: lead, stateLabel: LEAD_LABEL[lead] },
    ],
    yearRange: { low, high: low + span, percentile },
  };
}

export function withMockListIndicators(page: PricePageDto): PricePageDto {
  return { ...page, items: page.items.map(item => item.indicators ? item : { ...item, indicators: mockFor(item) }) };
}
