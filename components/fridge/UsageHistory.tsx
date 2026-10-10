import { Skeleton } from "@/components/ui/Skeleton";
import { USAGE_REASON_LABEL, formatShortDate } from "@/lib/fridge/utils";
import type { ItemUsage, Unit } from "@/types/fridge";

interface UsageHistoryProps {
  usages: ItemUsage[] | null; // null이면 불러오는 중
  failed: boolean;
  unit: Unit; // 사용 기록의 수량은 재료와 같은 단위
  total: number;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}

/** "사용 기록" 목록: 9/28  100g 사용. (사용 메모는 백엔드에 없어서 표시하지 않는다) */
export function UsageHistory({
  usages,
  failed,
  unit,
  total,
  loadingMore,
  onLoadMore,
  onRetry,
}: UsageHistoryProps) {
  return (
    <section className="flex shrink-0 flex-col gap-1.5">
      <h2 className="text-base font-medium leading-6 text-slate-900">사용 기록</h2>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {failed ? (
          <div className="flex h-10 items-center justify-between px-3 text-sm text-slate-500">
            <span>사용 기록을 불러오지 못했어요</span>
            <button type="button" onClick={onRetry} className="font-medium text-primary">
              다시 시도
            </button>
          </div>
        ) : usages === null ? (
          <div className="flex flex-col gap-2 p-3" aria-busy="true" aria-label="사용 기록을 불러오는 중">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : usages.length === 0 ? (
          <p className="flex h-10 items-center px-3 text-sm text-slate-500">아직 사용 기록이 없어요</p>
        ) : (
          <ul>
            {usages.map((usage, index) => (
              <li
                key={usage.id}
                className={`flex h-10 items-center gap-2.5 px-3 ${
                  index < usages.length - 1 ? "border-b border-slate-200" : ""
                }`}
              >
                <span className="shrink-0 text-xs font-medium leading-5 whitespace-nowrap text-slate-500">
                  {formatShortDate(usage.usedAt)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm leading-6 text-slate-900">
                  {Number(usage.amount)}
                  {unit} {USAGE_REASON_LABEL[usage.reason]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {usages && usages.length < total && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="h-[34px] w-full rounded-lg border border-slate-200 bg-white text-xs font-medium leading-5 text-primary disabled:opacity-50"
        >
          {loadingMore ? "불러오는 중..." : "기록 더 보기"}
        </button>
      )}
    </section>
  );
}
