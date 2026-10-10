"use client";

// RCP-02 레시피 상세: 대표 정보, 냉장고 일치, 재료 매칭, 영양, 조리 단계, 저장·공유·요리 완료.
// 두 가지로 들어온다: ① 추천 결과에서 메뉴를 골라서 (메뉴명 + 인분으로 상세를 새로 만든다, LLM 호출)
//                    ② 저장한 레시피를 열어서 (저장된 레시피를 지금 냉장고 기준으로 다시 매칭해서 보여 준다)
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackHeader } from "@/components/common/BackHeader";
import { CompleteCookingModal } from "@/components/recipes/detail/CompleteCookingModal";
import { CookingResultModal } from "@/components/recipes/detail/CookingResultModal";
import { DetailBottomBar } from "@/components/recipes/detail/DetailBottomBar";
import { DetailLoading } from "@/components/recipes/detail/DetailLoading";
import { IngredientMatchCard } from "@/components/recipes/detail/IngredientMatchCard";
import { MatchSummary } from "@/components/recipes/detail/MatchSummary";
import { NutritionCard } from "@/components/recipes/detail/NutritionCard";
import { RecipeHero } from "@/components/recipes/detail/RecipeHero";
import { StepsCard } from "@/components/recipes/detail/StepsCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { Toast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api/error";
import { deleteSavedRecipe, generateRecipe, getSavedRecipe, saveRecipe } from "@/lib/api/recipes";
import type { CookingResult, RecipeDetail } from "@/types/recipes";

export type RecipeDetailSource =
  | { kind: "generate"; title: string; servings: number }
  | { kind: "saved"; id: number };

type Loaded = { key: number } & (
  | { ok: true; detail: RecipeDetail; savedId: number | null }
  | { ok: false; message: string; notFound: boolean }
);

interface RecipeDetailScreenProps {
  source: RecipeDetailSource;
}

export function RecipeDetailScreen({ source }: RecipeDetailScreenProps) {
  const router = useRouter();
  const generateTitle = source.kind === "generate" ? source.title : null;
  const generateServings = source.kind === "generate" ? source.servings : 0;
  const savedRecipeId = source.kind === "saved" ? source.id : null;

  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<"complete" | { result: CookingResult } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const request =
      savedRecipeId !== null
        ? getSavedRecipe(savedRecipeId).then((d) => ({ detail: d as RecipeDetail, savedId: d.id as number | null }))
        : generateRecipe({ title: generateTitle ?? "", servings: generateServings }).then((d) => ({
            detail: d,
            savedId: null as number | null,
          }));
    request
      .then((r) => {
        if (!cancelled) setLoaded({ key: retry, ok: true, ...r });
      })
      .catch((error) => {
        if (cancelled) return;
        setLoaded({
          key: retry,
          ok: false,
          notFound: error instanceof ApiError && error.status === 404,
          message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [savedRecipeId, generateTitle, generateServings, retry]);

  // 토스트는 3초 뒤에 닫는다
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const current = loaded && loaded.key === retry ? loaded : null;

  function goBack() {
    // 추천 결과나 저장한 목록에서 왔으면 그 화면으로, 주소로 바로 들어왔으면 레시피 홈으로
    if (window.history.length > 1) router.back();
    else router.push("/recipes");
  }

  async function handleToggleSave() {
    if (!current || !current.ok || saving) return;
    setSaving(true);
    try {
      if (current.savedId === null) {
        const savedRecipe = await saveRecipe(current.detail);
        setLoaded((prev) => (prev && prev.ok ? { ...prev, savedId: savedRecipe.id } : prev));
        setToast("레시피를 저장했어요");
      } else {
        await deleteSavedRecipe(current.savedId);
        setLoaded((prev) => (prev && prev.ok ? { ...prev, savedId: null } : prev));
        setToast("저장을 해제했어요");
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : "처리하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  // [확인 필요] 공유 방식은 피그마·명세에 없다. 지금은 기기의 공유 창이 있으면 쓰고, 없으면 주소를 복사한다.
  async function handleShare() {
    if (!current || !current.ok) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: current.detail.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setToast("링크를 복사했어요");
      }
    } catch {
      // 공유 창을 닫았거나 복사가 막힌 경우: 아무것도 하지 않는다
    }
  }

  const header = (
    <BackHeader title="레시피 상세" backHref="/recipes" onBack={goBack} icon="arrow-left" />
  );

  // 불러오는 중 (LLM 호출이라 몇 초 걸린다)
  if (!current) {
    return (
      <>
        {header}
        <main className="flex flex-1 flex-col bg-slate-50 px-4 py-2">
          <DetailLoading title={generateTitle} />
        </main>
      </>
    );
  }

  // 불러오지 못했거나 저장한 레시피가 없을 때
  if (!current.ok) {
    return (
      <>
        {header}
        <main className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-50 px-4">
          {current.notFound ? (
            <>
              <ErrorState title="레시피를 찾을 수 없어요" description={current.message} />
              <Link
                href="/recipes"
                className="flex h-[34px] items-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium leading-5 text-primary"
              >
                레시피 홈으로
              </Link>
            </>
          ) : (
            <ErrorState
              title="레시피를 만들지 못했어요"
              description={current.message}
              onRetry={() => {
                setLoaded(null);
                setRetry((n) => n + 1);
              }}
            />
          )}
        </main>
      </>
    );
  }

  const { detail } = current;
  return (
    <>
      {header}
      <main className="flex flex-1 flex-col gap-2 bg-slate-50 px-4 py-2">
        <RecipeHero recipe={detail} />
        <MatchSummary match={detail.match} />
        <IngredientMatchCard ingredients={detail.ingredients} />
        <NutritionCard nutrition={detail.nutrition} />
        <StepsCard steps={detail.steps} totalMinutes={detail.minutes} />
      </main>

      <DetailBottomBar
        saved={current.savedId !== null}
        busy={saving}
        onToggleSave={handleToggleSave}
        onShare={handleShare}
        onComplete={() => setModal("complete")}
      />

      {toast && <Toast message={toast} />}

      {modal === "complete" && (
        <CompleteCookingModal
          ingredients={detail.ingredients}
          onClose={() => setModal(null)}
          onDone={(result) => setModal({ result })}
        />
      )}
      {modal && modal !== "complete" && (
        <CookingResultModal
          result={modal.result}
          onConfirm={() => router.push("/recipes")}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
