// 냉장고 API — 화면은 데이터를 이 파일의 함수로만 가져온다.
// 함수 하나가 백엔드 "냉장고 API 가이드"(/api/v1/fridge)의 엔드포인트 하나와 1:1로 대응한다.
// 지금은 목업(가짜 서버)을 부르고, API가 준비되면 각 함수 안쪽만 fetch로 바꾸면 된다.
//
// fetch로 바꾸는 예시 (getFridgeItems):
//   const query = new URLSearchParams();                    // 목록 쿼리는 snake_case
//   if (params.storage) query.set("storage", params.storage);
//   if (params.foodType) query.set("food_type", params.foodType);
//   if (params.keyword) query.set("keyword", params.keyword);
//   if (params.sort) query.set("sort", params.sort);
//   if (params.includeEmpty) query.set("include_empty", "true");
//   if (params.page) query.set("page", String(params.page));
//   if (params.size) query.set("size", String(params.size));
//   const res = await fetch(`/api/v1/fridge/items?${query}`, {
//     headers: { Authorization: `Bearer ${accessToken}` },   // 모든 API는 JWT 필요
//   });
//   if (!res.ok) throw new ApiError(res.status, "재료 목록을 불러오지 못했어요.");
//   return res.json();                                       // JSON 본문은 camelCase
//
// 오류 코드: 입력 오류 400, 미인증 401, 없거나 남의 재료 404, 영수증 중복 확인 409, OCR 미설정 503
// 이 함수들은 브라우저에서만 부른다(화면의 "use client" 컴포넌트). 목업 데이터가 브라우저 메모리에 있기 때문이다.
import * as fakeServer from "@/mocks/fridgeServer";
import type {
  CatalogItem,
  ConsumeInput,
  CreateFridgeItemInput,
  FridgeItem,
  FridgeItemDetail,
  FridgeItemListParams,
  FridgeSummary,
  ItemUsage,
  NutritionSummary,
  Paged,
  PageParams,
  Receipt,
  UpdateFridgeItemInput,
} from "@/types/fridge";

/** GET /fridge/catalog?keyword= — 품목 이름·별칭 검색 (직접 등록 자동완성) */
export function searchCatalog(keyword: string): Promise<CatalogItem[]> {
  return fakeServer.searchCatalog(keyword);
}

/** GET /fridge/items — 재료 목록 (storage, food_type, keyword, sort, include_empty, page, size) */
export function getFridgeItems(params: FridgeItemListParams = {}): Promise<Paged<FridgeItem>> {
  return fakeServer.listItems(params);
}

/** POST /fridge/items — 직접 등록 */
export function createFridgeItem(input: CreateFridgeItemInput): Promise<FridgeItem> {
  return fakeServer.createItem(input);
}

/** GET /fridge/items/{id} — 재료 상세 (itemId, priceAvailable 포함) */
export function getFridgeItem(id: number): Promise<FridgeItemDetail> {
  return fakeServer.getItem(id);
}

/** PATCH /fridge/items/{id} — 이름·보관 위치·원물/가공·구입일·무게·구입 금액만 수정 가능 */
export function updateFridgeItem(id: number, patch: UpdateFridgeItemInput): Promise<FridgeItem> {
  return fakeServer.patchItem(id, patch);
}

/** DELETE /fridge/items/{id} — 소프트 삭제 (사용 이력은 보존) */
export function deleteFridgeItem(id: number): Promise<void> {
  return fakeServer.removeItem(id);
}

/** POST /fridge/items/{id}/consume — 사용(USE)·다 먹음(FINISH)·폐기(DISCARD) */
export function consumeFridgeItem(id: number, input: ConsumeInput): Promise<FridgeItem> {
  return fakeServer.consumeItem(id, input);
}

/** GET /fridge/items/{id}/usage — 사용 이력 (페이지) */
export function getFridgeItemUsages(id: number, params: PageParams = {}): Promise<Paged<ItemUsage>> {
  return fakeServer.listUsages(id, params);
}

/** GET /fridge/summary — 보관 위치별 개수, 가장 오래된 구입일 (보관 요약 배너·탭 개수) */
export function getFridgeSummary(): Promise<FridgeSummary> {
  return fakeServer.getSummary();
}

/** GET /fridge/nutrition — 냉장고 보유 재료 영양 요약 (FRG-05) */
export function getNutrition(): Promise<NutritionSummary> {
  return fakeServer.getNutrition();
}

/** POST /fridge/receipts — 영수증 사진 업로드(multipart, PNG/JPEG 5MB 이하) + OCR. purchased_at 은 선택 */
export function uploadReceipt(image: File, purchasedAt?: string): Promise<Receipt> {
  return fakeServer.createReceipt(image, purchasedAt);
}

/** GET /fridge/receipts/{id} — OCR 후보 조회 */
export function getReceipt(id: number): Promise<Receipt> {
  return fakeServer.getReceipt(id);
}

/** POST /fridge/receipts/{id}/confirm — 확인한 재료 일괄 등록 (body: {"items": [...]}, 최대 100개, 중복이면 409) */
export function confirmReceipt(
  id: number,
  items: CreateFridgeItemInput[],
): Promise<FridgeItem[]> {
  return fakeServer.confirmReceipt(id, items);
}
