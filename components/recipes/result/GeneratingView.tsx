import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { withMeansParticle } from "@/lib/fridge/utils";

interface GeneratingViewProps {
  count: number; // 고른 재료 개수
  names: string[] | null; // 고른 재료 이름 (아직 못 불러왔으면 null)
}

function SkeletonRecipeCard({ titleWidth }: { titleWidth: number }) {
  return (
    <div className="flex shrink-0 flex-col gap-2.5 rounded-[10px] border border-slate-200 bg-white p-3">
      <div className="flex h-[76px] items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
        <Icon name="image-off" size={20} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-[18px] animate-pulse rounded-full bg-slate-100" style={{ width: titleWidth }} />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-[72px] rounded-full bg-slate-100" />
          <Skeleton className="h-5 w-[72px] rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

/** AI 생성 중 화면: 진행 안내 카드 + 로딩 카드 3개 (RCP-01_맞춤레시피추천_AI생성중) */
export function GeneratingView({ count, names }: GeneratingViewProps) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="레시피를 만드는 중">
      <section className="flex shrink-0 flex-col gap-3 rounded-[10px] bg-emerald-50 p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white">
            <Icon name="utensils" size={20} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-base font-medium leading-6 text-primary">
              고른 재료 {count}개로 레시피를 만들고 있어요
            </p>
            {names && names.length > 0 && (
              <p className="text-xs font-medium leading-5 text-slate-500">
                {withMeansParticle(names.join(", "))} 만들 수 있는 레시피를 찾는 중
              </p>
            )}
          </div>
        </div>

        {/* 단계 표시는 안내용이다. 서버는 진행률을 알려 주지 않아서 "생성 중"에 머물러 있다. */}
        <ol className="flex flex-col gap-2">
          <li className="flex items-center gap-2 text-xs font-medium leading-5 text-primary">
            <Icon name="check" size={16} className="shrink-0" />
            고른 재료 확인 ✓
          </li>
          <li className="flex items-center gap-2 text-xs font-medium leading-5 text-primary">
            <span className="flex size-4 shrink-0 items-center justify-center rounded-lg bg-primary text-xs text-white">
              2
            </span>
            레시피 생성 중…
          </li>
          <li className="flex items-center gap-2 text-xs font-medium leading-5 text-slate-500">
            <span className="flex size-4 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
              3
            </span>
            영양·시세 정리
          </li>
        </ol>
      </section>

      <div className="flex flex-col gap-2">
        <SkeletonRecipeCard titleWidth={180} />
        <SkeletonRecipeCard titleWidth={160} />
        <SkeletonRecipeCard titleWidth={190} />
      </div>
    </div>
  );
}
