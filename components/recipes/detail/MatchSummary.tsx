import type { RecipeMatch } from "@/types/recipes";

interface MatchSummaryProps {
  match: RecipeMatch;
}

/** 냉장고 일치 요약: "냉장고 재료 80% 일치", 보유 현황 막대, 원형 % 표시 */
export function MatchSummary({ match }: MatchSummaryProps) {
  return (
    <section className="flex h-[84px] shrink-0 items-center gap-2.5 rounded-[10px] border border-slate-200 bg-white p-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-bold leading-5 whitespace-nowrap text-slate-900">
          냉장고 재료 {match.matchRate}% 일치
        </p>
        <p className="text-[11px] leading-4 whitespace-nowrap text-slate-500">
          필요 재료 {match.totalCount}개 중 {match.ownedCount}개 보유 중
        </p>
        <div
          role="progressbar"
          aria-label="냉장고 재료 일치율"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={match.matchRate}
          className="h-2 overflow-hidden rounded-full bg-slate-100"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${match.matchRate}%` }} />
        </div>
      </div>
      <div className="flex size-[58px] shrink-0 items-center justify-center rounded-full border-[5px] border-primary bg-emerald-50">
        <span className="text-sm font-bold leading-5 text-primary">{match.matchRate}%</span>
      </div>
    </section>
  );
}
