// 영수증 인식 결과를 화면에서 다루기 쉬운 "행"으로 바꾸고 검사하는 도구
import { isCountUnit } from "@/lib/fridge/units";
import type {
  CreateFridgeItemInput,
  FoodType,
  ReceiptCandidate,
  StorageType,
  Unit,
} from "@/types/fridge";

const DECIMAL_PATTERN = /^\d+(\.\d{1,3})?$/; // 소수 3자리까지

/** 인식 결과 한 줄 (사용자가 고치는 값을 모두 들고 있다) */
export interface ReceiptRow {
  key: number; // 목록에서 줄을 구분하는 번호
  selected: boolean; // 등록할 줄인가
  originalName: string; // 영수증에서 읽은 그대로의 이름
  displayName: string;
  itemId: number | null;
  quantity: string;
  unit: Unit | null; // 인식하지 못했으면 null → 사용자가 골라야 한다
  storage: StorageType;
  foodType: FoodType;
  purchasedAt: string;
  gramsPerUnit: string; // 비워 두면 보내지 않는다
  purchasePrice: number | null;
}

export function rowFromCandidate(
  candidate: ReceiptCandidate,
  key: number,
  purchasedAt: string,
): ReceiptRow {
  return {
    key,
    selected: true,
    originalName: candidate.displayName,
    displayName: candidate.displayName,
    itemId: candidate.itemId,
    quantity: candidate.quantity,
    unit: candidate.unit,
    storage: candidate.defaultStorage ?? "FRIDGE",
    foodType: "RAW", // [확인 필요] 후보에 원물/가공 정보가 없어서 원물로 시작한다
    purchasedAt,
    gramsPerUnit: "",
    purchasePrice: candidate.purchasePrice,
  };
}

/** 등록할 수 없는 이유 (괜찮으면 null) */
export function rowError(row: ReceiptRow): string | null {
  if (!row.displayName.trim()) return "재료 이름을 입력해 주세요";
  if (!DECIMAL_PATTERN.test(row.quantity) || Number(row.quantity) <= 0) {
    return "수량은 0보다 큰 숫자(소수 3자리까지)여야 해요";
  }
  if (row.unit === null) return "단위를 선택해 주세요";
  if (
    isCountUnit(row.unit) &&
    row.gramsPerUnit !== "" &&
    (!DECIMAL_PATTERN.test(row.gramsPerUnit) || Number(row.gramsPerUnit) <= 0)
  ) {
    return "무게는 0보다 큰 숫자로 입력해 주세요";
  }
  return null;
}

/** 서버에 보낼 모양 (POST /fridge/receipts/{id}/confirm 의 items 한 칸) */
export function rowToInput(row: ReceiptRow): CreateFridgeItemInput {
  if (row.unit === null) throw new Error("단위가 없는 행은 보낼 수 없어요");
  return {
    displayName: row.displayName.trim(),
    itemId: row.itemId,
    quantity: String(Number(row.quantity)),
    unit: row.unit,
    storage: row.storage,
    foodType: row.foodType,
    purchasedAt: row.purchasedAt,
    gramsPerUnit: isCountUnit(row.unit) && row.gramsPerUnit ? String(Number(row.gramsPerUnit)) : null,
    purchasePrice: row.purchasePrice,
  };
}
