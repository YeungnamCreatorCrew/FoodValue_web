"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { IndicatorSignal } from "@/lib/prices/model";
import { formatWon } from "@/lib/prices/format";
import { toneClass } from "@/components/prices/indicator-ui";

export interface PickerItem { id: string; name: string; category: string; price: number | null; signal: IndicatorSignal | null }

/**
 * 품목 고르기: 이름 검색 상자(콤보박스) + 분류 칩. 품목이 수백 개로 늘어도 쓸 수 있게 카드 격자 대신 검색으로 고른다.
 * 화면 위에 붙어 있어 아래 분석을 보는 동안에도 지금 품목과 다른 품목으로 가는 길이 보인다.
 */
export function ItemPicker({ items, selectedId }: { items: PickerItem[]; selectedId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId(), listId = useId();

  const categories = useMemo(() => [...new Set(items.map(item => item.category).filter(Boolean))], [items]);
  const selected = items.find(item => item.id === selectedId);
  const q = query.trim();
  const shown = items.filter(item => (!category || item.category === category) && (!q || item.name.includes(q)));
  const optionId = (id: string) => `${listId}-${id}`;

  function choose(item: PickerItem | undefined) {
    if (!item) return;
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    if (item.id !== selectedId) startTransition(() => router.push(`/analysis?item=${item.id}`, { scroll: false }));
  }
  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive(i => shown.length ? (i + step + shown.length) % shown.length : 0);
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      choose(shown[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }
  function pickCategory(next: string | null) {
    setCategory(next);
    setActive(0);
    setOpen(true);
    inputRef.current?.focus();
  }

  return <div className={`an-picker${pending ? " is-pending" : ""}`}>
    <div className="an-picker-row">
      <label htmlFor={inputId} className="an-picker-label">품목</label>
      <div className="an-combo">
        <svg className="an-combo-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input ref={inputRef} id={inputId} type="text" role="combobox" autoComplete="off"
          aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? optionId(shown[active].id) : undefined}
          placeholder={selected ? `${selected.name} · 다른 품목 찾기` : "품목 이름 찾기"}
          value={query} onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); }}
          onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKeyDown} />
        {open && <ul id={listId} role="listbox" aria-label="품목" className="an-combo-list">
          {shown.length ? shown.map((item, i) => <li key={item.id} id={optionId(item.id)} role="option" aria-selected={i === active}
            className={item.id === selectedId ? "is-current" : undefined}
            onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => choose(item)}>
            <span className={`an-chip-dot ${toneClass(item.signal?.state)}`} aria-hidden="true" />
            <b>{item.name}</b>
            {item.category && <span className="fv-cap">{item.category}</span>}
            <span className="an-combo-price fv-num">{formatWon(item.price)}</span>
            {item.signal && <span className="sr-only">평년 대비 {item.signal.stateLabel}</span>}
          </li>) : <li className="an-combo-empty" role="presentation">{q ? `‘${q}’에 맞는 품목이 없어요` : "이 분류에는 품목이 없어요"}</li>}
        </ul>}
      </div>
      <span className="an-picker-status fv-cap" aria-live="polite">{pending ? "불러오는 중…" : ""}</span>
    </div>
    {categories.length > 1 && <div className="an-cats" role="group" aria-label="분류로 좁히기">
      {[null, ...categories].map(c => <button key={c ?? "all"} type="button" className="an-cat" aria-pressed={category === c} onClick={() => pickCategory(c)}>{c ?? "전체"}</button>)}
    </div>}
  </div>;
}
