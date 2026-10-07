"use client";

// FRG-02 직접 등록 화면.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackHeader } from "@/components/common/BackHeader";
import { IngredientNameField } from "@/components/fridge/IngredientNameField";
import { DatePickerModal } from "@/components/ui/DatePickerModal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { createFridgeItem } from "@/lib/api/fridge";
import { addDays, formatDotted, relativeDayLabel, todayString } from "@/lib/date";
import { UNITS, type CatalogItem, type FoodType, type StorageType, type Unit } from "@/types/fridge";

const STORAGE_OPTIONS: { value: StorageType; label: string }[] = [
  { value: "FRIDGE", label: "냉장" },
  { value: "FREEZER", label: "냉동" },
  { value: "ROOM", label: "실온" },
];
const FOOD_TYPE_OPTIONS: { value: FoodType; label: string }[] = [
  { value: "RAW", label: "원물" },
  { value: "PROCESSED", label: "가공품" },
];

const INPUT =
  "h-[42px] w-full rounded-lg border border-slate-200 bg-white px-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary";
const LABEL = "text-base font-medium leading-6 text-slate-900";
const SUB_LABEL = "text-sm font-medium leading-5 text-slate-700";
const HELP = "text-sm leading-5 text-slate-500";
const ERROR = "text-xs leading-5 text-red-600";

const DECIMAL_PATTERN = /^\d+(\.\d{1,3})?$/; // 소수 3자리까지
// 무게(gramsPerUnit)는 "개수 단위"일 때만 의미가 있다. g, kg, ml, L는 단위 자체가 무게·부피다.
const MEASURE_UNITS: Unit[] = ["g", "kg", "ml", "L"];

