import type { AboutItem } from "@/lib/about/data";
import { MODEL_HISTORY, MODEL_NAMES } from "@/lib/about/data";
import { formatNumber, formatWon, shortDate, yearMonth } from "@/lib/prices/format";

const MODELS = [
  { key: "XGBOOST", name: "XGBoost", how: "결정 나무 수백 개를 차례로 쌓아, 앞 나무가 틀린 만큼을 다음 나무가 고쳐요.", sees: "가격·날씨·달력 입력값 전부" },
  { key: "LIGHTGBM", name: "LightGBM", how: "XGBoost와 같은 계열이지만 나무를 키우는 방식이 달라, 변동이 큰 품목에 강해요.", sees: "가격·날씨·달력 입력값 전부" },
  { key: "AUTOARIMA", name: "AutoARIMA", how: "한 품목의 지난 가격 흐름만 보고 다음 값을 이어 그려요. 위 두 모델과 틀리는 방식이 달라요.", sees: "그 품목 가격 흐름만" },
];
/** 모델 점 모양(색 대신 모양으로 구분). */
const SHAPE: Record<string, string> = { XGBOOST: "is-circle", LIGHTGBM: "is-diamond", AUTOARIMA: "is-triangle" };

export function ModelStructure() {
  return <article className="fv-card ab-model-one">
    <p><b>서로 다른 모델 세 개의 값을 똑같이 1/3씩 평균 내요.</b> 한 모델이 크게 틀려도 나머지가 메워 줘요.</p>
    <ul className="ab-model-list">
      {MODELS.map(m => <li key={m.key}><span className={`ab-mark ${SHAPE[m.key]}`} aria-hidden="true" /><b>{m.name}</b> {m.how}</li>)}
    </ul>
    <p className="fv-cap">과거 검증에서 직전 가격 그대로 쓰는 것보다 덜 정확한 품목은 AI 값 대신 직전 가격을 보여드려요. Gemini는 설명 문장을 다듬는 데만 쓰고, 예측 숫자에는 쓰지 않아요.</p>
  </article>;
}

