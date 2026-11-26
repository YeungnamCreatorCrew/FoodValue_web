import type { IndicatorSignal, IndicatorState } from "@/lib/prices/model";

/**
 * 홈과 상세가 함께 쓰는 지표 표현. 색 의미는 한 곳(app/styles/tokens.css 의 --fv-up·--fv-down·--fv-flat 토큰)에서 정한다:
 * 낮음·하락 = 파랑(tone-down), 높음·상승 = 빨강(tone-up), 보통·보합 = 회색(tone-flat). 방향은 서버 state를 그대로 쓴다.
 */
export function toneClass(state: IndicatorState | "flat" | null | undefined) {
  return state === "up" ? "tone-up" : state === "down" ? "tone-down" : "tone-flat";
}

// 수준 지표(1년 중 위치·평년 대비)는 ↓·↑, 흐름 신호(도매 흐름)는 추세선 ↘·↗, 보통·신호 없음은 —
const ICON_PATHS: Record<"down" | "up" | "fall" | "rise" | "flat", string[]> = {
  down: ["M12 5v14", "m19 12-7 7-7-7"],
  up: ["M12 19V5", "m5 12 7-7 7 7"],
  fall: ["m22 17-8.5-8.5-5 5L2 7", "M16 17h6v-6"],
  rise: ["m22 7-8.5 8.5-5-5L2 17", "M16 7h6v6"],
  flat: ["M5 12h14"],
};
const SIGNAL_KEYS = new Set(["WHOLESALE_LEAD"]);

function StateIcon({ signal }: { signal: IndicatorSignal }) {
  const trend = SIGNAL_KEYS.has(signal.key);
  const shape = signal.state === "down" ? (trend ? "fall" : "down") : signal.state === "up" ? (trend ? "rise" : "up") : "flat";
  return <svg className="ind-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICON_PATHS[shape].map(d => <path key={d} d={d} />)}
  </svg>;
}

/** 방향 아이콘 + 상태 문구("↓ 싼 편"). 색을 못 봐도 모양으로 방향이 읽힌다. */
export function StateText({ signal }: { signal: IndicatorSignal | null }) {
  if (!signal) return <span className="ind-state tone-flat">—</span>;
  return <span className={`ind-state ${toneClass(signal.state)}`}><StateIcon signal={signal} />{signal.stateLabel}</span>;
}

/**
 * 1년 중 위치 막대. 점은 '최근 1년 중 지금보다 싼 날의 비율'(percentile)에 둔다. 서버의 싼 편·비싼 편 판단과 같은 기준이라
 * 점 위치와 상태 글자가 어긋나지 않는다. 왼쪽 끝 = 1년 최저가, 오른쪽 끝 = 1년 최고가.
 */
export function PercentileBar({ percentile, lowLabel, highLabel, label, compact = false }: {
  percentile: number; lowLabel?: string; highLabel?: string; label: string; compact?: boolean;
}) {
  const left = `${Math.min(100, Math.max(0, percentile * 100))}%`;
  return <div className={compact ? "indicator-range is-compact" : "indicator-range"} role="img" aria-label={label}>
    <div className="range-track"><i className="range-zone" style={{ left: "25%" }} /><i className="range-zone" style={{ left: "75%" }} /><b className="range-dot" style={{ left }} /></div>
    {!compact && (lowLabel || highLabel) && <div className="range-labels"><span>{lowLabel}</span><span>{highLabel}</span></div>}
  </div>;
}
