interface SkeletonProps {
  className?: string; // 크기와 모양은 여기서 정한다 (예: "h-4 w-24")
}

/** 로딩 중에 보여 주는 회색 틀 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} aria-hidden />;
}
