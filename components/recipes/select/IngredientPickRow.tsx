import { formatQuantity } from "@/lib/fridge/utils";
import type { FridgeItem } from "@/types/fridge";

interface IngredientPickRowProps {
  item: FridgeItem;
  selected: boolean;
  onToggle: () => void;
}

/** 레시피에 쓸 재료를 고르는 한 줄: [체크] 이름 ........ 남은 양 */
export function IngredientPickRow({ item, selected, onToggle }: IngredientPickRowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={`flex shrink-0 items-center gap-2 rounded-[10px] border bg-white p-3 text-left ${
        selected ? "border-primary ring-1 ring-primary" : "border-slate-200"
      }`}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={`size-[14px] shrink-0 rounded-[2px] border ${
            selected ? "border-primary bg-primary" : "border-slate-200 bg-white"
          }`}
        />
        <span className="min-w-0 truncate text-sm font-medium leading-6 text-slate-900">
          {item.displayName}
        </span>
      </span>
      <span className="shrink-0 text-xs font-medium leading-5 whitespace-nowrap text-slate-500">
        {formatQuantity(item)}
      </span>
    </button>
  );
}
