import { SORT_OPTIONS, type RecipeSort } from "@/lib/recipes/sort";

interface SortTabsProps {
  value: RecipeSort;
  onChange: (value: RecipeSort) => void;
}

/** 재료 일치율순 / 조리 시간순 / 보유 재료 많은순 */
export function SortTabs({ value, onChange }: SortTabsProps) {
  return (
    <div role="tablist" aria-label="정렬" className="flex h-[30px] shrink-0 gap-1 overflow-hidden rounded-lg bg-slate-100">
      {SORT_OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`flex h-full min-w-0 flex-1 items-center justify-center rounded-lg text-[10px] leading-[14px] whitespace-nowrap ${
              selected ? "bg-primary font-semibold text-primary-foreground" : "text-slate-500"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
