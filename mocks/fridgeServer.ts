// 가짜 냉장고 서버 (백엔드가 준비되기 전까지만 쓴다)
// - lib/api/fridge.ts 의 함수들이 이 파일을 부른다. 화면은 이 파일을 직접 쓰지 않는다.
// - 백엔드 "냉장고 API 가이드"(10/7)의 규칙을 흉내 낸다: 구입일 미래 불가, 수정 가능 필드 제한,
//   소프트 삭제(사용 이력 보존), 잔량 0 숨김, 영수증 중복 확인 409 등.
// - 데이터는 브라우저 메모리에 있어서 페이지를 옮겨 다녀도 유지되고, 새로고침하면 처음 샘플로 돌아간다.
// - 주소 뒤에 ?mock=empty 를 붙이면 빈 목록, ?mock=error 를 붙이면 모든 호출이 실패한다. (mockMode.ts)
import { ApiError } from "@/lib/api/error";
import { todayString } from "@/lib/date";
import { fromMilli, toMilli } from "@/lib/fridge/decimal";
import type {
  CatalogItem,
  ConsumeInput,
  CreateFridgeItemInput,
  Decimal,
  FridgeItem,
  FridgeItemDetail,
  FridgeItemListParams,
  FridgeSummary,
  ItemUsage,
  NutritionSummary,
  Paged,
  PageParams,
  Receipt,
  StorageType,
  UpdateFridgeItemInput,
} from "@/types/fridge";
import {
  CATALOG,
  INITIAL_ITEMS,
  INITIAL_USAGES,
  NUTRITION_SAMPLE,
  PRICE_AVAILABLE_ITEM_IDS,
  RECEIPT_CANDIDATES,
} from "./fridge";
import { simulateRequest } from "./mockMode";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 영수증 사진 5MB

let items: FridgeItem[] = INITIAL_ITEMS.map((i) => ({ ...i }));
let usages: Record<number, ItemUsage[]> = Object.fromEntries(
  Object.entries(INITIAL_USAGES).map(([id, list]) => [id, list.map((u) => ({ ...u }))]),
);
const receipts = new Map<number, { receipt: Receipt; confirmed: boolean }>();
let nextItemId = 1000;
let nextUsageId = 1000;
let nextReceiptId = 1;

/** 레시피 가짜 서버가 선택한 재료의 이름을 알아볼 때 쓴다 (냉장고 서버와 같은 메모리 데이터를 읽기만 한다) */
export function peekItems(ids: number[]): FridgeItem[] {
  return items.filter((i) => ids.includes(i.id)).map((i) => ({ ...i }));
}

// ───────── 작은 도구들 ─────────

function assertQuantity(value: Decimal, label = "수량") {
  if (!/^\d+(\.\d{1,3})?$/.test(value) || toMilli(value) <= 0) {
    throw new ApiError(400, `${label}은(는) 0보다 큰 숫자(소수 3자리까지)여야 해요.`);
  }
}

function assertNotFuture(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, "날짜 형식이 올바르지 않아요.");
  if (date > todayString()) throw new ApiError(400, "미래 날짜는 구입일로 쓸 수 없어요.");
}

function findItem(id: number): FridgeItem {
  const found = items.find((i) => i.id === id);
  if (!found) throw new ApiError(404, "재료를 찾을 수 없어요.");
  return found;
}

/** 사용량을 g으로 바꾼다. 환산할 수 없으면(예: ml, 무게 정보 없음) null */
function gramsOf(item: FridgeItem, amountMilli: number): Decimal | null {
  if (item.unit === "g") return fromMilli(amountMilli);
  if (item.unit === "kg") return fromMilli(amountMilli * 1000);
  if (item.gramsPerUnit && item.unit !== "ml" && item.unit !== "L") {
    return fromMilli(Math.round(amountMilli * Number(item.gramsPerUnit)));
  }
  return null;
}

function paginate<T>(list: T[], { page = 1, size = 20 }: PageParams): Paged<T> {
  const safeSize = Math.min(Math.max(size, 1), 50);
  const safePage = Math.max(page, 1);
  const start = (safePage - 1) * safeSize;
  return { items: list.slice(start, start + safeSize), page: safePage, size: safeSize, total: list.length };
}

function validateCreate(input: CreateFridgeItemInput) {
  if (!input.displayName.trim()) throw new ApiError(400, "재료 이름을 입력해 주세요.");
  assertQuantity(input.quantity);
  assertNotFuture(input.purchasedAt);
}

