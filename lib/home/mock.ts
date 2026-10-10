import type { HomeCommunityPost, HomeData, HomeFridgeSummary, HomePriceSummary } from "./types";

export const mockHomeUser = { nickname: "오늘도집밥" };

const prices: HomePriceSummary[] = [
  {
    itemId: 1, name: "흙대파", category: "채소", unit: "1단 · 800g",
    imageUrl: "/figma/home/green-onion.png", currentPrice: 2980, forecastPrice: 2640,
    recommendation: "BUY_LATER", buyingGuide: "3일 뒤 구매하면 약 300원 절약 예상",
  },
  {
    itemId: 2, name: "양파", category: "채소", unit: "1.5kg",
    imageUrl: "/figma/home/onion.png", currentPrice: 4200, forecastPrice: 4500,
    recommendation: "BUY_NOW", buyingGuide: "가격이 오르기 전, 지금 구매를 추천해요",
  },
  {
    itemId: 3, name: "한우", category: "축산", unit: "불고기용 · 100g",
    imageUrl: "/figma/home/beef.png", currentPrice: 6980, forecastPrice: 6980,
    recommendation: "STABLE", buyingGuide: "가격이 안정적이에요. 필요할 때 구매해요",
  },
];

const fridge: HomeFridgeSummary = { ingredientCount: 8, lowStockCount: 2 };

// Latest first; IDs and titles align with feature/community's sample posts.
const posts: HomeCommunityPost[] = [
  { id: 1, category: "RECIPE_SHARE", title: "대파전 만들어봤어요", nickname: "오늘도집밥", commentCount: 2, hasImage: false, updatedAt: "2026-10-07T00:00:00Z" },
  { id: 2, category: "GROUP_BUY", title: "양파 같이 나누실 분 구해요", nickname: "오늘도집밥", commentCount: 0, hasImage: false, updatedAt: "2026-10-06T23:00:00Z" },
  { id: 3, category: "SHOWOFF", title: "오늘 만든 닭볶음탕", nickname: "오늘도집밥", commentCount: 0, hasImage: false, updatedAt: "2026-10-06T22:00:00Z" },
];

export function getMockHomeData(isLoggedIn: boolean): HomeData {
  return { priceDate: "2026-10-08", prices, fridge: isLoggedIn ? fridge : null, posts };
}
