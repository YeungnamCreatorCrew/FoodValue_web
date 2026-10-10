// 레시피(RCP) 타입
// 기준 문서: docs/FoodValue_ERD___API_명세.md (10/4)의 "레시피 흐름"과 레시피 API 목록.
// ⚠️ 레시피 API는 흐름 설명과 엔드포인트만 있고 요청·응답 JSON 모양이 없다.
//    아래 모양은 화면(피그마)에 필요한 값으로 정한 임시 추정이라 모두 [확인 필요]다.
// 소비기한은 팀 결정으로 제외라서 "임박 재료 우선" 같은 조건과 필드가 없다.
import type { Unit } from "@/types/fridge";

/** [확인 필요] 난이도 표기. 피그마: "난이도 하" */
export type Difficulty = "하" | "중" | "상";

/** 서버가 계산하는 냉장고 매칭 결과 (기본 양념은 제외하고 계산한다고 명세에 적혀 있다) */
export interface RecipeMatch {
  matchRate: number; // 일치율 0~100
  ownedCount: number; // 보유한 재료 수
  totalCount: number; // 필요한 재료 수 (기본 양념 제외)
  missingNames: string[]; // 부족한 재료 이름
}

/** 추천 목록의 메뉴 한 개 (POST /recipes/recommendations 응답 원소) */
export interface RecipeSuggestion {
  title: string;
  minutes: number;
  difficulty: Difficulty;
  servings: number;
  description: string; // 한 줄 설명
  match: RecipeMatch;
}

/** 저장한 레시피 목록의 한 개 (GET /recipes/saved 응답 원소) */
export interface SavedRecipeSummary extends RecipeSuggestion {
  id: number;
  savedAt: string; // ISO 문자열
}

// ───────── 레시피 상세 (POST /recipes/generate 응답, 저장한 레시피 상세) ─────────

/** 부족한 재료를 사러 갈 때 보여 주는 시세 정보 ("오늘 시세가 있는 품목에만" 서버가 붙인다) */
export interface PurchaseOffer {
  priceText: string; // "5,900원~"
  marketNote: string | null; // "오늘 시세 안정 · 구매하기 좋은 가격이에요" (구매 추천 상태)
  lowestPriceText: string | null; // "네이버 최저가 · 당일배송 5,980원"
  purchaseUrl: string; // [빠른 구매]가 여는 네이버 쇼핑 주소
}

/** 재료 한 줄: 필요한 양과 냉장고 보유 현황 */
export interface RecipeIngredient {
  name: string;
  needText: string; // "0.2단", "1/2개", "1.5큰술"
  owned: boolean;
  ownedText: string | null; // 보유 중일 때 "0.2단"
  // 요리 완료 때 차감할 재료. 냉장고에 있는 재료만 있다.
  // amount·remaining은 냉장고 재료의 단위(unit) 기준이고, 서버가 계산해서 준다고 가정했다. [확인 필요]
  deduct: { fridgeItemId: number; amount: string; remaining: string; unit: Unit } | null;
  purchase: PurchaseOffer | null; // 부족한 재료일 때만
}

export interface RecipeStep {
  title: string;
  minutes: number;
  description: string;
}

/** [확인 필요] 1인분 영양 정보. 명세는 "LLM 응답 또는 서버 계산"이라고만 적혀 있다. */
export interface RecipeNutrition {
  calories: number; // kcal
  proteinG: number;
  carbohydrateG: number;
  sodiumMg: number;
}

/** 레시피 상세 */
export interface RecipeDetail {
  title: string;
  description: string;
  minutes: number;
  difficulty: Difficulty;
  servings: number;
  match: RecipeMatch;
  ingredients: RecipeIngredient[];
  nutrition: RecipeNutrition;
  steps: RecipeStep[];
}

/** 저장한 레시피 상세 (id가 붙는다. 매칭은 열 때마다 현재 냉장고 기준으로 다시 계산) */
export interface SavedRecipeDetail extends RecipeDetail {
  id: number;
}

/** POST /recipes/generate body: 메뉴명과 인분 */
export interface GenerateRecipeRequest {
  title: string;
  servings: number;
}

/** 요리 완료 때 차감할 재료 한 개 */
export interface CookingDeduction {
  fridgeItemId: number;
  amount: string;
}

/** 요리 완료 결과 */
export interface CookingResult {
  deductedCount: number;
  finishedNames: string[]; // 이번에 다 써서 남은 양이 0이 된 재료
}

/** 추천 조건 칩 (모두 선택 사항) */
export type MaxMinutes = 20 | 40;
export type ServingsOption = 1 | 2;

export interface RecommendationConditions {
  maxMinutes?: MaxMinutes; // 20분 이내 / 40분 이내
  servings?: ServingsOption; // 1인분 / 2인분
  fillLackingNutrients?: boolean; // 부족 영양소 보충
}

/**
 * POST /recipes/recommendations body
 * [확인 필요] 명세는 서버가 냉장고 재료 전체를 LLM에 보내고 앱은 "꼭 포함할 itemId"만 보낸다.
 * 디자인은 사용자가 고른 재료만으로 추천하므로, 고른 냉장고 재료 id를 보내는 방식으로 임시로 가정했다.
 * (CLAUDE.md 9장 불일치 2번 — 백엔드와 확인 필요)
 */
export interface RecommendationRequest extends RecommendationConditions {
  fridgeItemIds: number[];
}