/** 이번 7일 예측: 품목마다 세 모델 값과 평균을 '현재가 대비 %' 한 줄 위에 점으로. 품목끼리 가격대가 달라 %로 맞춘다. */
export function ModelCompare({ items }: { items: AboutItem[] }) {
  const rows = items.flatMap(row => row.forecast && row.item.currentPrice ? [{ row, current: row.item.currentPrice, f: row.forecast }] : []);
  if (!rows.length) return <p className="fv-notice">이번 예측의 모델별 값이 없어요(직전 가격 유지 품목만 있거나 예측이 없어요).</p>;
  const rel = (price: number, current: number) => price / current - 1;
  const values = rows.flatMap(({ f, current }) => [...f.members.map(m => rel(m.price, current)), rel(f.ensemble ?? current, current)]);
  // 0(현재가)을 늘 넣고, 값이 있는 쪽으로만 넓힌다. 눈금은 2% 또는 4% 간격.
  const step = Math.max(...values.map(Math.abs)) > 0.12 ? 0.04 : 0.02;
  const lo = Math.min(0, Math.floor(Math.min(...values) / step) * step), hi = Math.max(step, Math.ceil(Math.max(...values) / step) * step);
  const x = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => Math.round((lo + i * step) * 1000) / 1000);
  const pct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${formatNumber(Math.abs(v * 100), 1)}%`;
  return <figure className="fv-card ab-dots">
    <div className="ab-dots-legend fv-cap" aria-hidden="true">
      {Object.entries(MODEL_NAMES).map(([key, name]) => <span key={key}><i className={`ab-mark ${SHAPE[key]}`} />{name}</span>)}
      <span><i className="ab-mark is-mean" />평균(화면 값)</span>
    </div>
    <div className="ab-dots-plot">
      <div className="ab-dots-axis fv-cap fv-num" aria-hidden="true">
        <span />
        <span className="ab-dots-scale">{ticks.map(t => <span key={t} style={{ left: x(t) }}>{t === 0 ? "현재가" : `${t > 0 ? "+" : "−"}${formatNumber(Math.abs(t * 100), 0)}%`}</span>)}</span>
        <span />
      </div>
      {rows.map(({ row, current, f }) => {
        const mean = f.ensemble ?? current;
        return <div key={row.item.id} className="ab-dots-row">
          <span className="ab-dots-name">{row.item.name}</span>
          <span className="ab-dots-track" role="img" aria-label={`${row.item.name} 7일 뒤: ${f.members.map(m => `${MODEL_NAMES[m.key]} ${formatWon(Math.round(m.price))}`).join(", ")}, 평균 ${formatWon(Math.round(mean))}`}>
            {ticks.map(t => <span key={t} className={`ab-dots-grid${t === 0 ? " is-zero" : ""}`} style={{ left: x(t) }} />)}
            <span className="ab-dots-spread" style={{ left: x(Math.min(...f.members.map(m => rel(m.price, current)))), right: `calc(100% - ${x(Math.max(...f.members.map(m => rel(m.price, current))))})` }} />
            {f.members.map(m => <span key={m.key} className={`ab-mark ${SHAPE[m.key]} ab-dot`} style={{ left: x(rel(m.price, current)) }} title={`${MODEL_NAMES[m.key]}: ${formatWon(Math.round(m.price))} (${pct(rel(m.price, current))})`} />)}
            <span className="ab-mark is-mean ab-dot" style={{ left: x(rel(mean, current)) }} title={`평균: ${formatWon(Math.round(mean))} (${pct(rel(mean, current))})`} />
          </span>
          <span className="ab-dots-val fv-num">{formatWon(Math.round(mean))}<span className="fv-cap"> {pct(rel(mean, current))}</span></span>
        </div>;
      })}
    </div>
    <figcaption className="fv-cap">점 하나 = 모델 하나의 7일 뒤 예측(현재가 대비). 회색 띠 = 세 모델이 갈린 폭이에요. 띠가 넓을수록 모델끼리 의견이 달라요.{rows[0].f.targetDate && ` 예측 대상일 ${shortDate(rows[0].f.targetDate)}.`}</figcaption>
  </figure>;
}

/** 품목별 과거 검증: AI(세 모델 평균) 오차 vs 직전 가격 그대로 쓸 때 오차. 막대는 0부터. */
export function ItemPerformance({ items }: { items: AboutItem[] }) {
  const rows = items.filter(row => row.validation?.mape != null && row.validation.naiveMape != null);
  if (!rows.length) return <p className="fv-notice">품목별 과거 검증 결과를 불러오지 못했어요.</p>;
  const peak = Math.max(...rows.flatMap(r => [r.validation!.mape!, r.validation!.naiveMape!]));
  const period = rows[0].evaluationStart && rows[0].evaluationEnd ? `${yearMonth(rows[0].evaluationStart)}~${yearMonth(rows[0].evaluationEnd)}` : null;
  return <article className="fv-card ab-perf">
    <div className="ab-perf-legend fv-cap" aria-hidden="true"><span><i className="ab-sw is-ai" />AI(세 모델 평균)</span><span><i className="ab-sw is-naive" />직전 가격 그대로</span></div>
    <table className="ab-perf-table">
      <caption className="sr-only">품목별 과거 평균 오차: AI와 직전 가격 비교</caption>
      <thead><tr><th scope="col">품목</th><th scope="col">평균 오차 (짧을수록 정확)</th><th scope="col" className="num">덜 틀림</th><th scope="col" className="num">±5% 안</th></tr></thead>
      <tbody>{rows.map(row => {
        const v = row.validation!;
        const ai = row.explained;
        return <tr key={row.item.id}>
          <th scope="row">{row.item.name}{!ai && <span className="fv-badge tone-flat">직전 가격 사용</span>}</th>
          <td>
            <div className="ab-perf-bars">
              <span className="ab-perf-bar"><span className="ab-bar is-ai" style={{ width: `${(v.mape! / peak) * 100}%` }} /><span className="fv-num">{formatNumber(v.mape!, 2)}%</span></span>
              <span className="ab-perf-bar"><span className="ab-bar is-naive" style={{ width: `${(v.naiveMape! / peak) * 100}%` }} /><span className="fv-num">{formatNumber(v.naiveMape!, 2)}%</span></span>
            </div>
          </td>
          <td className="num fv-num">{v.improvementPct == null ? "-" : `${formatNumber(v.improvementPct, 1)}%`}</td>
          <td className="num fv-num">{v.within5Pct == null ? "-" : `${formatNumber(v.within5Pct, 0)}%`}</td>
        </tr>;
      })}</tbody>
    </table>
    <p className="fv-cap">{period ? `${period} ` : ""}매일 7일 뒤를 예측해 실제와 비교한 값이에요. ‘덜 틀림’ = 직전 가격보다 오차가 줄어든 비율, ‘±5% 안’ = 실제 가격이 예측의 ±5% 안에 든 날의 비율이에요.</p>
  </article>;
}

/** 모델 선정 과정: 단계마다 직전 가격보다 얼마나 덜 틀렸나(개선율, 0부터 그린 막대). */
export function ModelHistory() {
  const h = MODEL_HISTORY;
  const gain = (mape: number) => (h.naive - mape) / h.naive;
  const peak = Math.max(...h.steps.map(s => gain(s.mape)), ...h.singles.map(s => gain(s.mape)));
  return <div className="ab-history">
    <article className="fv-card ab-steps-card">
      <h3 className="ab-card-title">이렇게 골랐어요 <span className="fv-cap">기준: 직전 가격 그대로 오차 {formatNumber(h.naive, 3)}%</span></h3>
      <ol className="ab-steps">
        {h.steps.map(step => <li key={step.title} className={"current" in step && step.current ? "is-current" : undefined}>
          <span className="ab-step-date fv-num">{step.date}</span>
          <div className="ab-step-body">
            <p className="ab-step-title">{step.title}{"current" in step && step.current && <span className="fv-badge is-brand">지금</span>}</p>
            <div className="ab-step-bar"><span className="ab-bar is-ai" style={{ width: `${(gain(step.mape) / peak) * 100}%` }} /></div>
            <p className="fv-cap fv-num">오차 {formatNumber(step.mape, 3)}% · 직전 가격보다 {formatNumber(gain(step.mape) * 100, 1)}% 덜 틀림 · {step.note}</p>
          </div>
        </li>)}
      </ol>
    </article>
    <div className="ab-history-side">
      <article className="fv-card ab-singles">
        <h3 className="ab-card-title">혼자 쓸 때 vs 섞을 때</h3>
        <ul className="ab-singles-list">
          {h.singles.map(s => <li key={s.name} className={"current" in s && s.current ? "is-current" : undefined}>
            <span className="ab-singles-name">{s.name}</span>
            <span className="ab-bar-track"><span className="ab-bar is-ai" style={{ width: `${(gain(s.mape) / peak) * 100}%` }} /></span>
            <span className="fv-num ab-singles-val">{formatNumber(gain(s.mape) * 100, 1)}%</span>
          </li>)}
        </ul>
        <p className="fv-cap">막대 = 직전 가격보다 덜 틀린 비율. 어느 모델도 혼자서는 세 모델 평균보다 못했어요.</p>
      </article>
      <article className="fv-card ab-rejected">
        <h3 className="ab-card-title">써 봤지만 안 쓴 것</h3>
        <ul>{h.rejected.map(r => <li key={r.name}><b>{r.name}</b> <span className="fv-num fv-cap">{r.result}</span><p className="fv-cap">{r.why}</p></li>)}</ul>
      </article>
    </div>
    <p className="fv-cap ab-history-foot">{h.recordedAt} 기준 실험 기록({h.source}). 10개 가격 계열 × 검증 기준일 {h.origins}개 평균 오차예요.</p>
  </div>;
}
