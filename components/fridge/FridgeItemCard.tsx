import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  STORAGE_LABEL,
  formatPurchaseDate,
  formatQuantity,
  remainingPercent,
  remainingRatio,
} from "@/lib/fridge/utils";
import type { FridgeItem } from "@/types/fridge";

const SECONDARY_BUTTON =
  "flex h-7 min-w-0 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium leading-5 whitespace-nowrap text-primary";

interface FridgeItemCardProps {
  item: FridgeItem;
  onUse: (item: FridgeItem) => void; // [사용 차감]
  onFinish: (item: FridgeItem) => void; // [다 먹음]
  highlighted?: boolean; // 방금 등록한 재료처럼 눈에 띄게 (초록 테두리)
}

// TODO: [레시피]는 레시피 재료 선택 화면(그 재료를 미리 체크)으로 가야 한다. 해당 화면이 생기면 연결한다.
export function FridgeItemCard({ item, onUse, onFinish, highlighted = false }: FridgeItemCardProps) {
  const ratio = remainingRatio(item);

  return (
    <article
      className={`flex shrink-0 flex-col gap-[7px] rounded-[10px] border bg-white p-2.5 ${
        highlighted ? "border-primary" : "border-slate-200"
      }`}
    >
      <Link href={`/fridge/${item.id}`} className="flex items-center gap-2.5">
        <div className="relative flex size-[46px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt="" fill sizes="46px" className="object-cover" />
          ) : (
            <Icon name="image-off" size={22} />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-base font-medium leading-6 text-slate-900">
            {item.displayName}
          </p>
          <p className="text-xs font-medium leading-5 text-slate-500">
            구입일 {formatPurchaseDate(item.purchasedAt)} · {STORAGE_LABEL[item.storage]}
          </p>
        </div>
      </Link>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs font-medium leading-5">
          <span className="text-slate-700">남은 양 {formatQuantity(item)}</span>
          <span className="text-primary">{remainingPercent(item)}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={remainingPercent(item)}
          aria-label="남은 양"
          className="h-[7px] overflow-hidden rounded-full bg-slate-100"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${ratio * 100}%` }} />
        </div>
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onUse(item)}
          className="flex h-7 min-w-0 flex-1 items-center justify-center rounded-lg border border-emerald-50 bg-emerald-50 px-3 text-xs font-medium leading-5 whitespace-nowrap text-primary"
        >
          사용 차감
        </button>
        <button type="button" onClick={() => onFinish(item)} className={SECONDARY_BUTTON}>
          다 먹음
        </button>
        <button type="button" className={SECONDARY_BUTTON}>
          레시피
        </button>
      </div>
    </article>
  );
}

/** 재료 카드 로딩용 틀 (카드와 같은 크기) */
export function FridgeItemCardSkeleton() {
  return (
    <div className="flex shrink-0 flex-col gap-[7px] rounded-[10px] border border-slate-200 bg-white p-2.5">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-[46px] shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-[7px] w-full rounded-full" />
      </div>
      <Skeleton className="h-7 w-full rounded-lg" />
    </div>
  );
}
