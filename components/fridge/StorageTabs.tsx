import type { FridgeSummary, StorageType } from "@/types/fridge";

interface StorageTabsProps {
  value: StorageType | undefined; // undefined = 전체
  counts: FridgeSummary["counts"] | null; // 아직 못 불러왔으면 null (개수 없이 표시)
  onChange: (value: StorageType | undefined) => void;
}

/** 전체 / 냉장 / 냉동 / 실온 탭 (개수 표시) */
export function StorageTabs({ value, counts, onChange }: StorageTabsProps) {
  const total = counts ? counts.FRIDGE + counts.FREEZER + counts.ROOM : null;
  const tabs: { value: StorageType | undefined; label: string; count: number | null }[] = [
    { value: undefined, label: "전체", count: total },
    { value: "FRIDGE", label: "냉장", count: counts?.FRIDGE ?? null },
    { value: "FREEZER", label: "냉동", count: counts?.FREEZER ?? null },
    { value: "ROOM", label: "실온", count: counts?.ROOM ?? null },
  ];

  return (
    <div role="tablist" className="flex h-[30px] shrink-0 gap-1">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`flex h-full min-w-0 flex-1 items-center justify-center rounded-full border text-xs font-medium leading-5 whitespace-nowrap ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {tab.count === null ? tab.label : `${tab.label} ${tab.count}`}
          </button>
        );
      })}
    </div>
  );
}
