"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { completeCooking } from "@/lib/api/recipes";
import { fromMilli, toMilli } from "@/lib/fridge/decimal";
import type { CookingResult, RecipeIngredient } from "@/types/recipes";

interface CompleteCookingModalProps {
  ingredients: RecipeIngredient[];
  onClose: () => void;
  onDone: (result: CookingResult) => void;
}

interface Row {
  name: string;
  fridgeItemId: number;
  unit: string;
  remaining: string; // 지금 냉장고에 남은 양
  checked: boolean;
  amount: string; // 차감할 양 (사용자가 고칠 수 있다)
}

const DECIMAL_PATTERN = /^\d+(\.\d{1,3})?$/;

function rowError(row: Row): string | null {
  if (!row.checked) return null;
  if (!DECIMAL_PATTERN.test(row.amount) || toMilli(row.amount) <= 0) return "0보다 큰 숫자로 입력해 주세요";
  if (toMilli(row.amount) > toMilli(row.remaining)) return "남은 양보다 많아요";
  return null;
}

/** "요리를 완료했나요?" 시트: 차감할 재료를 확인하고 양을 고친 뒤 [차감하고 완료] */
export function CompleteCookingModal({ ingredients, onClose, onDone }: CompleteCookingModalProps) {
  const [rows, setRows] = useState<Row[]>(() =>
    ingredients
      .filter((i) => i.deduct)
      .map((i) => ({
        name: i.name,
        fridgeItemId: i.deduct!.fridgeItemId,
        unit: i.deduct!.unit,
        remaining: i.deduct!.remaining,
        checked: true,
        amount: i.deduct!.amount,
      })),
  );
  const missing = ingredients.filter((i) => !i.deduct);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkedRows = rows.filter((r) => r.checked);
  const hasInvalid = checkedRows.some((r) => rowError(r) !== null);
  const canSubmit = checkedRows.length > 0 && !hasInvalid && !busy;

  function updateRow(name: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.name === name ? { ...r, ...patch } : r)));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const result = await completeCooking(
        checkedRows.map((r) => ({ fridgeItemId: r.fridgeItemId, amount: r.amount })),
      );
      onDone(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "차감하지 못했어요. 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <Modal title="요리를 완료했나요?" onClose={onClose} closeDisabled={busy} gap="md">
      <p className="text-sm leading-5 text-slate-500">아래 재료를 냉장고에서 차감해요</p>

      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          const rowErr = rowError(row);
          const afterText = rowErr
            ? ""
            : `${Number(row.remaining)}${row.unit} → ${Number(fromMilli(toMilli(row.remaining) - (row.checked ? toMilli(row.amount) : 0)))}${row.unit}`;
          return (
            <div key={row.name} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={row.checked}
                  aria-label={`${row.name} 차감`}
                  disabled={busy}
                  onClick={() => updateRow(row.name, { checked: !row.checked })}
                  className="flex size-[18px] shrink-0 items-center justify-center"
                >
                  <span
                    className={`size-[14px] rounded-[2px] border ${
                      row.checked ? "border-primary bg-primary" : "border-slate-300 bg-white"
                    }`}
                  />
                </button>
                <span
                  className={`w-[72px] shrink-0 truncate text-sm font-medium leading-6 ${
                    row.checked ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {row.name}
                </span>
                <input
                  inputMode="decimal"
                  aria-label={`${row.name} 차감량`}
                  value={row.amount}
                  disabled={!row.checked || busy}
                  onChange={(event) => updateRow(row.name, { amount: event.target.value.trim() })}
                  aria-invalid={!!rowErr}
                  className="h-8 w-16 shrink-0 rounded-md border border-slate-200 bg-white px-2 text-right text-sm leading-6 text-slate-900 outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-400"
                />
                <span className="shrink-0 text-xs font-medium leading-5 text-slate-500">{row.unit}</span>
                <span className="min-w-0 flex-1 truncate text-right text-xs leading-5 text-slate-500">
                  {row.checked ? afterText : ""}
                </span>
              </div>
              {rowErr && (
                <p role="alert" className="pl-[26px] text-xs leading-5 text-red-600">
                  {rowErr}
                </p>
              )}
            </div>
          );
        })}
        {missing.map((ingredient) => (
          <div key={ingredient.name} className="flex items-center gap-2 opacity-70">
            <span className="size-[14px] shrink-0 rounded-[2px] border border-slate-200 bg-slate-50" />
            <span className="text-sm font-medium leading-6 text-slate-400">
              {ingredient.name} · 냉장고에 없음
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs font-medium leading-5 text-slate-500">실제로 쓴 양이 다르면 숫자를 눌러 고칠 수 있어요</p>

      {error && (
        <p role="alert" className="text-xs leading-5 text-red-600">
          {error}
        </p>
      )}

      <div className="flex h-10 gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium leading-6 whitespace-nowrap text-slate-900 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? "차감 중..." : "차감하고 완료"}
        </button>
      </div>
    </Modal>
  );
}
