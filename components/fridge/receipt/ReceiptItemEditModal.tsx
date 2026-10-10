"use client";

import { useState } from "react";
import { ChipSelect } from "@/components/ui/ChipSelect";
import { DatePickerModal } from "@/components/ui/DatePickerModal";
import { Modal } from "@/components/ui/Modal";
import { addDays, formatDotted, todayString } from "@/lib/date";
import { fromMilli, toMilli } from "@/lib/fridge/decimal";
import { rowError, type ReceiptRow } from "@/lib/fridge/receipt";
import { isCountUnit, stepOf } from "@/lib/fridge/units";
import { UNITS, type FoodType, type StorageType, type Unit } from "@/types/fridge";

const STORAGE_OPTIONS: { value: StorageType; label: string }[] = [
  { value: "FRIDGE", label: "냉장" },
  { value: "FREEZER", label: "냉동" },
  { value: "ROOM", label: "실온" },
];
const FOOD_TYPE_OPTIONS: { value: FoodType; label: string }[] = [
  { value: "RAW", label: "원물" },
  { value: "PROCESSED", label: "가공품" },
];

const LABEL = "text-xs font-medium leading-5 whitespace-nowrap text-slate-700";
const STEP_BUTTON =
  "flex size-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl font-semibold leading-7 tracking-[-0.1px] text-slate-700 disabled:opacity-40";

interface ReceiptItemEditModalProps {
  row: ReceiptRow;
  onSave: (row: ReceiptRow) => void;
  onExclude: () => void; // [이 항목 빼기]
  onClose: () => void;
}

/** "인식 결과 수정" 창: 이름, 수량+단위, 보관 위치(+ 백엔드에 맞춰 재료 종류, 구입일, 무게) */
export function ReceiptItemEditModal({ row, onSave, onExclude, onClose }: ReceiptItemEditModalProps) {
  const [draft, setDraft] = useState<ReceiptRow>(row);
  const [dateOpen, setDateOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const error = rowError(draft);
  const step = Math.round(stepOf(draft.unit ?? "개") * 1000);
  const quantityMilli = /^\d+(\.\d{1,3})?$/.test(draft.quantity) ? toMilli(draft.quantity) : null;
  const today = todayString();

  function update(patch: Partial<ReceiptRow>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleSave() {
    setAttempted(true);
    if (error) return;
    onSave({ ...draft, displayName: draft.displayName.trim(), selected: true });
  }

  return (
    <>
      <Modal title="인식 결과 수정" onClose={onClose} closeDisabled={dateOpen} gap="lg">
        <div className="flex h-11 items-center rounded-lg bg-slate-50 px-3">
          <p className="min-w-0 flex-1 truncate text-base font-medium leading-6 text-slate-700">
            {row.originalName}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="receipt-item-name" className={LABEL}>
            재료명
          </label>
          <input
            id="receipt-item-name"
            value={draft.displayName}
            onChange={(event) => update({ displayName: event.target.value })}
            className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className={LABEL}>수량 + 단위</p>
          <div className="flex h-11 items-center gap-2">
            <button
              type="button"
              aria-label="수량 줄이기"
              disabled={quantityMilli === null || quantityMilli <= step}
              onClick={() => update({ quantity: fromMilli((quantityMilli ?? step) - step) })}
              className={STEP_BUTTON}
            >
              -
            </button>
            <input
              inputMode="decimal"
              aria-label="수량"
              value={draft.quantity}
              onChange={(event) => update({ quantity: event.target.value.trim() })}
              className="h-11 min-w-0 flex-1 rounded-lg border border-transparent bg-slate-50 text-center text-base font-medium leading-6 text-primary outline-none focus:border-primary"
            />
            <button
              type="button"
              aria-label="수량 늘리기"
              onClick={() => update({ quantity: fromMilli((quantityMilli ?? 0) + step) })}
              className={STEP_BUTTON}
            >
              +
            </button>
            <select
              aria-label="단위"
              value={draft.unit ?? ""}
              onChange={(event) => update({ unit: (event.target.value || null) as Unit | null })}
              className={`h-11 w-[72px] shrink-0 rounded-lg border bg-white px-2 text-sm font-medium leading-6 text-slate-700 outline-none focus:border-primary ${
                draft.unit === null ? "border-red-300" : "border-slate-200"
              }`}
            >
              <option value="">선택</option>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className={LABEL}>보관 위치</p>
          <ChipSelect
            ariaLabel="보관 위치"
            value={draft.storage}
            options={STORAGE_OPTIONS}
            onChange={(storage) => update({ storage })}
          />
        </div>

        {/* 아래 세 칸은 백엔드 필드에 맞춰 추가한 입력 — 피그마 디자인에는 없다 */}
        <div className="flex flex-col gap-2">
          <p className={LABEL}>재료 종류</p>
          <ChipSelect
            ariaLabel="재료 종류"
            value={draft.foodType}
            options={FOOD_TYPE_OPTIONS}
            onChange={(foodType) => update({ foodType })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className={LABEL}>구입일</p>
          <button
            type="button"
            onClick={() => setDateOpen(true)}
            className="flex h-11 w-full items-center rounded-md border border-slate-300 bg-white px-3 text-left text-base leading-6 text-slate-900"
          >
            {formatDotted(draft.purchasedAt)}
          </button>
        </div>

        {draft.unit !== null && isCountUnit(draft.unit) && (
          <div className="flex flex-col gap-2">
            <label htmlFor="receipt-item-grams" className={LABEL}>
              1{draft.unit}당 무게 (g) · 선택
            </label>
            <input
              id="receipt-item-grams"
              inputMode="decimal"
              value={draft.gramsPerUnit}
              onChange={(event) => update({ gramsPerUnit: event.target.value.trim() })}
              placeholder="예: 300 (모르면 비워 두세요)"
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary"
            />
          </div>
        )}

        {attempted && error && (
          <p role="alert" className="text-xs leading-5 text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExclude}
            className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium leading-6 whitespace-nowrap text-slate-700"
          >
            이 항목 빼기
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover"
          >
            저장
          </button>
        </div>
      </Modal>

      {dateOpen && (
        <DatePickerModal
          title="구입일 선택"
          description="재료를 산 날짜를 골라주세요"
          value={draft.purchasedAt}
          maxDate={today}
          quickPicks={[
            { label: "오늘", date: today },
            { label: "어제", date: addDays(today, -1) },
            { label: "3일 전", date: addDays(today, -3) },
          ]}
          onConfirm={(date) => {
            update({ purchasedAt: date });
            setDateOpen(false);
          }}
          onClose={() => setDateOpen(false)}
        />
      )}
    </>
  );
}
