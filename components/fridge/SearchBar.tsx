import { Icon } from "@/components/ui/Icon";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-primary">
      <Icon name="search" size={18} className="shrink-0" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="보관 중인 재료 검색"
        aria-label="보관 중인 재료 검색"
        className="min-w-0 flex-1 bg-transparent text-xs font-medium leading-5 text-slate-900 outline-none placeholder:text-slate-500"
      />
    </label>
  );
}
