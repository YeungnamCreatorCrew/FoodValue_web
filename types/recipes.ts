// 레시피(RCP) 타입
// 기준 문서: docs/FoodValue_ERD___API_명세.md (10/4)의 "레시피 흐름"과 레시피 API 목록.
// ⚠️ 레시피 API는 흐름 설명과 엔드포인트만 있고 요청·응답 JSON 모양이 없다.
//    아래 모양은 화면(피그마)에 필요한 값으로 정한 임시 추정이라 모두 [확인 필요]다.
// 소비기한은 팀 결정으로 제외라서 "임박 재료 우선" 같은 조건과 필드가 없다.

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
