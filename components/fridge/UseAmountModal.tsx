"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { consumeFridgeItem } from "@/lib/api/fridge";
import { fromMilli, toMilli } from "@/lib/fridge/decimal";
import { formatQuantity } from "@/lib/fridge/utils";
import type { FridgeItem, Unit } from "@/types/fridge";

// [확인 필요] - / + 버튼이 한 번에 바꾸는 양. 피그마에 값이 없어서 단위별로 임시로 정했다.
function stepOf(unit: Unit): number {
  switch (unit) {
    case "g":
    case "ml":
      return 10;
    case "kg":
    case "L":
      return 0.1;
    case "단":
    case "모":
    case "송이":
      return 0.5;
    default:
      return 1; // 개, 팩, 봉, 구
  }
}

const STEP_BUTTON =
  "flex size-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl font-semibold leading-7 tracking-[-0.1px] text-slate-700 disabled:opacity-40";
const QUICK_CHIP =
  "flex h-7 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-medium leading-5 whitespace-nowrap text-slate-700";

interface UseAmountModalProps {
  item: FridgeItem;
  onClose: () => void;
  onDone: (updated: FridgeItem) => void; // 차감한 뒤의 재료
}

/**
 * "대파 사용량 입력" 창. 사용량을 정하고 [차감하기]를 누르면 USE(부분 사용)로 처리한다.
 * 사용 메모는 백엔드 API(consume)에 필드가 없어서 뺐다 (피그마 디자인 수정 필요).
 */
export function UseAmountModal({ item, onClose, onDone }: UseAmountModalProps) {
  const remaining = toMilli(item.quantity);
  const initial = toMilli(item.initialQuantity);
  const step = Math.round(stepOf(item.unit) * 1000);

  // 입력값은 글자 그대로 들고 있다가(직접 타자 칠 수 있게), 계산할 때만 숫자로 바꾼다
  const [value, setValue] = useState(() => fromMilli(Math.min(step, remaining)));
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isFormatOk = /^\d+(\.\d{1,3})?$/.test(value);
  const amount = isFormatOk ? toMilli(value) : null;
  let validationMessage: string | null = null;
  if (value === "") validationMessage = "사용량을 입력해 주세요";
  else if (amount === null) validationMessage = "숫자(소수 3자리까지)로 입력해 주세요";
  else if (amount <= 0) validationMessage = "0보다 크게 입력해 주세요";
  else if (amount > remaining) validationMessage = "남은 양보다 많이 쓸 수 없어요";
  const isValid = validationMessage === null && amount !== null;

  // 사용 후 남은 양 (입력이 올바르지 않으면 지금 남은 양 그대로 보여 준다)
  const afterRemaining = isValid ? remaining - amount : remaining;
  const afterRatio = initial > 0 ? Math.min(Math.max(afterRemaining / initial, 0), 1) : 0;
  const afterPercent = Math.floor(afterRatio * 100 + 1e-9);

  function setAmount(milli: number) {
    setValue(fromMilli(milli));
    setSubmitError(null);
  }

  async function handleSubmit() {
    if (!isValid || amount === null) return;
    setBusy(true);
    setSubmitError(null);
    try {
      const updated = await consumeFridgeItem(item.id, { reason: "USE", amount: fromMilli(amount) });
      onDone(updated);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "차감하지 못했어요. 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <Modal title={`${item.displayName} 사용량 입력`} onClose={onClose} closeDisabled={busy} gap="lg">
      <div className="flex h-[22px] items-center gap-2 text-xs font-medium leading-5">
        <span className="text-slate-700">남은 양</span>
        <span className="text-primary">{formatQuantity(item)}</span>
      </div>

      <div className="flex h-11 items-center gap-2">
        <button
          type="button"
          aria-label="사용량 줄이기"
          disabled={busy || (amount ?? 0) <= step}
          onClick={() => setAmount((amount ?? step) - step)}
          className={STEP_BUTTON}
        >
          -
        </button>
        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => {
            setValue(event.target.value.trim());
            setSubmitError(null);
          }}
          aria-label="사용량"
          aria-invalid={!isValid}
          disabled={busy}
          className="h-11 min-w-0 flex-1 rounded-lg border border-transparent bg-slate-50 text-center text-base font-medium leading-6 text-primary outline-none focus:border-primary"
        />
        <button
          type="button"
          aria-label="사용량 늘리기"
          disabled={busy || (amount ?? 0) >= remaining}
          onClick={() => setAmount(Math.min((amount ?? 0) + step, remaining))}
          className={STEP_BUTTON}
        >
          +
        </button>
        <div className="flex h-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium leading-6 whitespace-nowrap text-slate-700">
          {item.unit}
        </div>
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => setAmount(Math.max(Math.round(remaining / 4), 1))}
          className={QUICK_CHIP}
        >
          1/4
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setAmount(Math.max(Math.round(remaining / 2), 1))}
          className={QUICK_CHIP}
        >
          1/2
        </button>
        <button type="button" disabled={busy} onClick={() => setAmount(remaining)} className={QUICK_CHIP}>
          전부
        </button>
      </div>

      {validationMessage && (
        <p role="alert" className="-mt-2 text-xs leading-5 text-red-600">
          {validationMessage}
        </p>
      )}

      <div className="flex h-[22px] items-center gap-2 text-xs font-medium leading-5">
        <span className="text-slate-700">사용 후 남은 양</span>
        <span className="text-primary">{`${Number(fromMilli(afterRemaining))}${item.unit}`}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs font-medium leading-5">
          <span className="text-slate-700">남은 양 퍼센트</span>
          <span className="text-primary">{afterPercent}%</span>
        </div>
        <div className="h-[7px] overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-primary" style={{ width: `${afterRatio * 100}%` }} />
        </div>
      </div>

      {submitError && (
        <p role="alert" className="text-xs leading-5 text-red-600">
          {submitError}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium leading-6 whitespace-nowrap text-slate-700 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || busy}
          className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? "차감 중..." : "차감하기"}
        </button>
      </div>
    </Modal>
  );
}
