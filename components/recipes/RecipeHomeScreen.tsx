"use client";

// RCP-00 레시피 홈: [재료 고르기] 카드 + 저장한 레시피. 들어오자마자 LLM을 부르지 않는다. (CLAUDE.md 확정 결정 2번)
import Link from "next/link";
import { useEffect, useState } from "react";
import { BottomTabBar } from "@/components/common/BottomTabBar";
import { TabHeader } from "@/components/common/TabHeader";
import { RecipeCard, RecipeCardSkeleton } from "@/components/recipes/RecipeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { getSavedRecipes } from "@/lib/api/recipes";
import type { SavedRecipeSummary } from "@/types/recipes";

// [확인 필요] 피그마의 "최근 추천받은 레시피" 영역은 아직 만들지 않았다.
// 명세는 추천 결과를 저장하지 않아서 보여 줄 데이터가 없기 때문이다. 백엔드와 확인 후 추가한다.
// (CLAUDE.md 9장 불일치 4번 — 1단계에서는 숨기거나 저장한 레시피만 보여 주는 방향)

type SavedResult = { key: number } & (
  | { ok: true; recipes: SavedRecipeSummary[] }
  | { ok: false; message: string }
);

export function RecipeHomeScreen() {
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSavedRecipes()
      .then((recipes) => {
        if (!cancelled) setResult({ key: retry, ok: true, recipes });
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
  }, [retry]);

  const current = result && result.key === retry ? result : null;

  return (
    <>
      <TabHeader title="레시피" />
      <main className="flex flex-1 flex-col gap-4 bg-slate-50 px-4 py-2.5">
        <section className="flex h-[74px] shrink-0 items-center gap-2.5 rounded-[10px] bg-emerald-50 px-3">
          <Icon name="list-checks" size={22} className="shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-xs font-bold leading-[17px] text-primary">냉장고 재료로 레시피 추천받기</p>
            <p className="text-[10px] leading-[15px] text-slate-500">
              재료를 고르면 AI가 그 재료로만 레시피를 만들어요
            </p>
          </div>
          <Link
            href="/recipes/select"
            className="flex h-8 w-[90px] shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover"
          >
            재료 고르기
          </Link>
        </section>

        <section className="flex shrink-0 flex-col gap-2">
          <h2 className="text-base font-medium leading-6 text-slate-900">저장한 레시피</h2>

          {!current ? (
            <div className="flex flex-col gap-2" aria-busy="true" aria-label="저장한 레시피를 불러오는 중">
              <RecipeCardSkeleton />
            </div>
          ) : !current.ok ? (
            <div className="py-8">
              <ErrorState
                description={current.message}
                onRetry={() => {
                  setResult(null);
                  setRetry((n) => n + 1);
                }}
              />
            </div>
          ) : current.recipes.length === 0 ? (
            <div className="py-8">
              <EmptyState
                showIllustration={false}
                title="아직 저장한 레시피가 없어요"
                description="재료를 골라 추천받고, 마음에 드는 레시피를 저장해 보세요"
              />
            </div>
          ) : (
            current.recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} href={`/recipes/saved/${recipe.id}`} bookmarked />
            ))
          )}
        </section>
      </main>
      <BottomTabBar active="recipe" />
    </>
  );
}
