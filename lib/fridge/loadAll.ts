// 한 번에 20~50개씩 나눠 오는 냉장고 재료를 전부 모아서 가져온다 (재료 고르기처럼 전체 목록이 필요한 화면용)
import { getFridgeItems } from "@/lib/api/fridge";
import type { FridgeItem, FridgeItemListParams } from "@/types/fridge";

const MAX_PAGES = 10; // 서버가 이상해도 무한히 돌지 않도록 막아 둔다 (최대 500개)

export async function getAllFridgeItems(
  params: Omit<FridgeItemListParams, "page" | "size" | "includeEmpty"> = {},
): Promise<FridgeItem[]> {
  const all: FridgeItem[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await getFridgeItems({ ...params, page, size: 50 });
    all.push(...res.items);
    if (res.items.length === 0 || all.length >= res.total) break;
  }
  return all;
}
