import type { FridgeSort } from "@/types/fridge";

// 백엔드 정렬 값에 맞춘 칩. (피그마의 "보관 위치순"은 서버에 없어서 "구입일순"으로 바꿨다 — 디자인 수정 필요)
const OPTIONS: { value: FridgeSort; label: string }[] = [
  { value: "newest", label: "최근 등록순" },
  { value: "purchased", label: "구입일순" },
  { value: "name", label: "이름순" },
];

interface SortChipsProps {
  value: FridgeSort;
  onChange: (value: FridgeSort) => void;
}

export function SortChips({ value, onChange }: SortChipsProps) {
  return (
    <div className="flex h-7 shrink-0 items-center gap-1.5">
      <span className="text-xs font-medium leading-5 text-slate-700">정렬</span>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`flex h-full items-center justify-center rounded-full border px-2.5 text-xs font-medium leading-5 whitespace-nowrap ${
              selected
                ? "border-primary bg-emerald-50 text-primary"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
