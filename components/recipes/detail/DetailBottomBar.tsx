import { Icon } from "@/components/ui/Icon";

interface DetailBottomBarProps {
  saved: boolean; // 저장한 레시피인가
  busy: boolean; // 저장·해제 처리 중
  onToggleSave: () => void;
  onShare: () => void;
  onComplete: () => void; // [요리 완료 (재료 자동 차감)]
}

/** 하단 고정 바: 북마크(저장), 공유, 요리 완료 */
export function DetailBottomBar({ saved, busy, onToggleSave, onShare, onComplete }: DetailBottomBarProps) {
  return (
    <div className="service-action-bar sticky z-10 flex h-[72px] shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
      <button
        type="button"
        onClick={onToggleSave}
        disabled={busy}
        aria-pressed={saved}
        aria-label={saved ? "저장 해제" : "레시피 저장"}
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg border disabled:opacity-50 ${
          saved ? "border-primary bg-emerald-50" : "border-slate-200 bg-white"
        }`}
      >
        <Icon name="bookmark" size={20} />
      </button>
      <button
        type="button"
        onClick={onShare}
        aria-label="공유"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white"
      >
        <Icon name="share" size={20} />
      </button>
      <button
        type="button"
        onClick={onComplete}
        className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover"
      >
        요리 완료 (재료 자동 차감)
      </button>
    </div>
  );
}
