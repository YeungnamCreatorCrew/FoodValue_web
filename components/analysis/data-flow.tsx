import type { LivePrice, PriceIndicators, PricePoint } from "@/lib/prices/model";
import type { ShapAnalysis } from "@/lib/prices/shap";
import { formatNumber, formatWon, shortDate } from "@/lib/prices/format";
import { StateText } from "@/components/prices/indicator-ui";

/** 요인 묶음 → 실제 데이터 출처(WAS 수집기 기준). */
const SOURCES: Record<string, { name: string; source: string }> = {
  PRICE: { name: "가격", source: "KAMIS 소매·도매가" },
  WEATHER: { name: "날씨", source: "기상청 관측·예보" },
  CALENDAR: { name: "달력·계절", source: "요일·명절·공휴일" },
  MACRO: { name: "생산량·환율", source: "통계청 생산량·한국은행 환율" },
};
const ARIMA = "arima_trend";
const CARD_NAMES: Record<string, string> = { SEASONAL: "평년 대비", PRICE_POSITION: "1년 중 위치", RETAIL_WHOLESALE_GAP: "소매·도매 배수", VOLATILITY: "가격 출렁임", WHOLESALE_LEAD: "도매 흐름" };

function Arrow() {
  return <span className="an-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg></span>;
}
function Node({ title, children, tone, wide }: { title: string; children: React.ReactNode; tone?: "brand" | "ref"; wide?: boolean }) {
  return <div className={`an-node${tone ? ` is-${tone}` : ""}${wide ? " is-wide" : ""}`}><p className="an-node-title">{title}</p>{children}</div>;
}

export function DataFlow({ item, indicators, factors, history }: { item: LivePrice; indicators: PriceIndicators | null; factors: ShapAnalysis | null; history: PricePoint[] }) {
  const days = history.filter(p => p.price !== null).length;
  const seasonal = indicators?.cards.find(card => card.key === "SEASONAL");
  const years = seasonal?.key === "SEASONAL" ? seasonal.chart?.years ?? [] : [];
  const cards = indicators?.cards.filter(card => card.verdict !== "WEAK" && CARD_NAMES[card.key]) ?? [];
  const signal = indicators?.signals.find(s => s.key === "SEASONAL") ?? null;

  const explained = factors?.explained ?? false;
  const inputs = factors?.factors.filter(f => f.id !== ARIMA) ?? [];
  const hasArima = factors?.factors.some(f => f.id === ARIMA) ?? false;
  const groups = Object.entries(SOURCES).map(([key, value]) => ({ key, ...value, count: inputs.filter(f => f.category === key).length })).filter(g => g.count > 0);
  const ensemble = /^v2/i.test(factors?.modelName ?? "");
  const models = ensemble ? ["XGBoost", "LightGBM", ...(hasArima ? ["AutoARIMA"] : [])] : [factors?.modelName ?? "예측 모델"];

  return <div className="an-flow">
    <div className="an-lane" aria-label="판단 흐름">
      <p className="an-lane-label"><span className="fv-badge is-brand">판단</span>지난 가격만 써요</p>
      <div className="an-lane-row">
        <Node title="KAMIS 가격 기록">
          <p>일별 소매가 <b className="fv-num">{formatNumber(days)}일</b> (최근 1년)</p>
          {cards.some(card => card.key === "WHOLESALE_LEAD" || card.key === "RETAIL_WHOLESALE_GAP") && <p>같은 기간 도매가</p>}
          {years.length > 0 && <p>연도별 주 평균 <b className="fv-num">{years[0].year}~{years.at(-1)!.year}년</b></p>}
        </Node>
        <Arrow />
        <Node title={`지표 ${cards.length}개 계산`}>
          <ul className="an-node-list">{cards.map(card => <li key={card.key}>{CARD_NAMES[card.key]}</li>)}</ul>
        </Node>
        <Arrow />
        <Node title="판단" tone="brand">
          <p className="an-node-big"><StateText signal={signal} /></p>
          <p className="fv-cap">{indicators?.headline ?? "판단 문장이 없어요"}</p>
        </Node>
      </div>
    </div>

    <div className="an-lane is-ref" aria-label="AI 예측 흐름">
      <p className="an-lane-label"><span className="fv-badge tone-ref">AI 7일 예측</span>참고로만 보여드려요(판단에 안 써요)</p>
      {!explained || !factors ? <div className="an-lane-row">
        <Node title="KAMIS 가격 기록"><p>직전 가격</p></Node>
        <Arrow />
        <Node title="7일 뒤 값" tone="ref">
          <p className="an-node-big fv-num">{formatWon(item.forecastPrice ?? item.currentPrice)}</p>
          <p className="fv-cap">{item.forecastPrice === null ? "이 품목은 AI 예측이 없어요." : "과거 검증에서 모델이 직전 가격보다 덜 정확해서, 예측 대신 직전 가격을 써요."}</p>
        </Node>
      </div> : <div className="an-lane-row">
        <Node title="데이터 출처" wide>
          <ul className="an-node-list an-node-sources">{groups.map(g => <li key={g.key}><b>{g.name} <span className="fv-num">{g.count}개</span></b><span className="fv-cap">{g.source}</span></li>)}</ul>
        </Node>
        <Arrow />
        <Node title={`입력값 ${inputs.length}개`}>
          <p>날마다 계산한 숫자 묶음이에요.</p>
          <p className="fv-cap">예) {inputs.slice(0, 2).map(f => f.label).join(", ")}</p>
        </Node>
        <Arrow />
        <Node title={ensemble ? `모델 ${models.length}개` : "모델"}>
          <ul className="an-node-list">{models.map(m => <li key={m}>{m}{m === "AutoARIMA" && <span className="fv-cap"> (가격 흐름만)</span>}</li>)}</ul>
        </Node>
        {ensemble && <><Arrow /><Node title="같은 비중 평균"><p>세 모델 값을 똑같이 1/{models.length}씩 섞어요.</p></Node></>}
        <Arrow />
        <Node title={`${shortDate(factors.targetDate)} 예측`} tone="ref">
          <p className="an-node-big fv-num">{formatWon(factors.predictedPrice)}</p>
          <p className="fv-cap">기준일 {shortDate(factors.baseDate)} · 7일 뒤</p>
        </Node>
      </div>}
    </div>
  </div>;
}
