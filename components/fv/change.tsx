import { formatNumber } from "@/lib/prices/format";

/** 지난주 대비 같은 실제 가격 변화. 색 + 화살표 + 부호를 늘 같이 쓴다(색을 못 봐도 읽힘). 0과 값 없음은 회색. */
export function WeeklyChange({ value, label = "지난주 대비" }: { value: number | null; label?: string }) {
  if (value === null) return <span className="fv-change is-missing">정보 없음</span>;
  const tone = value > 0 ? "tone-up" : value < 0 ? "tone-down" : "tone-flat";
  const mark = value > 0 ? "↑" : value < 0 ? "↓" : "→";
  return <span className={`fv-change ${tone}`}>{label && <span className="sr-only">{label} </span>}<span aria-hidden="true">{mark}</span><span className="sr-only">{value > 0 ? "올라 " : value < 0 ? "내려 " : ""}</span>{formatNumber(Math.abs(value), 1)}%</span>;
}

/**
 * AI 예측 변화율. 예측은 참고라서 실제 변화(빨강·파랑)보다 한 단계 옅은 방향 색을 쓴다(사실·판단처럼 보이지 않게).
 * 색과 함께 화살표·부호를 늘 쓴다.
 */
export function ForecastChange({ value }: { value: number | null }) {
  if (value === null) return <span className="fv-change is-missing">정보 없음</span>;
  const mark = value > 0 ? "↑" : value < 0 ? "↓" : "→";
  const tone = value > 0 ? "ref-up" : value < 0 ? "ref-down" : "tone-ref";
  return <span className={`fv-change ${tone}`}><span aria-hidden="true">{mark}</span><span className="sr-only">{value > 0 ? "올라 " : value < 0 ? "내려 " : ""}</span>{formatNumber(Math.abs(value), 1)}%</span>;
}
