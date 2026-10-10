// 가짜 레시피 서버 (백엔드가 준비되기 전까지만 쓴다)
// - lib/api/recipes.ts 의 함수들이 이 파일을 부른다. 화면은 이 파일을 직접 쓰지 않는다.
// - LLM 호출(추천·상세 생성)은 몇 초 걸리므로 오래 기다려서 "AI 생성 중" 화면을 볼 수 있게 한다.
// - 보유/부족은 냉장고 가짜 서버의 지금 재료로 계산한다 (진짜 서버는 품목 별칭 테이블로 매칭한다).
// - 주소 뒤에 ?mock=empty / ?mock=error 로 빈 결과·실패를 시험할 수 있다. (mockMode.ts)
import { ApiError } from "@/lib/api/error";
import { fromMilli, toMilli } from "@/lib/fridge/decimal";
import type { FridgeItem } from "@/types/fridge";
import type {
  GenerateRecipeRequest,
  RecipeDetail,
  RecipeIngredient,
  RecipeSuggestion,
  RecommendationRequest,
  SavedRecipeDetail,
  SavedRecipeSummary,
} from "@/types/recipes";
import { peekAllItems, peekItems } from "./fridgeServer";
import { simulateRequest } from "./mockMode";
import { INITIAL_SAVED, RECIPE_TEMPLATES, defaultOffer, type RecipeTemplate, type SavedEntry } from "./recipes";

const LLM_DELAY_MS = 3000;

const saved: SavedEntry[] = INITIAL_SAVED.map((entry) => ({ ...entry }));
let nextSavedId = 100;

/** 재료 이름이 서로 포함되면 같은 재료로 본다 ("냉동 닭가슴살" ↔ "닭가슴살") */
function sameName(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a);
}

/** 메뉴 틀 + 지금 냉장고 → 보유/부족이 계산된 상세 */
function buildDetail(template: RecipeTemplate, servings: number, fridge: FridgeItem[]): RecipeDetail {
  const ingredients: RecipeIngredient[] = template.ingredients.map((ing) => {
    const item = fridge.find((i) => sameName(i.displayName, ing.name) && toMilli(i.quantity) > 0);
    if (!item) {
      return {
        name: ing.name,
        needText: ing.needText,
        owned: false,
        ownedText: null,
        deduct: null,
        purchase: ing.offer ?? defaultOffer(ing.name),
      };
    }
    const remaining = toMilli(item.quantity);
    const used = Math.min(Math.max(Math.round(remaining * (ing.deductRatio ?? 0.2)), 1), remaining);
    return {
      name: ing.name,
      needText: ing.needText,
      owned: true,
      ownedText: `${Number(item.quantity)}${item.unit}`,
      deduct: {
        fridgeItemId: item.id,
        amount: fromMilli(used),
        remaining: item.quantity,
        unit: item.unit,
      },
      purchase: null,
    };
  });

  const ownedCount = ingredients.filter((i) => i.owned).length;
  return {
    title: template.title,
    description: template.description,
    minutes: template.minutes,
    difficulty: template.difficulty,
    servings,
    match: {
      matchRate: Math.round((ownedCount / ingredients.length) * 100),
      ownedCount,
      totalCount: ingredients.length,
      missingNames: ingredients.filter((i) => !i.owned).map((i) => i.name),
    },
    ingredients,
    nutrition: template.nutrition,
    steps: template.steps,
  };
}

function summaryOf(detail: RecipeDetail): RecipeSuggestion {
  return {
    title: detail.title,
    minutes: detail.minutes,
    difficulty: detail.difficulty,
    servings: detail.servings,
    description: detail.description,
    match: detail.match,
  };
}

function findTemplate(title: string): RecipeTemplate {
  const template = RECIPE_TEMPLATES.find((t) => t.title === title);
  if (!template) throw new ApiError(404, "이 메뉴의 레시피를 만들 수 없어요.");
  return template;
}

// ───────── 추천 ─────────

export async function recommend(request: RecommendationRequest): Promise<RecipeSuggestion[]> {
  const mode = await simulateRequest(LLM_DELAY_MS);
  if (request.fridgeItemIds.length === 0) throw new ApiError(400, "재료를 1개 이상 골라 주세요.");
  if (mode === "empty") return [];

  // 고른 재료만으로 추천한다 (보유 여부도 고른 재료 기준)
  const selected = peekItems(request.fridgeItemIds);
  let templates = [...RECIPE_TEMPLATES];
  if (request.maxMinutes) templates = templates.filter((t) => t.minutes <= request.maxMinutes!);
  if (request.fillLackingNutrients) {
    templates.sort((a, b) => Number(!!b.nutritionTag) - Number(!!a.nutritionTag)); // 단백질 메뉴를 앞으로
  }
  return templates
    .slice(0, 3)
    .map((t) => summaryOf(buildDetail(t, request.servings ?? t.servings, selected)));
}

// ───────── 상세 ─────────

export async function generate(request: GenerateRecipeRequest): Promise<RecipeDetail> {
  await simulateRequest(LLM_DELAY_MS);
  return buildDetail(findTemplate(request.title), request.servings, peekAllItems());
}

// ───────── 저장 ─────────

export async function save(detail: RecipeDetail): Promise<SavedRecipeDetail> {
  await simulateRequest();
  const existing = saved.find((s) => s.title === detail.title);
  const entry =
    existing ??
    (() => {
      const created: SavedEntry = {
        id: nextSavedId++,
        title: detail.title,
        servings: detail.servings,
        savedAt: new Date().toISOString(),
      };
      saved.push(created);
      return created;
    })();
  return { id: entry.id, ...detail };
}

export async function listSaved(): Promise<SavedRecipeSummary[]> {
  const mode = await simulateRequest();
  if (mode === "empty") return [];
  const fridge = peekAllItems();
  return [...saved]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .map((entry) => ({
      id: entry.id,
      savedAt: entry.savedAt,
      ...summaryOf(buildDetail(findTemplate(entry.title), entry.servings, fridge)),
    }));
}

export async function getSaved(id: number): Promise<SavedRecipeDetail> {
  await simulateRequest();
  const entry = saved.find((s) => s.id === id);
  if (!entry) throw new ApiError(404, "저장한 레시피를 찾을 수 없어요.");
  // 열 때마다 현재 냉장고 기준으로 보유/부족을 다시 계산한다 (명세)
  return { id: entry.id, ...buildDetail(findTemplate(entry.title), entry.servings, peekAllItems()) };
}

export async function removeSaved(id: number): Promise<void> {
  await simulateRequest();
  const index = saved.findIndex((s) => s.id === id);
  if (index === -1) throw new ApiError(404, "저장한 레시피를 찾을 수 없어요.");
  saved.splice(index, 1);
}
