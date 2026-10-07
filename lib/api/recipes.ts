// 레시피 API — 화면은 데이터를 이 파일의 함수로만 가져온다.
// 함수 하나가 명세(docs/FoodValue_ERD___API_명세.md)의 엔드포인트 하나와 1:1로 대응한다.
// 지금은 목업(가짜 서버)을 부르고, API가 준비되면 각 함수 안쪽만 fetch로 바꾸면 된다.
// (fetch 예시와 오류 처리 방식은 lib/api/fridge.ts 맨 위 주석과 같다. 레시피 API도 /api/v1 아래, JWT 필요.)
//
// ⚠️ 요청·응답 JSON 모양은 명세에 없어서 types/recipes.ts 의 [확인 필요] 추정이다.
// 이 함수들은 브라우저에서만 부른다(화면의 "use client" 컴포넌트). 목업 데이터가 브라우저 메모리에 있기 때문이다.
import { ApiError } from "@/lib/api/error";
import { consumeFridgeItem } from "@/lib/api/fridge";
import { toMilli } from "@/lib/fridge/decimal";
import * as fakeServer from "@/mocks/recipesServer";
import type {
  CookingDeduction,
  CookingResult,
  GenerateRecipeRequest,
  RecipeDetail,
  RecipeSuggestion,
  RecommendationRequest,
  SavedRecipeDetail,
  SavedRecipeSummary,
} from "@/types/recipes";

/** POST /recipes/recommendations — 추천 목록 생성(LLM). 메뉴 3개 + 서버 매칭 결과. 몇 초 걸린다. */
export function requestRecommendations(request: RecommendationRequest): Promise<RecipeSuggestion[]> {
  return fakeServer.recommend(request);
}

/** POST /recipes/generate — 메뉴 상세 생성(LLM). body: 메뉴명, 인분. 재료·단계·영양 + 보유/부족 + 부족 재료 시세. 몇 초 걸린다. */
export function generateRecipe(request: GenerateRecipeRequest): Promise<RecipeDetail> {
  return fakeServer.generate(request);
}

/** POST /recipes/saved — 레시피 저장. body: generate 응답의 레시피 JSON을 그대로 보낸다. */
export function saveRecipe(detail: RecipeDetail): Promise<SavedRecipeDetail> {
  return fakeServer.save(detail);
}

/** GET /recipes/saved — 저장한 레시피 목록 (RCP-00 "저장한 레시피") */
export function getSavedRecipes(): Promise<SavedRecipeSummary[]> {
  return fakeServer.listSaved();
}

/** GET /recipes/saved/{id} — 저장한 레시피 상세 (현재 냉장고 기준으로 보유/부족을 다시 계산해서 준다) */
export function getSavedRecipe(id: number): Promise<SavedRecipeDetail> {
  return fakeServer.getSaved(id);
}

/** DELETE /recipes/saved/{id} — 저장 해제 */
export function deleteSavedRecipe(id: number): Promise<void> {
  return fakeServer.removeSaved(id);
}

/**
 * 요리 완료 → 재료 자동 차감.
 * [확인 필요] 명세에 "요리 완료" 전용 API가 없다 (CLAUDE.md 9장 불일치 3번).
 * 그래서 지금은 냉장고 API의 사용 차감(POST /fridge/items/{id}/consume, reason=USE)을 재료마다 한 번씩 부른다.
 * 전용 API가 생기면 이 함수 안쪽만 바꾸면 된다.
 */
export async function completeCooking(deductions: CookingDeduction[]): Promise<CookingResult> {
  const finishedNames: string[] = [];
  let done = 0;
  for (const deduction of deductions) {
    try {
      const updated = await consumeFridgeItem(deduction.fridgeItemId, {
        reason: "USE",
        amount: deduction.amount,
      });
      done += 1;
      if (toMilli(updated.quantity) <= 0) finishedNames.push(updated.displayName);
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      throw new ApiError(
        error instanceof ApiError ? error.status : 500,
        done > 0 ? `재료 ${done}개는 차감했지만 나머지는 하지 못했어요. (${message})` : message,
      );
    }
  }
  return { deductedCount: done, finishedNames };
}
