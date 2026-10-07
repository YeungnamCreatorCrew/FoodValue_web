interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/** 데이터를 불러오지 못했을 때의 안내 + [다시 시도] (피그마에 없는 화면이라 빈 상태와 같은 스타일로 만듦) */
export function ErrorState({
  title = "불러오지 못했어요",
  description = "잠시 후 다시 시도해 주세요.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="flex w-full flex-col items-center gap-3">
      <p className="text-center text-lg font-semibold leading-7 text-slate-900">{title}</p>
      <p className="w-[280px] max-w-full text-center text-sm leading-5 text-slate-500">
        {description}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-[34px] rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium leading-5 text-primary"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
