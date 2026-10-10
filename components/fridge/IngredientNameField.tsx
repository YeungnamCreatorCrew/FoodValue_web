"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { searchCatalog } from "@/lib/api/fridge";
import { CATEGORY_LABEL } from "@/lib/fridge/utils";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { CatalogItem } from "@/types/fridge";

interface IngredientNameFieldProps {
  value: string;
  error?: string | null;
  onChange: (name: string) => void; // 글자를 고치는 중 (연결된 품목은 풀린다)
  onSelect: (item: CatalogItem) => void; // 자동완성 목록에서 품목을 골랐다
}

const ROW = "flex h-10 w-full items-center gap-2 px-3 text-left";

/** 재료명 입력 + 품목 자동완성. 목록에 없어도 "직접 추가하기"로 이름 그대로 등록할 수 있다. */
export function IngredientNameField({ value, error, onChange, onSelect }: IngredientNameFieldProps) {
  const [open, setOpen] = useState(false);
  const typed = value.trim();
  const keyword = useDebouncedValue(typed, 250);
  const [result, setResult] = useState<{ key: string; items: CatalogItem[] } | null>(null);

  // 검색어가 멈추면 품목을 검색한다. 검색이 실패해도 "직접 추가하기"는 쓸 수 있게 빈 목록으로 처리한다.
  useEffect(() => {
    if (!keyword) return;
    let cancelled = false;
    searchCatalog(keyword)
      .then((items) => {
        if (!cancelled) setResult({ key: keyword, items });
      })
      .catch(() => {
        if (!cancelled) setResult({ key: keyword, items: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  const ready = result !== null && result.key === typed;
  const showDropdown = open && typed.length > 0;

  return (
    <div
      className="flex flex-col gap-1.5"
      onBlur={(event) => {
        // 이 영역 밖으로 포커스가 나가면 목록을 닫는다 (목록 안을 눌러서 옮겨 가는 건 제외)
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor="ingredient-name" className="text-base font-medium leading-6 text-slate-900">
        재료명
      </label>
      <div className="flex h-[42px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-primary">
        <Icon name="search" size={18} className="shrink-0" />
        <input
          id="ingredient-name"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="재료 이름을 입력해 주세요"
          autoComplete="off"
          aria-invalid={!!error}
          className="min-w-0 flex-1 bg-transparent text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      {showDropdown && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_4px_6px_rgba(0,0,0,0.09)]">
          {!ready ? (
            <p className={`${ROW} border-b border-slate-200 text-sm text-slate-500`}>검색 중...</p>
          ) : (
            result.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                className={`${ROW} border-b border-slate-200`}
              >
                <span className="min-w-0 flex-1 truncate text-sm leading-6 text-slate-700">
                  {item.name}
                </span>
                {item.category && (
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium leading-5 whitespace-nowrap text-slate-700">
                    {CATEGORY_LABEL[item.category]}
                  </span>
                )}
              </button>
            ))
          )}
          <button type="button" onClick={() => setOpen(false)} className={ROW}>
            <Icon name="plus" size={16} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-sm leading-6 text-primary">
              &apos;{typed}&apos; 직접 추가하기
            </span>
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs leading-5 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
