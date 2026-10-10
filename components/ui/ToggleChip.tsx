interface ToggleChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

/** 눌러서 켜고 끄는 알약 모양 칩 (예: 추천 조건 "20분 이내") */
export function ToggleChip({ label, selected, onClick }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium leading-5 whitespace-nowrap ${
        selected ? "border-primary bg-emerald-50 text-primary" : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}
