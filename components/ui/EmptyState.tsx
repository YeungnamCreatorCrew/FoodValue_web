import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  showIllustration?: boolean; // 회색 일러스트 자리 (피그마 빈 상태 기준)
  children?: ReactNode; // 아래에 놓을 버튼들
}

/** 보여 줄 내용이 없을 때의 안내 (예: 냉장고가 비어 있어요) */
export function EmptyState({
  title,
  description,
  showIllustration = true,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      {showIllustration && <div className="size-[120px] rounded-2xl bg-slate-100" aria-hidden />}
      <p className="text-center text-lg font-semibold leading-7 text-slate-900">{title}</p>
      {description && (
        <p className="w-[280px] max-w-full text-center text-sm leading-5 text-slate-500">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
