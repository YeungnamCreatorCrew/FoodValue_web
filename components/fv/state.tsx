import type { ReactNode } from "react";
import { friendlyError } from "./text";

/** 세 화면이 같은 모양으로 쓰는 상태 화면(오류 · 비어 있음 · 안내 · 뼈대). */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="fv-state">
    <strong>불러오기 오류</strong>
    <p>{friendlyError(message)}</p>
    {onRetry && <button type="button" className="fv-btn" onClick={onRetry}>다시 시도</button>}
  </div>;
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="fv-state"><strong>{title}</strong>{children && <p>{children}</p>}{action}</div>;
}

/** 데이터 상태 안내 한 줄(이전 기준일, 직전 가격 유지 등). */
export function Notice({ children, icon = "info" }: { children: ReactNode; icon?: "info" | "clock" }) {
  return <p className={`fv-notice is-${icon}`}>{children}</p>;
}

/** 최종 화면과 같은 자리를 잡는 회색 뼈대. 크기는 부르는 쪽이 class로 정한다. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`fv-skel ${className}`} />;
}

export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return <div role="status" aria-busy="true"><span className="sr-only">{label}</span>{children}</div>;
}
