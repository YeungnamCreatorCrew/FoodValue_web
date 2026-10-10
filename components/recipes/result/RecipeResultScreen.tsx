"use client";

// RCP-01 AI 생성 중 → 추천 결과. 이 화면에 들어올 때 LLM을 1번 부른다. (CLAUDE.md 확정 결정 2번)
// 새로고침하면 레시피를 다시 만든다 (추천 결과를 서버가 저장하지 않기 때문).
import Link from "next/link";
import { useEffect, useState } from "react";
import { BackHeader } from "@/components/common/BackHeader";
import { BottomTabBar } from "@/components/common/BottomTabBar";
import { TabHeader } from "@/components/common/TabHeader";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { GeneratingView } from "@/components/recipes/result/GeneratingView";
import { SortTabs } from "@/components/recipes/result/SortTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { requestRecommendations } from "@/lib/api/recipes";
import { getAllFridgeItems } from "@/lib/fridge/loadAll";
import { sortSuggestions, type RecipeSort } from "@/lib/recipes/sort";
import type { RecipeSuggestion, RecommendationConditions } from "@/types/recipes";

interface RecipeResultScreenProps {
  fridgeItemIds: number[]; // 고른 냉장고 재료 id
  conditions: RecommendationConditions;
}

type Result = { key: number } & (
  | { ok: true; suggestions: RecipeSuggestion[] }
  | { ok: false; message: string }
);

export function RecipeResultScreen({ fridgeItemIds, conditions }: RecipeResultScreenProps) {
  const { maxMinutes, servings, fillLackingNutrients } = conditions;
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [names, setNames] = useState<string[] | null>(null);
  const [sort, setSort] = useState<RecipeSort>("match");

  // 재료 다시 고르기: 방금 고른 재료를 미리 체크해 둔다
  const reselectHref = `/recipes/select?item=${fridgeItemIds.join(",")}${fillLackingNutrients ? "&nutrition=1" : ""}`;

  // 고른 재료의 이름 (안내 문구용). 못 불러와도 화면은 계속된다.
  useEffect(() => {
    let cancelled = false;
    getAllFridgeItems({})
      .then((items) => {
        if (cancelled) return;
        setNames(
          fridgeItemIds
            .map((id) => items.find((i) => i.id === id)?.displayName)
            .filter((name): name is string => !!name),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fridgeItemIds]);

  // 레시피 추천 (LLM) — 몇 초 걸린다
  useEffect(() => {
    let cancelled = false;
    requestRecommendations({ fridgeItemIds, maxMinutes, servings, fillLackingNutrients })
      .then((suggestions) => {
        if (!cancelled) setResult({ key: retry, ok: true, suggestions });
      })
      .catch((error) => {
        if (!cancelled) {
          setResult({
            key: retry,
            ok: false,
            message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fridgeItemIds, maxMinutes, servings, fillLackingNutrients, retry]);

  const current = result && result.key === retry ? result : null;

  // AI 생성 중
  if (!current) {
    return (
      <>
        <TabHeader title="맞춤 레시피" />
        <main className="flex flex-1 flex-col bg-slate-50 px-4 py-2.5">
          <GeneratingView count={fridgeItemIds.length} names={names} />
        </main>
        <BottomTabBar active="recipe" />
      </>
    );
  }

  const suggestions = current.ok ? sortSuggestions(current.suggestions, sort) : [];

  return (
    <>
      <BackHeader title="추천 결과" backHref={reselectHref} />
      <main className="flex flex-1 flex-col gap-2 bg-slate-50 px-4 py-2.5">
        <section className="flex h-[74px] shrink-0 items-center gap-2.5 rounded-[10px] bg-emerald-50 px-3">
          <Icon name="list-checks" size={22} className="shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-xs font-bold leading-[17px] text-primary">
              {current.ok && suggestions.length > 0
                ? `고른 재료 ${fridgeItemIds.length}개로 만든 레시피예요`
                : `고른 재료 ${fridgeItemIds.length}개`}
            </p>
            {names && names.length > 0 && (
              <p className="truncate text-[10px] leading-[15px] text-slate-500">{names.join(" · ")}</p>
            )}
          </div>
          <Link
            href={reselectHref}
            className="flex h-8 w-[104px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm leading-6 whitespace-nowrap text-slate-900"
          >
            재료 다시 고르기
          </Link>
        </section>

        {!current.ok ? (
          <div className="py-10">
            <ErrorState
              title="레시피를 만들지 못했어요"
              description={current.message}
              onRetry={() => {
                setResult(null);
                setRetry((n) => n + 1);
              }}
            />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-10">
            <EmptyState
              showIllustration={false}
              title="조건에 맞는 레시피를 찾지 못했어요"
              description="재료를 더 고르거나 추천 조건을 바꿔서 다시 시도해 보세요"
            >
              <Link
                href={reselectHref}
                className="flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover"
              >
                재료 다시 고르기
              </Link>
            </EmptyState>
          </div>
        ) : (
          <>
            <SortTabs value={sort} onChange={setSort} />
            {/* 메뉴를 고르면 그때 상세 레시피를 만든다 (메뉴명 + 인분으로 요청). 저장 북마크는 상세에서만 누를 수 있다. */}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {suggestions.map((recipe) => (
                <RecipeCard
                  key={recipe.title}
                  recipe={recipe}
                  href={`/recipes/detail?title=${encodeURIComponent(recipe.title)}&servings=${recipe.servings}`}
                />
              ))}
            </div>
          </>
        )}
      </main>
      <BottomTabBar active="recipe" />
    </>
  );
}
