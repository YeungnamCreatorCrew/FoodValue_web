// 레시피 API — 화면은 데이터를 이 파일의 함수로만 가져온다.
// 함수 하나가 명세(docs/FoodValue_ERD___API_명세.md)의 엔드포인트 하나와 1:1로 대응한다.
// 지금은 목업(가짜 서버)을 부르고, API가 준비되면 각 함수 안쪽만 fetch로 바꾸면 된다.
// (fetch 예시와 오류 처리 방식은 lib/api/fridge.ts 맨 위 주석과 같다. 레시피 API도 /api/v1 아래, JWT 필요.)
//
// ⚠️ 요청·응답 JSON 모양은 명세에 없어서 types/recipes.ts 의 [확인 필요] 추정이다.
// 이 함수들은 브라우저에서만 부른다(화면의 "use client" 컴포넌트). 목업 데이터가 브라우저 메모리에 있기 때문이다.
import * as fakeServer from "@/mocks/recipesServer";
import type {
  RecipeSuggestion,
  RecommendationRequest,
  SavedRecipeSummary,
} from "@/types/recipes";

/** POST /recipes/recommendations — 추천 목록 생성(LLM). 메뉴 3개 + 서버 매칭 결과. 몇 초 걸린다. */
export function requestRecommendations(request: RecommendationRequest): Promise<RecipeSuggestion[]> {
  return fakeServer.recommend(request);
}

/** GET /recipes/saved — 저장한 레시피 목록 (RCP-00 "저장한 레시피") */
export function getSavedRecipes(): Promise<SavedRecipeSummary[]> {
  return fakeServer.listSaved();
}
