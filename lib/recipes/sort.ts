import type { RecipeSuggestion } from "@/types/recipes";

export type RecipeSort = "match" | "minutes" | "owned";

export const SORT_OPTIONS: { value: RecipeSort; label: string }[] = [
  { value: "match", label: "재료 일치율순" },
  { value: "minutes", label: "조리 시간순" },
  { value: "owned", label: "보유 재료 많은순" },
];

/** 추천 결과를 정렬한 새 배열을 돌려준다 (같으면 서버가 준 순서를 유지) */
export function sortSuggestions(list: RecipeSuggestion[], sort: RecipeSort): RecipeSuggestion[] {
  const indexed = list.map((recipe, index) => ({ recipe, index }));
  const value = (r: RecipeSuggestion): number => {
    switch (sort) {
      case "match":
        return -r.match.matchRate; // 높을수록 앞으로
      case "minutes":
        return r.minutes; // 짧을수록 앞으로
      case "owned":
        return -r.match.ownedCount; // 많을수록 앞으로
    }
  };
  return indexed.sort((a, b) => value(a.recipe) - value(b.recipe) || a.index - b.index).map((x) => x.recipe);
}
