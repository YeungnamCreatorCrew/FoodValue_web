import { Skeleton } from "@/components/ui/Skeleton";

interface DetailLoadingProps {
  title: string | null; // 만드는 메뉴 이름 (저장한 레시피를 열 때는 아직 모른다)
}

/**
 * 레시피 상세를 만드는 동안의 로딩 화면.
 * 메뉴를 고른 뒤 상세를 만드는 LLM 호출이 몇 초 걸려서 필요하다 (피그마에는 이 화면이 없어서 직접 만들었다).
 */
export function DetailLoading({ title }: DetailLoadingProps) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="레시피를 만드는 중">
      <div className="flex shrink-0 flex-col gap-0.5 rounded-[10px] bg-emerald-50 px-3 py-2.5">
        <p className="text-sm font-medium leading-6 text-primary">
          {title ? `'${title}' 레시피를 자세히 만들고 있어요` : "레시피를 불러오고 있어요"}
        </p>
        <p className="text-xs leading-5 text-slate-500">재료 매칭과 영양 정보, 조리 단계를 정리하는 중이에요</p>
      </div>
      <div className="flex gap-2.5">
        <Skeleton className="h-[120px] w-[126px] shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <Skeleton className="h-[84px] rounded-[10px]" />
      <Skeleton className="h-[214px] rounded-[10px]" />
      <Skeleton className="h-[104px] rounded-[10px]" />
    </div>
  );
}
