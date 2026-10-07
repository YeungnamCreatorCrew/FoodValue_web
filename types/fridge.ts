// 냉장고(FRG) 타입
// 기준 문서: 백엔드 "냉장고 API 가이드"(README, 10/7). 초기 ERD·API 명세(10/4)보다 우선한다.
// - JSON 필드는 camelCase, 목록 쿼리 파라미터만 snake_case
// - Decimal(수량 등)은 응답·요청 모두 문자열 ("0.5"), 소수점 3자리까지
// "[확인 필요]"는 가이드에 응답 모양이 없어서 임시로 정한 부분이다. 샘플 응답을 받으면 맞춘다.
// 소비기한은 제거 확정이라 관련 필드가 없다.

export type StorageType = "FRIDGE" | "FREEZER" | "ROOM"; // 냉장, 냉동, 실온
export type FoodType = "RAW" | "PROCESSED"; // 원물, 가공품

export const UNITS = ["g", "kg", "ml", "L", "개", "단", "모", "팩", "봉", "송이", "구"] as const;
export type Unit = (typeof UNITS)[number];

/** 소수 3자리까지의 숫자 문자열. 계산할 때만 Number로 바꾼다. */
export type Decimal = string;

/** 냉장고 재료 */
export interface FridgeItem {
  id: number;
  itemId: number | null; // 연결된 품목(마스터). 직접 입력한 재료는 null
  displayName: string;
  quantity: Decimal; // 남은 양
  initialQuantity: Decimal; // [확인 필요] 응답에 있는지. 남은 양 % = quantity ÷ initialQuantity
  unit: Unit;
  storage: StorageType;
  foodType: FoodType;
  purchasedAt: string; // 구입일 "YYYY-MM-DD" (미래 날짜 불가)
  createdAt: string; // [확인 필요] 응답에 있는지
  gramsPerUnit: Decimal | null; // 등록 단위 1개당 g
  purchasePrice: number | null; // 최초 등록량 전체의 구입 금액(원). 사용해도 안 바뀐다.
  // [확인 필요] 카드 디자인에는 재료 이미지가 있는데 가이드에 이미지 필드가 없다.
  imageUrl?: string | null;
}

/** 재료 상세. 시세 화면 연결용 priceAvailable 포함 */
export interface FridgeItemDetail extends FridgeItem {
  priceAvailable: boolean; // true일 때만 [시세 보기] 표시
}

/** 사용 이력 */
export type UsageReason = "USE" | "FINISH" | "DISCARD"; // 부분 사용, 다 먹음, 폐기

export interface ItemUsage {
  id: number;
  reason: UsageReason;
  amount: Decimal;
  gramsUsed: Decimal | null; // [확인 필요] 가이드에 "gramsUsed"가 언급됨. 환산 못 하면 null
  usedAt: string; // "YYYY-MM-DD"
}

/** 페이지 방식 응답 공통. [확인 필요] 필드 이름 */
export interface Paged<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

// ───────── 목록 · 요약 ─────────

/** 정렬: purchased(기본, 구입일 오래된 순), name, newest(최근 등록순) */
export type FridgeSort = "purchased" | "name" | "newest";

/** GET /fridge/items 쿼리. 보낼 때 food_type, include_empty 처럼 snake_case로 바꾼다. */
export interface FridgeItemListParams {
  storage?: StorageType;
  foodType?: FoodType;
  keyword?: string;
  sort?: FridgeSort;
  includeEmpty?: boolean; // 잔량 0 포함 여부 (기본 false)
  page?: number; // 기본 1
  size?: number; // 기본 20, 최대 50
}

/** [확인 필요] GET /fridge/summary 응답. 가이드: "보관 위치별 개수, 가장 오래된 구입일" */
export interface FridgeSummary {
  counts: Record<StorageType, number>;
  oldestPurchasedAt: string | null;
}

// ───────── 등록 · 수정 · 사용 ─────────

