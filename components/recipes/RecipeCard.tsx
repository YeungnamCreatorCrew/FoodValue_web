import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import type { RecipeSuggestion } from "@/types/recipes";

interface RecipeCardProps {
  recipe: RecipeSuggestion;
  href?: string; // 있으면 카드 전체가 링크가 된다
  bookmarked?: boolean; // 저장한 레시피이면 북마크 아이콘을 보여 준다
}

/** 레시피 카드: 사진 자리, 이름, 일치율, 시간·난이도·인분, 보유 현황, 부족 재료 (홈의 저장한 레시피, 추천 결과에서 같이 쓴다) */
export function RecipeCard({ recipe, href, bookmarked = false }: RecipeCardProps) {
  const { match } = recipe;
  const missingCount = match.totalCount - match.ownedCount;

  const content = (
    <>
      <div className="flex h-[124px] gap-2.5">
        <div className="flex h-[124px] w-[108px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-100">
          <Icon name="image-off" size={20} />
          <p className="text-[10px] leading-[14px] whitespace-nowrap text-slate-400">레시피 이미지</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <div className="flex items-start justify-between gap-1">
            <p className="min-w-0 flex-1 text-base font-bold leading-[21px] text-slate-900">{recipe.title}</p>
            {bookmarked && <Icon name="bookmark" size={20} className="shrink-0" />}
          </div>
          <p className="text-[11px] font-bold leading-4 whitespace-nowrap text-primary">
            일치 {match.matchRate}%
          </p>
          <p className="text-[11px] leading-[17px] text-slate-500">
            {recipe.minutes}분 · 난이도 {recipe.difficulty} · {recipe.servings}인분
          </p>
          <p className="text-[10px] leading-[15px] text-slate-600">{recipe.description}</p>
        </div>
      </div>

      <div className="flex h-[34px] items-center justify-between rounded-md bg-emerald-50 px-2.5 whitespace-nowrap">
        <p className="text-xs font-bold leading-[18px] text-primary">
          {match.totalCount}개 중 {match.ownedCount}개 보유
        </p>
        <p className="text-[10px] leading-[14px] text-emerald-700">
          {missingCount === 0 ? "바로 조리 가능" : `${missingCount}개 구매 필요`}
        </p>
      </div>

      {match.missingNames.length > 0 && (
        <div className="flex h-[30px] items-center justify-between gap-2 rounded-md bg-slate-50 px-2.5 text-[11px] leading-4">
          <p className="shrink-0 whitespace-nowrap text-slate-500">부족 재료</p>
          <p className="min-w-0 truncate font-bold text-slate-900">{match.missingNames.join(", ")}</p>
        </div>
      )}
    </>
  );

  const className = "flex shrink-0 flex-col gap-[7px] rounded-[10px] border border-slate-200 bg-white p-2.5";
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <article className={className}>{content}</article>
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="flex shrink-0 flex-col gap-[7px] rounded-[10px] border border-slate-200 bg-white p-2.5">
      <div className="flex h-[124px] gap-2.5">
        <Skeleton className="h-[124px] w-[108px] shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-[34px] w-full rounded-md" />
      <Skeleton className="h-[30px] w-full rounded-md" />
    </div>
  );
}
