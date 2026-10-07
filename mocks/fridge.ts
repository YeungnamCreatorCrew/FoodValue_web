// 냉장고 샘플 데이터 (피그마 FRG-01 기준: 전체 14 = 냉장 8 + 냉동 4 + 실온 2)
import type {
  CatalogItem,
  FridgeItem,
  ItemUsage,
  NutritionSummary,
  ReceiptCandidate,
} from "@/types/fridge";

// createdAt 은 구입일 밤 9시로 맞춰서 "최근 등록순"이 구입일 순서와 같게 했다.
function item(
  id: number,
  itemId: number | null,
  displayName: string,
  quantity: string,
  initialQuantity: string,
  unit: FridgeItem["unit"],
  storage: FridgeItem["storage"],
  foodType: FridgeItem["foodType"],
  purchasedAt: string,
  gramsPerUnit: string | null = null,
  purchasePrice: number | null = null,
): FridgeItem {
  return {
    id,
    itemId,
    displayName,
    quantity,
    initialQuantity,
    unit,
    storage,
    foodType,
    purchasedAt,
    createdAt: `${purchasedAt}T21:00:00`,
    gramsPerUnit,
    purchasePrice,
  };
}

export const INITIAL_ITEMS: FridgeItem[] = [
  {
    ...item(1, 101, "대파", "180", "600", "g", "FRIDGE", "RAW", "2026-09-28", null, 3500), // 30%
    imageUrl: "/mock/green-onion.jpg",
  },
  item(2, 102, "두부", "1", "1.8", "모", "FRIDGE", "PROCESSED", "2026-09-26", "300", 2500), // 55%대
  item(3, 103, "냉동 닭가슴살", "4", "5", "팩", "FREEZER", "PROCESSED", "2026-09-22", "500", 12000), // 80%
  item(4, 104, "계란", "8", "10", "개", "FRIDGE", "RAW", "2026-09-21", "60", 6500),
  item(5, 105, "우유", "700", "1000", "ml", "FRIDGE", "PROCESSED", "2026-09-20"),
  item(6, 106, "양파", "3", "5", "개", "ROOM", "RAW", "2026-09-19", "200"),
  item(7, 107, "당근", "2", "3", "개", "FRIDGE", "RAW", "2026-09-18", "150"),
  item(8, 108, "애호박", "1", "2", "개", "FRIDGE", "RAW", "2026-09-17", "300"),
  item(9, 109, "냉동 새우", "250", "400", "g", "FREEZER", "RAW", "2026-09-15"),
  item(10, 110, "김치", "500", "1000", "g", "FRIDGE", "PROCESSED", "2026-09-14"),
  item(11, null, "냉동 만두", "1", "2", "봉", "FREEZER", "PROCESSED", "2026-09-12"), // 자동완성에 없는 재료
  item(12, 112, "감자", "4", "6", "개", "ROOM", "RAW", "2026-09-10", "150"),
  item(13, 113, "시금치", "1", "2", "단", "FRIDGE", "RAW", "2026-09-09", "200"),
  item(14, 114, "냉동 삼겹살", "300", "600", "g", "FREEZER", "RAW", "2026-09-05"),
];

/** 재료별 사용 이력 (재료 id → 이력) */
export const INITIAL_USAGES: Record<number, ItemUsage[]> = {
  1: [
    { id: 1, reason: "USE", amount: "120", gramsUsed: "120", usedAt: "2026-09-30" },
    { id: 2, reason: "USE", amount: "300", gramsUsed: "300", usedAt: "2026-10-03" },
  ],
  2: [{ id: 3, reason: "USE", amount: "0.8", gramsUsed: "240", usedAt: "2026-10-01" }],
};

/** 시세를 제공하는 품목(priceAvailable) */
export const PRICE_AVAILABLE_ITEM_IDS = new Set([101, 102, 104, 106, 107, 108, 110, 112, 113]);