/** POST /fridge/items body (직접 등록), 영수증 confirm 의 items 원소와 같은 모양 */
export interface CreateFridgeItemInput {
  displayName: string;
  itemId?: number | null; // 자동완성(catalog)에서 고른 품목
  quantity: Decimal;
  unit: Unit;
  storage: StorageType;
  foodType: FoodType;
  purchasedAt: string;
  gramsPerUnit?: Decimal | null;
  purchasePrice?: number | null;
}

/** PATCH /fridge/items/{id} body. 수량·단위·연결 품목은 수정 불가 (잘못 등록하면 삭제 후 재등록) */
export type UpdateFridgeItemInput = Partial<
  Pick<
    CreateFridgeItemInput,
    "displayName" | "storage" | "foodType" | "purchasedAt" | "gramsPerUnit" | "purchasePrice"
  >
>;

/**
 * POST /fridge/items/{id}/consume body
 * - USE: amount 필수 (부분 사용)
 * - FINISH: amount 생략 (잔량 전체)
 * - DISCARD: amount 생략하면 잔량 전체, 있으면 부분 폐기
 * 사용 메모 필드는 없다 (피그마의 메모 입력은 디자인 수정 필요).
 */
export interface ConsumeInput {
  reason: UsageReason;
  amount?: Decimal;
  usedAt?: string; // 기본 오늘
}

/** GET /fridge/items/{id}/usage 쿼리 */
export interface PageParams {
  page?: number;
  size?: number;
}

// ───────── 품목 검색 (자동완성) ─────────

/** 품목 분류 (ERD의 item.category) */
export type ItemCategory = "VEGETABLE" | "GRAIN" | "FRUIT" | "MEAT" | "SEAFOOD" | "ETC";

/** GET /fridge/catalog?keyword= 응답 원소. [확인 필요] 필드 이름 (category는 자동완성의 분류 배지용) */
export interface CatalogItem {
  id: number;
  name: string;
  category?: ItemCategory;
  defaultUnit: Unit;
  defaultStorage: StorageType;
}

// ───────── 영양 요약 ─────────

export type NutrientKey = "carbohydrate" | "protein" | "fat" | "sodium" | "sugars" | "cholesterol";

/** LOW 미달, SUFFICIENT 충족, EXCESS 초과, INCOMPLETE 정보 누락으로 판정 불가 */
export type NutrientStatus = "LOW" | "SUFFICIENT" | "EXCESS" | "INCOMPLETE";

/** [확인 필요] GET /fridge/nutrition 응답의 성분 하나 */
export interface NutrientSummary {
  key: NutrientKey;
  unit: "g" | "mg";
  dailyReference: Decimal; // 성인 1일 기준치
  total: Decimal; // 냉장고 보유 재료 합계 (실제 섭취량 아님)
  status: NutrientStatus;
  shortfall: Decimal | null; // LOW일 때 부족량. INCOMPLETE면 null
  complete: boolean;
  missingIngredientIds: number[];
}

export interface NutritionSummary {
  complete: boolean;
  nutrients: NutrientSummary[];
}

// ───────── 영수증 ─────────

/** [확인 필요] 영수증 OCR 후보 한 줄. 무게는 추정하지 않고, 모든 후보는 needsReview=true */
export interface ReceiptCandidate {
  displayName: string;
  itemId: number | null; // 이름·별칭이 마스터와 정확히 일치할 때만
  quantity: Decimal;
  unit: Unit | null; // 인식하지 못했으면 null → 사용자가 고른다
  purchasePrice: number | null;
  confidence: number; // 0~1
  needsReview: boolean;
  // [확인 필요] 가이드에 없는 필드. 마스터와 일치한 품목의 기본 보관 위치를 후보에 같이 주면 좋겠다.
  // 없으면 화면이 "냉장"으로 시작한다.
  defaultStorage?: StorageType;
}

/** [확인 필요] POST /fridge/receipts, GET /fridge/receipts/{id} 응답 */
export interface Receipt {
  id: number;
  purchasedAt: string; // 사용자 입력 → 인식 날짜 → 서울 기준 오늘 (미래 날짜는 오늘로 대체)
  candidates: ReceiptCandidate[];
}
