import type { BasisRow, ForecastBasis } from "@/lib/prices/model";
import { formatNumber, won } from "@/lib/prices/format";

const pct = (value: number | null) => value === null ? "-" : `${formatNumber(value, 1)}%`;
const month = (date: string | null) => date ? `${date.slice(2, 4)}.${date.slice(5, 7)}.${date.slice(8, 10)}` : "?";
const bestAi = (rows: BasisRow[]) => rows.find(row => row.ai) ?? null;
const naive = (rows: BasisRow[]) => rows.find(row => row.model === "LAST_PRICE") ?? null;

/** 후보별 평균 오차 막대. 짧을수록 정확하다. 직전 가격 줄은 '보여주는 값'으로 표시. */
function Bars({ rows, chosen }: { rows: BasisRow[]; chosen: string }) {
  const max = Math.max(...rows.map(row => row.mape ?? 0), 1);
  return <ul className="basis-bars">
    {rows.map(row => <li key={row.model} className={row.model === chosen ? "is-chosen" : undefined}>
      <span className="basis-label">{row.label}{row.model === chosen && <span className="fv-badge is-brand">보여주는 값</span>}</span>
      <span className="basis-track" aria-hidden="true"><span className={`basis-bar${row.ai ? " is-ai" : ""}`} style={{ width: `${((row.mape ?? 0) / max) * 100}%` }} /></span>
      <span className="basis-value fv-num">{pct(row.mape)}</span>
    </li>)}
  </ul>;
}

/**
 * 7일 뒤 값이 AI 예측이 아니라 '직전 가격 그대로'인 이유. 숨기지 않고 과거 성적 비교를 그대로 보여준다.
 * 상세 '왜?' 팝업과 분석실 AI 예측 섹션이 함께 쓴다.
 */
export function BaselineBasis({ basis, currentPrice }: { basis: ForecastBasis; currentPrice: number | null }) {
  if (basis.kind === "verdict") return <div className="basis">
    <p className="basis-head">AI 모델이 과거 검증에서 ‘직전 가격 그대로’보다 확실히 정확하지 않아서, 7일 뒤 값으로 직전 가격 {won(currentPrice)}을 보여드려요.</p>
    <dl className="basis-figures">
      {basis.naiveMape !== null && <div><dt>직전 가격 그대로의 과거 평균 오차</dt><dd className="fv-num">{pct(basis.naiveMape)}</dd></div>}
      {basis.aiPrice !== null && <div><dt>AI 모델이 계산한 7일 뒤 값 <span className="fv-cap">참고</span></dt><dd className="fv-num">{won(basis.aiPrice)}</dd></div>}
    </dl>
    <p className="fv-cap">평균 오차 = 과거{basis.samples !== null && ` ${formatNumber(basis.samples)}번`} 예측에서 실제 가격과 평균 몇 % 차이 났는지예요. 검증을 통과하면 다시 AI 예측을 보여드려요.</p>
  </div>;

  const ai = bestAi(basis.rows), last = naive(basis.rows);
  const recentAi = basis.recent ? bestAi(basis.recent.rows) : null, recentLast = basis.recent ? naive(basis.recent.rows) : null;
  const recentFlip = recentAi && recentLast && recentAi.mape !== null && recentLast.mape !== null && recentAi.mape < recentLast.mape;
  return <div className="basis">
    <p className="basis-head">과거 예측을 비교해 보니 ‘직전 가격 그대로’의 오차가 가장 작아서, 7일 뒤 값으로 직전 가격 {won(currentPrice)}을 보여드려요.</p>
    {ai && last && <p className="basis-sub">가장 나은 AI({ai.label.replace(/^AI · /, "")})의 평균 오차는 <b className="fv-num">{pct(ai.mape)}</b>, 직전 가격 그대로는 <b className="fv-num">{pct(last.mape)}</b>였어요.</p>}
    <Bars rows={basis.rows} chosen="LAST_PRICE" />
    <p className="fv-cap">평균 오차 = 과거{basis.samples !== null && ` ${formatNumber(basis.samples)}번`} 예측에서 실제 가격과 평균 몇 % 차이 났는지예요. 막대가 짧을수록 정확해요.</p>
    {recentFlip && <p className="basis-note">다만 최근 구간({month(basis.recent!.start)}~{month(basis.recent!.end)})만 따로 보면 {recentAi.label}의 오차가 <b className="fv-num">{pct(recentAi.mape)}</b>로 직전 가격(<b className="fv-num">{pct(recentLast.mape)}</b>)보다 작았어요. 어떤 값을 보여줄지는 위의 더 긴 구간 성적으로 정해요.</p>}
  </div>;
}
