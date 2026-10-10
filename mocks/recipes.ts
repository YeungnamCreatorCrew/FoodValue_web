// 레시피 샘플 데이터 (가짜 서버가 메뉴를 만들 때 쓰는 틀)
import type { Difficulty, PurchaseOffer, RecipeNutrition, RecipeStep } from "@/types/recipes";

export interface TemplateIngredient {
  name: string;
  needText: string; // "0.2단", "150g"
  deductRatio?: number; // 요리 완료 때 냉장고 남은 양의 몇 %를 쓰는지 (진짜 서버는 필요량으로 계산한다)
  offer?: PurchaseOffer; // 냉장고에 없을 때 보여 줄 시세·구매 정보 (없으면 기본 정보를 만든다)
}

export interface RecipeTemplate {
  title: string;
  minutes: number;
  difficulty: Difficulty;
  servings: number;
  description: string;
  ingredients: TemplateIngredient[]; // 기본 양념(소금, 간장 등)은 서버가 빼므로 여기에도 넣지 않는다
  steps: RecipeStep[];
  nutrition: RecipeNutrition;
  nutritionTag?: "protein"; // "부족 영양소 보충" 조건일 때 우선 보여 줄 메뉴
}

/** 기본 구매 정보 (네이버 쇼핑 검색 주소). 가격 숫자는 샘플이다. */
export function defaultOffer(name: string): PurchaseOffer {
  return {
    priceText: "5,900원~",
    marketNote: "오늘 시세 안정 · 구매하기 좋은 가격이에요",
    lowestPriceText: "네이버 최저가 · 당일배송 5,980원",
    purchaseUrl: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(name)}`,
  };
}

export const RECIPE_TEMPLATES: RecipeTemplate[] = [
  {
    title: "차돌박이 대파 된장찌개",
    minutes: 20,
    difficulty: "하",
    servings: 2,
    description: "대파를 넉넉히 넣어 만드는 든든한 한 끼",
    ingredients: [
      { name: "차돌박이", needText: "150g" },
      { name: "대파", needText: "0.2단", deductRatio: 0.3 },
      { name: "두부", needText: "1/2모", deductRatio: 0.5 },
      { name: "애호박", needText: "1/2개", deductRatio: 0.5 },
      { name: "된장", needText: "1.5큰술", deductRatio: 0.1 },
    ],
    steps: [
      { title: "재료 손질하기", minutes: 3, description: "대파와 애호박을 한입 크기로 썰어주세요." },
      { title: "육수 끓이기", minutes: 3, description: "물에 된장을 풀고 차돌박이와 채소를 넣어요." },
      { title: "끓이기", minutes: 12, description: "두부를 넣고 중불에서 끓여 간을 맞춰요." },
    ],
    nutrition: { calories: 320, proteinG: 24, carbohydrateG: 12, sodiumMg: 1100 },
  },
  {
    title: "애호박 두부 부침",
    minutes: 15,
    difficulty: "하",
    servings: 1,
    description: "바삭하게 부쳐 먹는 가벼운 반찬",
    ingredients: [
      { name: "애호박", needText: "1/2개", deductRatio: 0.5 },
      { name: "두부", needText: "1/2모", deductRatio: 0.5 },
      { name: "계란", needText: "2개", deductRatio: 0.2 },
      { name: "부침가루", needText: "3큰술" },
      { name: "대파", needText: "0.1단", deductRatio: 0.15 },
    ],
    steps: [
      { title: "재료 손질하기", minutes: 4, description: "애호박은 도톰하게, 두부는 물기를 빼고 썰어주세요." },
      { title: "반죽 입히기", minutes: 3, description: "부침가루와 계란물을 순서대로 입혀요." },
      { title: "부치기", minutes: 8, description: "중불에서 앞뒤로 노릇하게 부쳐요." },
    ],
    nutrition: { calories: 280, proteinG: 18, carbohydrateG: 20, sodiumMg: 520 },
    nutritionTag: "protein",
  },
  {
    title: "계란 대파 볶음밥",
    minutes: 15,
    difficulty: "하",
    servings: 1,
    description: "재료가 적어도 금방 되는 볶음밥",
    ingredients: [
      { name: "밥", needText: "1공기" },
      { name: "계란", needText: "2개", deductRatio: 0.2 },
      { name: "대파", needText: "0.2단", deductRatio: 0.3 },
      { name: "양파", needText: "1/2개", deductRatio: 0.2 },
    ],
    steps: [
      { title: "채소 볶기", minutes: 5, description: "대파와 양파를 잘게 썰어 기름에 볶아요." },
      { title: "계란 스크램블", minutes: 3, description: "계란을 풀어 넣고 스크램블해요." },
      { title: "밥 볶기", minutes: 7, description: "밥을 넣고 고슬고슬하게 볶아 간을 맞춰요." },
    ],
    nutrition: { calories: 520, proteinG: 20, carbohydrateG: 72, sodiumMg: 780 },
    nutritionTag: "protein",
  },
  {
    title: "닭가슴살 두부 샐러드",
    minutes: 40,
    difficulty: "중",
    servings: 2,
    description: "단백질을 든든하게 채우는 샐러드",
    ingredients: [
      { name: "닭가슴살", needText: "1팩", deductRatio: 0.25 },
      { name: "두부", needText: "1/2모", deductRatio: 0.5 },
      { name: "양파", needText: "1/2개", deductRatio: 0.2 },
      { name: "올리브유", needText: "1큰술" },
      { name: "당근", needText: "1/2개", deductRatio: 0.25 },
    ],
    steps: [
      { title: "닭가슴살 삶기", minutes: 20, description: "해동한 닭가슴살을 삶아 먹기 좋게 찢어요." },
      { title: "채소 손질하기", minutes: 10, description: "양파와 당근을 얇게 채 썰어요." },
      { title: "버무리기", minutes: 10, description: "두부와 재료를 올리브유에 가볍게 버무려요." },
    ],
    nutrition: { calories: 410, proteinG: 38, carbohydrateG: 14, sodiumMg: 640 },
    nutritionTag: "protein",
  },
];

/** 저장한 레시피 샘플 (피그마 RCP-00 기준). 매칭 결과는 열 때마다 현재 냉장고로 다시 계산한다. */
export interface SavedEntry {
  id: number;
  title: string;
  servings: number;
  savedAt: string;
}

export const INITIAL_SAVED: SavedEntry[] = [
  { id: 1, title: "애호박 두부 부침", servings: 1, savedAt: "2026-10-05T19:30:00" },
  { id: 2, title: "차돌박이 대파 된장찌개", servings: 2, savedAt: "2026-10-04T12:10:00" },
];
