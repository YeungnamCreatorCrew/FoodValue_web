// 가짜 레시피 서버 (백엔드가 준비되기 전까지만 쓴다)
// - lib/api/recipes.ts 의 함수들이 이 파일을 부른다. 화면은 이 파일을 직접 쓰지 않는다.
// - LLM 호출(추천·상세 생성)은 몇 초 걸리므로 오래 기다려서 "AI 생성 중" 화면을 볼 수 있게 한다.
// - 주소 뒤에 ?mock=empty / ?mock=error 로 빈 결과·실패를 시험할 수 있다. (mockMode.ts)
import { ApiError } from "@/lib/api/error";
import type {
  RecipeSuggestion,
  RecommendationRequest,
  SavedRecipeSummary,
} from "@/types/recipes";
import { peekItems } from "./fridgeServer";
import { simulateRequest } from "./mockMode";
import { INITIAL_SAVED, RECIPE_TEMPLATES } from "./recipes";

const LLM_DELAY_MS = 3000;

const saved: SavedRecipeSummary[] = INITIAL_SAVED.map((r) => ({ ...r, match: { ...r.match } }));

export async function recommend(request: RecommendationRequest): Promise<RecipeSuggestion[]> {
  const mode = await simulateRequest(LLM_DELAY_MS);
  if (request.fridgeItemIds.length === 0) throw new ApiError(400, "재료를 1개 이상 골라 주세요.");
  if (mode === "empty") return [];

  const selectedNames = peekItems(request.fridgeItemIds).map((i) => i.displayName);
  let templates = [...RECIPE_TEMPLATES];
  if (request.maxMinutes) templates = templates.filter((t) => t.minutes <= request.maxMinutes!);
  if (request.fillLackingNutrients) {
    templates.sort((a, b) => Number(!!b.nutritionTag) - Number(!!a.nutritionTag)); // 단백질 메뉴를 앞으로
  }

  return templates.slice(0, 3).map((t) => {
    // 고른 재료 이름이 메뉴 재료에 들어 있으면 "보유"로 센다 (진짜 서버는 품목 별칭 테이블로 매칭한다)
    const owned = t.ingredients.filter((name) => selectedNames.some((s) => s.includes(name) || name.includes(s)));
    const missing = t.ingredients.filter((name) => !owned.includes(name));
    return {
      title: t.title,
      minutes: t.minutes,
      difficulty: t.difficulty,
      servings: request.servings ?? t.servings,
      description: t.description,
      match: {
        matchRate: Math.round((owned.length / t.ingredients.length) * 100),
        ownedCount: owned.length,
        totalCount: t.ingredients.length,
        missingNames: missing,
      },
    };
  });
}

export async function listSaved(): Promise<SavedRecipeSummary[]> {
  const mode = await simulateRequest();
  if (mode === "empty") return [];
  return [...saved]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .map((r) => ({ ...r, match: { ...r.match } }));
}
