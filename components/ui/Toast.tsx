interface ToastProps {
  message: string;
  actionLabel?: string; // 오른쪽 버튼 글자 (예: [실행 취소])
  onAction?: () => void;
  actionDisabled?: boolean;
}

/** 화면 아래(탭바 바로 위)에 잠깐 뜨는 안내. 언제 사라질지는 부르는 쪽에서 정한다. */
export function Toast({ message, actionLabel, onAction, actionDisabled = false }: ToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-40 mx-auto flex w-full max-w-[430px] px-4 md:max-w-[720px] lg:bottom-[88px] lg:left-[220px] lg:max-w-[960px]">
      <div
        role="status"
        className="pointer-events-auto flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-emerald-50 px-3 text-xs font-medium leading-5 text-primary"
      >
        <p className="min-w-0 flex-1 truncate">{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="shrink-0 whitespace-nowrap disabled:opacity-50"
          >
            [{actionLabel}]
          </button>
        )}
      </div>
    </div>
  );
}
