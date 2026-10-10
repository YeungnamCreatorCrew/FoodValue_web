interface SegmentedControlProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

/** 여러 선택지 중 하나를 고르는 토글 (예: 냉장 / 냉동 / 실온) */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex h-[38px] gap-[3px] rounded-lg bg-slate-100 p-[3px]"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex h-full min-w-0 flex-1 items-center justify-center rounded-md text-sm leading-6 whitespace-nowrap ${
              selected ? "bg-white text-primary" : "text-slate-500"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
