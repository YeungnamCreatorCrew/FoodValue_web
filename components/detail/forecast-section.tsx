"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { LivePrice } from "@/lib/prices/model";
import type { ValidationDto } from "@/lib/prices/dto";
import { formatNumber, shortDate, won } from "@/lib/prices/format";
import { usePriceFactors } from "@/lib/prices/use-prices";
import { ForecastChange } from "@/components/fv/change";
import { LoadingRegion, Notice, Skeleton } from "@/components/fv/state";
import { toHaeyo } from "@/components/fv/haeyo";
import { Modal } from "@/components/common/modal";

/** 예측 요인 표는 팝업을 열 때 받는다(첫 화면 JS를 줄인다). */
const ShapFactorView = dynamic(() => import("@/components/prices/shap-factors").then(module => module.ShapFactorView), {
  loading: () => <LoadingRegion label="예측 요인을 불러오는 중이에요"><Skeleton className="shap-skel" /></LoadingRegion>,
});

function noForecastReason(item: LivePrice) {
  if (item.status === "NO_DATA") return "최근 조사된 가격이 없어 예측할 수 없어요.";
  if (item.forecastStatus === "INSUFFICIENT_DATA") return "가격 기록이 부족해 예측을 만들지 못했어요.";
  return "이번 기준일에는 이 품목의 예측이 만들어지지 않았어요.";
}

/** 과거 검증 실적 한 줄. 평균 오차는 위 숫자 카드에 있으니 "얼마나 나았는지"만 말한다. */
function ValidationLine({ validation }: { validation: ValidationDto }) {
  const parts = [
    validation.improvementPct != null && validation.improvementPct > 0 ? `직전 가격만 쓸 때보다 오차가 ${formatNumber(validation.improvementPct, 1)}% 적었어요` : null,
    validation.within5Pct != null ? `실제 가격이 예측의 ±5% 안에 든 날은 ${formatNumber(validation.within5Pct, 0)}%예요` : null,
  ].filter(Boolean);
  if (!parts.length) return null;
  const range = validation.evaluationStart && validation.evaluationEnd ? `${monthLabel(validation.evaluationStart)}~${monthLabel(validation.evaluationEnd)} 검증` : "과거 검증";
  return <p className="forecast-validation"><b>{range}</b> {parts.join(". ")}.</p>;
}
const monthLabel = (date: string) => `${date.slice(2, 4)}.${date.slice(5, 7)}`;

/** 팝업 안: 숫자 3개 → 서버 요약 한 문장 → 예측 요인 표. */
function ForecastDetail({ item }: { item: LivePrice }) {
  const last = item.forecastPoints.at(-1);
  const factors = usePriceFactors(item.id);
  const validation = factors.data?.validation ?? null;
  // v2는 검증 실적의 평균 오차를 쓰고, 예전 모델은 가이드의 값을 쓴다.
  const mape = validation?.mape ?? item.guide?.mape ?? null;
  return <>
    <p className="fv-cap">모델이 계산한 값이라 틀릴 수 있어요. 판단(싼 편·비싼 편)에는 쓰지 않아요.</p>
    <dl className="forecast-figures">
      <div><dt>{shortDate(item.forecastDate)} 예상 가격{passed(item.forecastDate) && " (지난 날짜)"}</dt><dd><strong className="fv-num tone-ref">{won(item.forecastPrice)}</strong><ForecastChange value={item.forecastPercent} /></dd></div>
      {last?.lower != null && last.upper != null && <div><dt>예상 범위</dt><dd><strong className="fv-num tone-ref">{won(last.lower)} ~ {won(last.upper)}</strong></dd></div>}
      <div><dt>과거 평균 오차</dt><dd><strong className="fv-num tone-ref">{mape != null ? `${formatNumber(mape, 1)}%` : "정보 없음"}</strong></dd></div>
    </dl>
    {validation && <ValidationLine validation={validation} />}
    {/* 숫자 카드와 같은 말을 되풀이하지 않게, 서버 요약은 "무엇이 크게 작용했는지"(detail)만 보여준다. */}
    {item.aiSummary?.detail && <p className="forecast-summary">{toHaeyo(item.aiSummary.detail)}</p>}
    <ShapFactorView item={item} {...factors} />
  </>;
}

/** 예측 대상일이 서울 기준 오늘보다 앞이면 true. 가격이 늦게 들어오면 WAS 예측일도 지난 날짜일 수 있다. */
function passed(date: string | null | undefined) {
  if (!date) return false;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  return date < today;
}

/**
 * 상세 본문에는 한 줄 요약만 둔다. 자세한 숫자와 예측 요인은 팝업으로 연다(상세가 길어지지 않게).
 * 직전 가격을 쓰는 품목(BASELINE)은 'AI 예측'이 아니므로 제목·문장을 따로 쓰고 팝업을 열지 않는다.
 */
export function ForecastSection({ item }: { item: LivePrice }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const baseline = item.status === "BASELINE" || item.quality === "BASELINE";

  if (item.forecastPrice === null) return <section className="forecast-line" aria-labelledby="forecast-title">
    <h2 id="forecast-title" className="forecast-title">7일 뒤 가격<span className="fv-badge tone-ref">참고</span></h2>
    <p className="forecast-text">{noForecastReason(item)}</p>
  </section>;

  if (baseline) return <section className="forecast-line" aria-labelledby="forecast-title">
    <h2 id="forecast-title" className="forecast-title">7일 뒤 값<span className="fv-badge tone-ref">직전 가격 · 참고</span></h2>
    <p className="forecast-text"><strong className="fv-num">{won(item.forecastPrice)}</strong></p>
    {/* 서버 문장은 끝맺음만 해요체로 바꿔 그대로 보여준다. 없을 때만 우리 문장을 쓴다. */}
    <Notice>{item.aiSummary ? toHaeyo(item.aiSummary.headline) : "과거 검증에서 AI 모델이 직전 가격보다 덜 정확해서 직전 가격을 그대로 둬요."}</Notice>
  </section>;

  return <section className="forecast-line" aria-labelledby="forecast-title">
    <h2 id="forecast-title" className="forecast-title">AI 7일 예측<span className="fv-badge tone-ref">참고</span></h2>
    <p className="forecast-text">{shortDate(item.forecastDate)} 예상 <strong className="fv-num tone-ref">{won(item.forecastPrice)}</strong> <ForecastChange value={item.forecastPercent} />{passed(item.forecastDate) && <span className="forecast-past"> · 이미 지난 날짜예요</span>}</p>
    <button ref={button} type="button" className="fv-btn is-quiet forecast-open" aria-haspopup="dialog" onClick={() => setOpen(true)}>예측 자세히 보기</button>
    {open && <Modal titleId="forecast-modal-title" title={`${item.name} AI 7일 예측`} badge={<span className="fv-badge tone-ref">참고</span>} onClose={close} returnTo={button}>
      <ForecastDetail item={item} />
    </Modal>}
  </section>;
}
