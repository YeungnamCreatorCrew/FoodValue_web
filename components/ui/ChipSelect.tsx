interface ChipSelectProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

/** 알약 모양 선택지 (예: 냉장 / 냉동 / 실온). 선택된 칩은 연두색 바탕. */
export function ChipSelect<T extends string>({ value, options, onChange, ariaLabel }: ChipSelectProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex gap-1.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex h-[34px] items-center justify-center rounded-full px-3 text-xs font-medium leading-5 whitespace-nowrap ${
              selected
                ? "bg-emerald-50 text-primary"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