export function FridgeNewScreen() {
  const router = useRouter();
  const today = todayString();

  const [name, setName] = useState("");
  const [itemId, setItemId] = useState<number | null>(null); // 자동완성에서 고른 품목 (직접 입력이면 null)
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<Unit>("개");
  const [storage, setStorage] = useState<StorageType>("FRIDGE");
  const [foodType, setFoodType] = useState<FoodType>("RAW");
  const [purchasedAt, setPurchasedAt] = useState(today);
  const [gramsPerUnit, setGramsPerUnit] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  const [dateOpen, setDateOpen] = useState(false);
  const [attempted, setAttempted] = useState(false); // [등록하기]를 한 번이라도 눌렀는가 (그 뒤부터 오류를 보여 준다)
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isCountUnit = !MEASURE_UNITS.includes(unit);

  // ───────── 입력 검사 ─────────
  const errors = {
    name: name.trim() ? null : "재료 이름을 입력해 주세요",
    quantity:
      DECIMAL_PATTERN.test(quantity) && Number(quantity) > 0
        ? null
        : "0보다 큰 숫자(소수 3자리까지)를 입력해 주세요",
    gramsPerUnit:
      !isCountUnit || gramsPerUnit === "" || (DECIMAL_PATTERN.test(gramsPerUnit) && Number(gramsPerUnit) > 0)
        ? null
        : "0보다 큰 숫자로 입력해 주세요",
    purchasePrice:
      purchasePrice === "" || /^\d+$/.test(purchasePrice) ? null : "숫자만 입력해 주세요",
  };
  const hasError = Object.values(errors).some(Boolean);
  const shown = (message: string | null) => (attempted ? message : null);

  function handleSelectItem(item: CatalogItem) {
    setName(item.name);
    setItemId(item.id);
    setUnit(item.defaultUnit); // 품목의 기본 단위·보관 위치를 미리 채워 준다
    setStorage(item.defaultStorage);
  }

  async function handleSubmit() {
    setAttempted(true);
    setSubmitError(null);
    if (hasError) return;
    setBusy(true);
    try {
      const created = await createFridgeItem({
        displayName: name.trim(),
        itemId,
        quantity: String(Number(quantity)), // "1.50" → "1.5"
        unit,
        storage,
        foodType,
        purchasedAt,
        gramsPerUnit: isCountUnit && gramsPerUnit ? String(Number(gramsPerUnit)) : null,
        purchasePrice: purchasePrice ? Number(purchasePrice) : null,
      });
      // 등록한 재료가 목록 맨 위에 보이도록 id를 들고 목록 화면으로 간다
      router.push(`/fridge?added=${created.id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "등록하지 못했어요. 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <>
      <BackHeader title="재료 등록" backHref="/fridge" />

      <main className="flex flex-1 flex-col gap-4 bg-slate-50 px-4 pb-3 pt-4">
        <IngredientNameField
          value={name}
          error={shown(errors.name)}
          onChange={(next) => {
            setName(next);
            setItemId(null); // 글자를 고치면 연결된 품목은 풀린다
          }}
          onSelect={handleSelectItem}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="quantity" className={LABEL}>
            수량
          </label>
          <div className="flex items-start gap-2">
            <input
              id="quantity"
              inputMode="decimal"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value.trim())}
              aria-invalid={!!shown(errors.quantity)}
              className={`${INPUT} min-w-0 flex-1`}
            />
            <div className="relative w-28 shrink-0">
              <select
                aria-label="단위"
                value={unit}
                onChange={(event) => setUnit(event.target.value as Unit)}
                className={`${INPUT} appearance-none pr-8`}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <span
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500"
              >
                ⌄
              </span>
            </div>
          </div>
          {shown(errors.quantity) ? (
            <p role="alert" className={ERROR}>
              {errors.quantity}
            </p>
          ) : (
            <p className={HELP}>단위를 선택해 주세요</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className={LABEL}>보관 위치</p>
          <SegmentedControl
            ariaLabel="보관 위치"
            value={storage}
            options={STORAGE_OPTIONS}
            onChange={setStorage}
          />
        </div>

        {/* 백엔드 필드(foodType 등)에 맞춰 추가한 입력 — 피그마 디자인에는 없다 */}
        <div className="flex flex-col gap-1.5">
          <p className={LABEL}>재료 종류</p>
          <SegmentedControl
            ariaLabel="재료 종류"
            value={foodType}
            options={FOOD_TYPE_OPTIONS}
            onChange={setFoodType}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className={SUB_LABEL}>구입일</p>
          <button
            type="button"
            onClick={() => setDateOpen(true)}
            className="flex h-[42px] w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left"
          >
            <span suppressHydrationWarning className="min-w-0 flex-1 text-sm leading-6 text-slate-900">
              {formatDotted(purchasedAt)}
            </span>
            <span suppressHydrationWarning className="shrink-0 text-xs font-medium leading-5 whitespace-nowrap text-slate-700">
              {relativeDayLabel(purchasedAt, today)}
            </span>
          </button>
        </div>

        {isCountUnit && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="grams-per-unit" className={SUB_LABEL}>
              1{unit}당 무게 (g) <span className="font-normal text-slate-500">· 선택</span>
            </label>
            <input
              id="grams-per-unit"
              inputMode="decimal"
              value={gramsPerUnit}
              onChange={(event) => setGramsPerUnit(event.target.value.trim())}
              placeholder="예: 300"
              aria-invalid={!!shown(errors.gramsPerUnit)}
              className={INPUT}
            />
            {shown(errors.gramsPerUnit) ? (
              <p role="alert" className={ERROR}>
                {errors.gramsPerUnit}
              </p>
            ) : (
              <p className={HELP}>영양 분석에 쓰여요. 모르면 비워 두세요</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="purchase-price" className={SUB_LABEL}>
            구입 금액 (원) <span className="font-normal text-slate-500">· 선택</span>
          </label>
          <input
            id="purchase-price"
            inputMode="numeric"
            value={purchasePrice}
            onChange={(event) => setPurchasePrice(event.target.value.trim())}
            placeholder="예: 2500"
            aria-invalid={!!shown(errors.purchasePrice)}
            className={INPUT}
          />
          {shown(errors.purchasePrice) && (
            <p role="alert" className={ERROR}>
              {errors.purchasePrice}
            </p>
          )}
        </div>

        {submitError && (
          <p role="alert" className={ERROR}>
            {submitError}
          </p>
        )}
      </main>

      <div className="sticky bottom-0 z-10 flex h-[72px] shrink-0 items-center border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy}
          className="flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? "등록 중..." : "등록하기"}
        </button>
      </div>

      {dateOpen && (
        <DatePickerModal
          title="구입일 선택"
          description="재료를 산 날짜를 골라주세요"
          value={purchasedAt}
          maxDate={today}
          quickPicks={[
            { label: "오늘", date: today },
            { label: "어제", date: addDays(today, -1) },
            { label: "3일 전", date: addDays(today, -3) },
          ]}
          onConfirm={(date) => {
            setPurchasedAt(date);
            setDateOpen(false);
          }}
          onClose={() => setDateOpen(false)}
        />
      )}
    </>
  );
}
