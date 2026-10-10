import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/** [직접 등록] [영수증으로 등록] */
export function RegisterButtons() {
  return (
    <div className="flex w-full shrink-0 gap-2">
      <Link
        href="/fridge/new"
        className="flex h-[34px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium leading-5 whitespace-nowrap text-primary"
      >
        <Icon name="plus" size={16} />
        직접 등록
      </Link>
      <Link
        href="/fridge/receipt"
        className="flex h-[34px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary px-3 text-xs font-medium leading-5 whitespace-nowrap text-primary-foreground hover:border-primary-hover hover:bg-primary-hover"
      >
        <Icon name="scan-line" size={16} />
        영수증으로 등록
      </Link>
    </div>
  );
}