/** 품목 검색(catalog)용. 이름 + 별칭 검색을 흉내 내려고 aliases를 따로 둔다. */
export const CATALOG: (CatalogItem & { aliases: string[] })[] = [
  { id: 101, name: "대파", category: "VEGETABLE", defaultUnit: "단", defaultStorage: "FRIDGE", aliases: ["파", "다진 파", "흙대파"] },
  { id: 117, name: "대파(손질)", category: "VEGETABLE", defaultUnit: "g", defaultStorage: "FRIDGE", aliases: [] },
  { id: 118, name: "대추", category: "FRUIT", defaultUnit: "g", defaultStorage: "ROOM", aliases: [] },
  { id: 119, name: "대패삼겹살", category: "MEAT", defaultUnit: "g", defaultStorage: "FRIDGE", aliases: [] },
  { id: 120, name: "대구", category: "SEAFOOD", defaultUnit: "개", defaultStorage: "FRIDGE", aliases: [] },
  { id: 102, name: "두부", category: "ETC", defaultUnit: "모", defaultStorage: "FRIDGE", aliases: [] },
  { id: 103, name: "닭가슴살", category: "MEAT", defaultUnit: "팩", defaultStorage: "FRIDGE", aliases: ["냉동 닭가슴살"] },
  { id: 104, name: "계란", category: "ETC", defaultUnit: "개", defaultStorage: "FRIDGE", aliases: ["달걀"] },
  { id: 105, name: "우유", category: "ETC", defaultUnit: "ml", defaultStorage: "FRIDGE", aliases: [] },
  { id: 106, name: "양파", category: "VEGETABLE", defaultUnit: "개", defaultStorage: "ROOM", aliases: [] },
  { id: 107, name: "당근", category: "VEGETABLE", defaultUnit: "개", defaultStorage: "FRIDGE", aliases: [] },
  { id: 108, name: "애호박", category: "VEGETABLE", defaultUnit: "개", defaultStorage: "FRIDGE", aliases: ["호박"] },
  { id: 109, name: "새우", category: "SEAFOOD", defaultUnit: "g", defaultStorage: "FREEZER", aliases: ["냉동 새우"] },
  { id: 110, name: "김치", category: "VEGETABLE", defaultUnit: "g", defaultStorage: "FRIDGE", aliases: ["배추김치"] },
  { id: 112, name: "감자", category: "VEGETABLE", defaultUnit: "개", defaultStorage: "ROOM", aliases: [] },
  { id: 113, name: "시금치", category: "VEGETABLE", defaultUnit: "단", defaultStorage: "FRIDGE", aliases: [] },
  { id: 114, name: "삼겹살", category: "MEAT", defaultUnit: "g", defaultStorage: "FRIDGE", aliases: ["냉동 삼겹살"] },
  { id: 115, name: "마늘", category: "VEGETABLE", defaultUnit: "g", defaultStorage: "FRIDGE", aliases: ["다진 마늘"] },
  { id: 116, name: "버섯", category: "VEGETABLE", defaultUnit: "팩", defaultStorage: "FRIDGE", aliases: ["표고버섯", "새송이버섯"] },
];

/** 영수증 인식 결과. 모든 후보는 needsReview=true, 무게는 추정하지 않으므로 단위가 비어 있을 수 있다. */
export const RECEIPT_CANDIDATES: ReceiptCandidate[] = [
  { displayName: "계란", itemId: 104, quantity: "10", unit: "개", purchasePrice: 6500, confidence: 0.97, needsReview: true },
  { displayName: "우유", itemId: 105, quantity: "1000", unit: "ml", purchasePrice: 2800, confidence: 0.95, needsReview: true },
  { displayName: "다진 마늘", itemId: 115, quantity: "200", unit: "g", purchasePrice: 3900, confidence: 0.88, needsReview: true },
  { displayName: "표고버섯", itemId: 116, quantity: "1", unit: "팩", purchasePrice: 3200, confidence: 0.91, needsReview: true },
  { displayName: "당근", itemId: 107, quantity: "3", unit: "개", purchasePrice: 2400, confidence: 0.72, needsReview: true },
  { displayName: "비비고 왕교자", itemId: null, quantity: "1", unit: null, purchasePrice: 8900, confidence: 0.6, needsReview: true },
];

/** 영양 요약 샘플 (성인 1일 기준치와 비교). fat 은 정보 누락으로 INCOMPLETE 상태를 보여 준다. */
export const NUTRITION_SAMPLE: NutritionSummary = {
  complete: false,
  nutrients: [
    { key: "carbohydrate", unit: "g", dailyReference: "324", total: "210", status: "LOW", shortfall: "114", complete: true, missingIngredientIds: [] },
    { key: "protein", unit: "g", dailyReference: "55", total: "38", status: "LOW", shortfall: "17", complete: true, missingIngredientIds: [] },
    { key: "fat", unit: "g", dailyReference: "54", total: "20", status: "INCOMPLETE", shortfall: null, complete: false, missingIngredientIds: [11, 3] },
    { key: "sodium", unit: "mg", dailyReference: "2000", total: "1200", status: "SUFFICIENT", shortfall: null, complete: true, missingIngredientIds: [] },
    { key: "sugars", unit: "g", dailyReference: "100", total: "45", status: "SUFFICIENT", shortfall: null, complete: true, missingIngredientIds: [] },
    { key: "cholesterol", unit: "mg", dailyReference: "300", total: "180", status: "SUFFICIENT", shortfall: null, complete: true, missingIngredientIds: [] },
  ],
};