function buildItem(input: CreateFridgeItemInput): FridgeItem {
  return {
    id: nextItemId++,
    itemId: input.itemId ?? null,
    displayName: input.displayName.trim(),
    quantity: input.quantity,
    initialQuantity: input.quantity, // [확인 필요] 서버가 최초 수량을 등록 수량으로 저장한다고 가정
    unit: input.unit,
    storage: input.storage,
    foodType: input.foodType,
    purchasedAt: input.purchasedAt,
    createdAt: new Date().toISOString(),
    gramsPerUnit: input.gramsPerUnit ?? null,
    purchasePrice: input.purchasePrice ?? null,
  };
}

// ───────── 목록 · 요약 · 검색 ─────────

export async function listItems(params: FridgeItemListParams): Promise<Paged<FridgeItem>> {
  const mode = await simulateRequest();
  let list = mode === "empty" ? [] : [...items];

  if (!params.includeEmpty) list = list.filter((i) => toMilli(i.quantity) > 0); // 잔량 0은 숨김
  if (params.storage) list = list.filter((i) => i.storage === params.storage);
  if (params.foodType) list = list.filter((i) => i.foodType === params.foodType);
  const keyword = params.keyword?.trim();
  if (keyword) list = list.filter((i) => i.displayName.includes(keyword));

  switch (params.sort ?? "purchased") {
    case "purchased": // 구입일 오래된 순 (기본)
      list.sort((a, b) => a.purchasedAt.localeCompare(b.purchasedAt) || a.id - b.id);
      break;
    case "name":
      list.sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));
      break;
    case "newest":
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
      break;
  }

  const result = paginate(list, params);
  return { ...result, items: result.items.map((i) => ({ ...i })) };
}

export async function getSummary(): Promise<FridgeSummary> {
  const mode = await simulateRequest();
  const visible = mode === "empty" ? [] : items.filter((i) => toMilli(i.quantity) > 0);
  const count = (storage: StorageType) => visible.filter((i) => i.storage === storage).length;
  const dates = visible.map((i) => i.purchasedAt).sort();
  return {
    counts: { FRIDGE: count("FRIDGE"), FREEZER: count("FREEZER"), ROOM: count("ROOM") },
    oldestPurchasedAt: dates[0] ?? null,
  };
}

export async function searchCatalog(keyword: string): Promise<CatalogItem[]> {
  await simulateRequest();
  const trimmed = keyword.trim();
  if (!trimmed) return [];
  return CATALOG.filter(
    (c) => c.name.includes(trimmed) || c.aliases.some((alias) => alias.includes(trimmed)),
  ).map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    defaultUnit: c.defaultUnit,
    defaultStorage: c.defaultStorage,
  }));
}

// ───────── 등록 · 상세 · 수정 · 삭제 ─────────

export async function createItem(input: CreateFridgeItemInput): Promise<FridgeItem> {
  await simulateRequest();
  validateCreate(input);
  const created = buildItem(input);
  items = [...items, created];
  return { ...created };
}

export async function getItem(id: number): Promise<FridgeItemDetail> {
  await simulateRequest();
  const found = findItem(id);
  return {
    ...found,
    priceAvailable: found.itemId !== null && PRICE_AVAILABLE_ITEM_IDS.has(found.itemId),
  };
}

export async function patchItem(id: number, patch: UpdateFridgeItemInput): Promise<FridgeItem> {
  await simulateRequest();
  const found = findItem(id);
  if (patch.displayName !== undefined && !patch.displayName.trim()) {
    throw new ApiError(400, "재료 이름을 입력해 주세요.");
  }
  if (patch.purchasedAt !== undefined) assertNotFuture(patch.purchasedAt);
  // 수량·단위·연결 품목은 수정 대상이 아니라서 patch 타입에 없다 (런타임에서도 무시)
  const { displayName, storage, foodType, purchasedAt, gramsPerUnit, purchasePrice } = patch;
  Object.assign(found, {
    ...(displayName !== undefined && { displayName: displayName.trim() }),
    ...(storage !== undefined && { storage }),
    ...(foodType !== undefined && { foodType }),
    ...(purchasedAt !== undefined && { purchasedAt }),
    ...(gramsPerUnit !== undefined && { gramsPerUnit }),
    ...(purchasePrice !== undefined && { purchasePrice }),
  });
  return { ...found };
}

/** 소프트 삭제: 목록에서는 사라지지만 사용 이력은 보존한다 (usages 를 지우지 않는다) */
export async function removeItem(id: number): Promise<void> {
  await simulateRequest();
  findItem(id);
  items = items.filter((i) => i.id !== id);
}

// ───────── 사용 · 이력 ─────────

