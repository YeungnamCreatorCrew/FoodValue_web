"use client";

import { useEffect, useState } from "react";
import { history90 } from "./history-batch";
import { won } from "@/lib/prices/format";

const DAY = 86_400_000;
const W = 120, H = 36;
/** 세로 폭의 최소값: 가격의 30%. 작은 등락이 큰 하락처럼 보이지 않게, 품목끼리 비슷한 눈금으로 그린다. */
const MIN_SPAN = 0.3;
/** 이 안의 변화(±1%)는 회색으로 둔다. */
const FLAT = 0.01;

type State = { id: string; points?: { date: string; price: number }[]; failed?: boolean };

/**
 * 홈 표의 '최근 8주' 작은 흐름선. 목록 응답에 이력이 없어 보이는 품목마다 90일 이력을 받아 최근 56일만 그린다.
 * 선은 회색, 끝점만 8주 동안의 변화 방향 색(1% 넘게 오르면 빨강, 내리면 파랑, 그 사이 회색). 표 한 줄에 진한 색이 몰리지 않게 한다.
 * 받기 전에도 같은 크기 칸을 잡아 화면이 튀지 않는다.
 * 가벼운 api 함수만 써서 홈 JS에 가격 변환 코드 전체가 딸려 오지 않게 한다.
 */
export function Sparkline({ id, name }: { id: string; name: string }) {
  const [state, setState] = useState<State | null>(null);
  useEffect(() => {
    let alive = true;
    history90(id).then(data => {
      const end = Date.parse(`${data.endDate}T00:00:00Z`);
      const points = data.points.filter((point): point is { date: string; price: number } => point.price !== null && Date.parse(`${point.date}T00:00:00Z`) > end - 56 * DAY);
      if (alive) setState({ id, points });
    }).catch(() => { if (alive) setState({ id, failed: true }); });
    return () => { alive = false; };
  }, [id]);
  const current = state?.id === id ? state : null;
  if (!current) return <span className="spark is-loading" aria-hidden="true" />;
  const points = current.points ?? [];
  if (current.failed || points.length < 2) return <span className="board-missing">정보 없음</span>;
  const prices = points.map(point => point.price);
  const low = Math.min(...prices), high = Math.max(...prices), mid = (low + high) / 2;
  const span = Math.max(high - low, mid * MIN_SPAN, 1);
  const floor = mid - span / 2;
  const x = (index: number) => 2 + index / (points.length - 1) * (W - 6);
  const y = (price: number) => H - 4 - (price - floor) / span * (H - 8);
  const path = points.map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point.price).toFixed(1)}`).join("");
  const first = points[0].price, last = points.at(-1)!.price;
  const change = (last - first) / first;
  const tone = change > FLAT ? "is-up" : change < -FLAT ? "is-down" : "is-flat";
  const word = tone === "is-up" ? "올랐어요" : tone === "is-down" ? "내렸어요" : "비슷해요";
  return <svg className={`spark ${tone}`} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`${name} 최근 8주 ${won(first)}에서 ${won(last)}으로 ${word}`}>
    <path d={path} fill="none" stroke="var(--fv-spark-line)" strokeWidth="1.8" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    <circle cx={x(points.length - 1)} cy={y(last)} r="3.5" fill="currentColor" />
  </svg>;
}
