import type { LivePrice } from "@/lib/prices/model";
import type { ShapAnalysis } from "@/lib/prices/shap";
import { unavailableText } from "@/lib/prices/shap";
import { formatNumber, formatWon, shortDate } from "@/lib/prices/format";
import { receipt } from "@/lib/analysis/compute";

/** 원 단위 기여: +12원 / −5원. 0.5원 미만은 0원(중립)으로 보여준다(상세 요인 표와 같은 기준). */
function signedWon(value: number) {
  const rounded = Math.round(value);
  if (rounded === 0) return "0원";
  return `${rounded > 0 ? "+" : "−"}${formatNumber(Math.abs(rounded))}원`;
}
const tone = (value: number) => Math.round(value) > 0 ? "ref-up" : Math.round(value) < 0 ? "ref-down" : "";

export function ForecastReceipt({ item, factors }: { item: LivePrice; factors: ShapAnalysis | null }) {
  if (!factors || !factors.explained || factors.basePrice === null || factors.predictedPrice === null) {
    return <p className="fv-notice">{factors ? unavailableText(factors.unavailableReason) : "이번 예측의 요인 정보를 불러오지 못했어요."}</p>;
  }
  const r = receipt(factors);
  const peak = Math.max(...r.groups.map(g => Math.abs(g.total)), 1);
  return <div className="an-receipt-wrap">
    <article className="an-receipt" aria-label={`${item.name} 7일 예측 분해 영수증`}>
      <header className="an-receipt-head">
        <p className="an-receipt-title">{item.name} 7일 뒤 예측</p>
        <p className="fv-cap fv-num">기준일 {shortDate(factors.baseDate)} → {shortDate(factors.targetDate)}</p>
      </header>
      <dl className="an-receipt-lines">
        <div className="an-receipt-line is-base">
          <dt>기준값 <span className="fv-cap">모델의 출발점</span></dt>
          <dd className="fv-num">{formatWon(Math.round(factors.basePrice))}</dd>
        </div>
        {r.groups.map(group => <div key={group.category} className="an-receipt-group">
          <div className="an-receipt-line is-group">
            <dt>{group.label}</dt>
            <dd className={`fv-num ${tone(group.total)}`}>{signedWon(group.total)}</dd>
          </div>
          {group.lines.map(line => <div key={line.id} className="an-receipt-line is-sub">
            <dt>{line.label}</dt>
            <dd className={`fv-num ${tone(line.contribution)}`}>{signedWon(line.contribution)}</dd>
          </div>)}
        </div>)}
        {r.rounding !== null && Math.abs(r.rounding) >= 0.5 && <div className="an-receipt-line is-sub">
          <dt>반올림 차이</dt><dd className="fv-num">{signedWon(r.rounding)}</dd>
        </div>}
        <div className="an-receipt-line is-total">
          <dt>예측가</dt>
          <dd className="fv-num">{formatWon(factors.predictedPrice)}</dd>
        </div>
      </dl>
      <p className="an-receipt-foot fv-cap fv-num">기준값 {formatWon(Math.round(factors.basePrice))} {r.sum >= 0 ? "+" : "−"} 요인 합 {formatWon(Math.abs(Math.round(r.sum)))} = {formatWon(factors.predictedPrice)}</p>
    </article>

    <div className="an-receipt-side">
      <article className="fv-card an-share">
        <h3 className="an-card-title">묶음별 영향 크기</h3>
        <ul className="an-share-list">
          {r.groups.map(group => <li key={group.category}>
            <span className="an-share-label">{group.label}</span>
            <span className="an-share-track" aria-hidden="true">
              <span className={`an-share-bar ${tone(group.total)}`} style={{ width: `${(Math.abs(group.total) / peak) * 100}%` }} />
            </span>
            <span className={`fv-num an-share-value ${tone(group.total)}`}>{signedWon(group.total)}</span>
          </li>)}
        </ul>
        <p className="fv-cap">막대 길이 = 영향 크기, 색 = 방향(빨강 높임·파랑 낮춤, 참고 색이라 옅어요). 요인 {r.count}개.</p>
      </article>
      <article className="fv-card an-share">
        <h3 className="an-card-title">기준값이란?</h3>
        <p className="fv-cap">모델이 요인을 하나도 보지 않았을 때 내놓는 값이에요. {factors.modelName?.startsWith("v2")
          ? "트리 모델(XGBoost·LightGBM)은 학습한 평균 변화, AutoARIMA는 지금 가격에서 출발해요. 여기에 요인별 영향을 더하면 세 모델 평균 예측가가 돼요."
          : "여기에 요인별 영향을 더하면 예측가가 돼요."}</p>
        {factors.validation?.mape != null && <p className="fv-cap">과거 검증 평균 오차 {formatNumber(factors.validation.mape, 1)}%{factors.validation.within5Pct != null && ` · 실제 가격이 ±5% 안에 든 날 ${formatNumber(factors.validation.within5Pct, 0)}%`}</p>}
      </article>
    </div>
  </div>;
}
