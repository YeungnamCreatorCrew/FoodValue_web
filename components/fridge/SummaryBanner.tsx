import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface SummaryBannerProps {
  totalCount: number;
}

/** "냉장고에 재료 14개를 보관 중이에요" 요약 배너 */
export function SummaryBanner({ totalCount }: SummaryBannerProps) {
  return (
    <div className="flex h-[62px] shrink-0 items-center gap-2.5 rounded-[10px] bg-emerald-50 px-3">
      <Icon name="alert-triangle" size={22} className="shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-px text-xs font-medium leading-5">
        <p className="truncate text-primary">냉장고에 재료 {totalCount}개를 보관 중이에요</p>
        <p className="truncate text-slate-500">보관 중인 재료의 영양 균형을 확인해 보세요</p>
      </div>
      <Link
        href="/fridge/nutrition"
        className="shrink-0 whitespace-nowrap text-xs font-medium leading-5 text-primary"
      >
        영양 분석 보기 ›
      </Link>
    </div>
  );
}