export async function consumeItem(id: number, input: ConsumeInput): Promise<FridgeItem> {
  await simulateRequest();
  const found = findItem(id);
  const remaining = toMilli(found.quantity);
  if (remaining <= 0) throw new ApiError(400, "남은 양이 없어요.");
  if (input.usedAt) assertNotFuture(input.usedAt);

  let amountMilli: number;
  if (input.reason === "FINISH") {
    amountMilli = remaining; // 잔량 전체 (amount 는 받지 않는다)
  } else if (input.amount === undefined) {
    if (input.reason === "USE") throw new ApiError(400, "사용량을 입력해 주세요.");
    amountMilli = remaining; // DISCARD 는 생략하면 잔량 전체
  } else {
    assertQuantity(input.amount, "사용량");
    amountMilli = toMilli(input.amount);
    if (amountMilli > remaining) throw new ApiError(400, "남은 양보다 많이 사용할 수 없어요.");
  }

  found.quantity = fromMilli(remaining - amountMilli);
  const record: ItemUsage = {
    id: nextUsageId++,
    reason: input.reason,
    amount: fromMilli(amountMilli),
    gramsUsed: gramsOf(found, amountMilli),
    usedAt: input.usedAt ?? todayString(),
  };
  usages = { ...usages, [id]: [...(usages[id] ?? []), record] };
  return { ...found };
}

export async function listUsages(id: number, params: PageParams): Promise<Paged<ItemUsage>> {
  await simulateRequest();
  findItem(id);
  const list = [...(usages[id] ?? [])].sort(
    (a, b) => b.usedAt.localeCompare(a.usedAt) || b.id - a.id,
  );
  return paginate(list, params);
}

// ───────── 영양 ─────────

export async function getNutrition(): Promise<NutritionSummary> {
  const mode = await simulateRequest();
  if (mode === "empty") {
    // 재료가 없으면 모든 성분의 합계가 0이라 부족으로 보인다
    return {
      complete: true,
      nutrients: NUTRITION_SAMPLE.nutrients.map((n) => ({
        ...n,
        total: "0",
        status: n.key === "carbohydrate" || n.key === "protein" || n.key === "fat" ? "LOW" : "SUFFICIENT",
        shortfall:
          n.key === "carbohydrate" || n.key === "protein" || n.key === "fat" ? n.dailyReference : null,
        complete: true,
        missingIngredientIds: [],
      })),
    };
  }
  // 샘플 값이라 실제 재료 변화(차감 등)는 반영하지 않는다
  return NUTRITION_SAMPLE;
}

// ───────── 영수증 ─────────

export async function createReceipt(image: File, purchasedAt?: string): Promise<Receipt> {
  await simulateRequest(1500); // OCR은 더 오래 걸린다고 가정
  if (!["image/png", "image/jpeg"].includes(image.type)) {
    throw new ApiError(400, "PNG 또는 JPEG 사진만 올릴 수 있어요.");
  }
  if (image.size > MAX_FILE_BYTES) throw new ApiError(400, "사진은 5MB 이하여야 해요.");
  if (purchasedAt) assertNotFuture(purchasedAt);
  const receipt: Receipt = {
    id: nextReceiptId++,
    purchasedAt: purchasedAt ?? todayString(),
    candidates: RECEIPT_CANDIDATES.map((c) => ({ ...c })),
  };
  receipts.set(receipt.id, { receipt, confirmed: false });
  return { ...receipt, candidates: receipt.candidates.map((c) => ({ ...c })) };
}

export async function getReceipt(id: number): Promise<Receipt> {
  await simulateRequest();
  const found = receipts.get(id);
  if (!found) throw new ApiError(404, "영수증을 찾을 수 없어요.");
  return { ...found.receipt, candidates: found.receipt.candidates.map((c) => ({ ...c })) };
}

export async function confirmReceipt(
  id: number,
  inputs: CreateFridgeItemInput[],
): Promise<FridgeItem[]> {
  await simulateRequest();
  const found = receipts.get(id);
  if (!found) throw new ApiError(404, "영수증을 찾을 수 없어요.");
  if (found.confirmed) throw new ApiError(409, "이미 등록한 영수증이에요.");
  if (inputs.length === 0) throw new ApiError(400, "등록할 재료를 선택해 주세요.");
  if (inputs.length > 100) throw new ApiError(400, "한 번에 최대 100개까지 등록할 수 있어요.");
  inputs.forEach(validateCreate); // 하나라도 틀리면 전부 저장하지 않는다 (한 트랜잭션)
  const created = inputs.map(buildItem);
  items = [...items, ...created];
  found.confirmed = true;
  return created.map((i) => ({ ...i }));
}
