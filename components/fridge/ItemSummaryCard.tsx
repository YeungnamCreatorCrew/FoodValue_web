import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatQuantity, remainingPercent, remainingRatio } from "@/lib/fridge/utils";
import type { FridgeItem } from "@/types/fridge";

interface ItemSummaryCardProps {
  item: FridgeItem;
}

/** 상세 화면 맨 위의 재료 요약 (사진, 이름, 남은 양, % 바) */
export function ItemSummaryCard({ item }: ItemSummaryCardProps) {
  return (
    <section className="flex shrink-0 items-center gap-3 rounded-[10px] border border-slate-200 bg-white p-3">
      <div className="relative flex size-[68px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt="" fill sizes="68px" className="object-cover" />
        ) : (
          <Icon name="image-off" size={28} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="truncate text-lg font-semibold leading-7 text-slate-900">{item.displayName}</p>
        <div className="flex justify-between">
          <span className="text-sm leading-6 text-slate-700">남은 양 {formatQuantity(item)}</span>
          <span className="text-xs font-medium leading-5 text-primary">{remainingPercent(item)}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={remainingPercent(item)}
          aria-label="남은 양"
          className="h-[7px] overflow-hidden rounded-full bg-slate-100"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${remainingRatio(item) * 100}%` }} />
        </div>
      </div>
    </section>
  );
}

export function ItemSummaryCardSkeleton() {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-[10px] border border-slate-200 bg-white p-3">
      <Skeleton className="size-[68px] shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-[7px] w-full rounded-full" />
      </div>
    </div>
  );
}
