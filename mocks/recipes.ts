// 레시피 샘플 데이터
import type { Difficulty, SavedRecipeSummary } from "@/types/recipes";

/** 추천 결과를 만들 때 쓰는 메뉴 틀. ingredients 중 냉장고에 있는 재료를 세어서 일치율을 계산한다. */
export interface RecipeTemplate {
  title: string;
  minutes: number;
  difficulty: Difficulty;
  servings: number;
  description: string;
  ingredients: string[]; // 기본 양념(소금, 간장 등)은 서버가 빼므로 여기에도 넣지 않는다
  nutritionTag?: "protein"; // "부족 영양소 보충" 조건일 때 우선 보여 줄 메뉴
}

export const RECIPE_TEMPLATES: RecipeTemplate[] = [
  {
    title: "차돌박이 대파 된장찌개",
    minutes: 20,
    difficulty: "하",
    servings: 2,
    description: "냉장고 재료를 알뜰하게 쓰는 한 끼",
    ingredients: ["차돌박이", "대파", "두부", "애호박", "된장"],
  },
  {
    title: "애호박 두부 부침",
    minutes: 15,
    difficulty: "하",
    servings: 1,
    description: "바삭하게 부쳐 먹는 가벼운 반찬",
    ingredients: ["애호박", "두부", "계란", "부침가루", "대파"],
    nutritionTag: "protein",
  },
  {
    title: "계란 대파 볶음밥",
    minutes: 15,
    difficulty: "하",
    servings: 1,
    description: "재료가 적어도 금방 되는 볶음밥",
    ingredients: ["밥", "계란", "대파", "양파"],
    nutritionTag: "protein",
  },
  {
    title: "닭가슴살 두부 샐러드",
    minutes: 40,
    difficulty: "중",
    servings: 2,
    description: "단백질을 든든하게 채우는 샐러드",
    ingredients: ["닭가슴살", "두부", "양파", "올리브유", "당근"],
    nutritionTag: "protein",
  },
];

/** 저장한 레시피 샘플 (피그마 RCP-00 기준) */
export const INITIAL_SAVED: SavedRecipeSummary[] = [
  {
    id: 1,
    title: "애호박 두부 부침",
    minutes: 15,
    difficulty: "하",
    servings: 1,
    description: "냉장고 재료를 알뜰하게 쓰는 한 끼",
    match: { matchRate: 80, ownedCount: 4, totalCount: 5, missingNames: ["부침가루"] },
    savedAt: "2026-10-05T19:30:00",
  },
  {
    id: 2,
    title: "차돌박이 대파 된장찌개",
    minutes: 20,
    difficulty: "하",
    servings: 2,
    description: "냉장고 재료를 알뜰하게 쓰는 한 끼",
    match: { matchRate: 80, ownedCount: 4, totalCount: 5, missingNames: ["차돌박이"] },
    savedAt: "2026-10-04T12:10:00",
  },
];
