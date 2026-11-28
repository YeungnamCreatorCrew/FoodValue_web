import type { LivePrice, PriceIndicators, PricePoint, SeasonalCard } from "@/lib/prices/model";
import type { ShapAnalysis } from "@/lib/prices/shap";
import { formatNumber, formatWon, shortDate } from "@/lib/prices/format";
import { seasonalState } from "@/lib/analysis/compute";
import { StateText, toneClass } from "@/components/prices/indicator-ui";
import { SIGNAL_LABEL } from "@/components/fv/text";
import { SEASONAL_LABEL } from "./judgment-flow";
import { YearSpark } from "./year-spark";

// 서버 문구(상승·하락 신호) 대신 웹의 다른 화면과 같은 말을 쓴다.
const LEAD_LABEL = { down: "내림 신호", neutral: "신호 없음", up: "오름 신호" } as const;

export interface JumpLink { id: string; label: string }

/** 맨 위 요약: 지금 판단 한 줄 → 그 이유 숫자 → 판단에 안 쓰는 신호·AI 예측 → 아래 섹션 바로가기. */
export function AnalysisSummary({ item, indicators, seasonal, factors, history, jumps }: {
  item: LivePrice; history: PricePoint[]; indicators: PriceIndicators | null; seasonal: SeasonalCard | null; factors: ShapAnalysis | null; jumps: JumpLink[];
}) {
  const { recentAvg, normalAvg, diffRate } = seasonal?.fact ?? { recentAvg: null, normalAvg: null, diffRate: null };
  const state = seasonal?.state ?? (diffRate === null ? null : seasonalState(diffRate));
  const others = (indicators?.signals ?? []).filter(s => s.key !== "SEASONAL" && s.state !== null)
    .map(s => ({ ...s, label: SIGNAL_LABEL[s.key] ?? s.label, stateLabel: s.key === "WHOLESALE_LEAD" && s.state ? LEAD_LABEL[s.state] : s.stateLabel }));
  const forecast = factors?.explained && factors.predictedPrice !== null ? factors.predictedPrice : item.forecastPrice;
  const target = factors?.targetDate ?? null;

  return <section id="summary" aria-labelledby="summary-title" className="fv-card an-summary">
    <div className="an-sum-main">
      <h2 id="summary-title" className="an-sum-name">{item.name} <span className="fv-num an-sum-price">{formatWon(item.currentPrice)}</span>{item.unit && <span className="fv-cap"> / {item.unit}</span>}</h2>
      {state && diffRate !== null && recentAvg !== null && normalAvg !== null ? <>
        <p className={`an-sum-verdict ${toneClass(state)}`}><span className="fv-cap">평년 대비</span> {SEASONAL_LABEL[state]}</p>
        <p className="an-sum-why">최근 4주 평균 <b className="fv-num">{formatWon(recentAvg)}</b>이 평년 같은 시기 <b className="fv-num">{formatWon(normalAvg)}</b>보다{" "}
          {Math.abs(diffRate) < 0.0005 ? <b>같아요</b> : <b className="fv-num">{formatNumber(Math.abs(diffRate * 100), 1)}% {diffRate < 0 ? "낮아요" : "높아요"}</b>}.
          {" "}홈에서 보는 판단은 이 값 하나로 정해요.</p>
      </> : <p className="an-sum-why">{indicators?.notices[0]?.text ?? "이 품목은 지금 평년 대비 판단이 없어요(과거 가격이 모자라요)."}</p>}
    </div>

    <dl className="an-sum-side">
      <div>
        <dt>최근 1년 가격</dt>
        <dd><YearSpark history={history} state={state} name={item.name} /></dd>
      </div>
      {others.length > 0 && <div>
        <dt>같이 볼 신호 <span className="fv-cap">판단에는 안 써요</span></dt>
        <dd className="an-sum-signals">{others.map(s => <span key={s.key}><span className="fv-cap">{s.label}</span> <StateText signal={s} /></span>)}</dd>
      </div>}
      <div>
        <dt>{item.forecastBasis ? "7일 뒤 값" : "AI 7일 뒤 예측"} <span className="fv-cap">참고</span></dt>
        <dd>{forecast === null ? <span className="fv-cap">이 품목은 AI 예측이 없어요</span>
          : <><b className="fv-num">{formatWon(forecast)}</b>{item.forecastBasis ? <span className="fv-cap"> 직전 가격 그대로 (AI가 더 정확하지 않았어요)</span>
            : target && <span className="fv-cap"> ({shortDate(target)})</span>}</>}</dd>
      </div>
    </dl>

    {jumps.length > 0 && <nav className="an-jump" aria-label="이 화면에서 바로가기">
      {jumps.map(jump => <a key={jump.id} href={`#${jump.id}`}>{jump.label}</a>)}
    </nav>}
  </section>;
}
