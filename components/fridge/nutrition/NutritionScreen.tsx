"use client";

// FRG-05 영양 분석 화면: 냉장고에 있는 재료를 성인 1일 영양성분 기준치와 비교한다 (실제 섭취량이 아니다)
import { useEffect, useState } from "react";
import { BackHeader } from "@/components/common/BackHeader";
import { NutrientRow } from "@/components/fridge/nutrition/NutrientRow";
import { RegisterButtons } from "@/components/fridge/RegisterButtons";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { getNutrition } from "@/lib/api/fridge";
import { isNutritionEmpty, toNutrientView } from "@/lib/fridge/nutrition";
import { withSubjectParticle, withTopicParticle } from "@/lib/fridge/utils";
import type { NutritionSummary } from "@/types/fridge";

type NutritionResult = { key: number } & (
  | { ok: true; data: NutritionSummary }
  | { ok: false; message: string }
);

export function NutritionScreen() {
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<NutritionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    getNutrition()
      .then((data) => {
        if (!cancelled) setResult({ key: retry, ok: true, data });
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
  const summary = current?.ok ? current.data : null;
  const views = summary ? summary.nutrients.map(toNutrientView) : [];
  const lacking = views.filter((v) => v.tone === "low");
  const unknown = views.filter((v) => v.tone === "unknown");

  let body;
  if (current && !current.ok) {
    body = (
      <div className="flex flex-1 items-center justify-center">
        <ErrorState
          description={current.message}
          onRetry={() => {
            setResult(null);
            setRetry((n) => n + 1);
          }}
        />
      </div>
    );
  } else if (!summary) {
    body = (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="영양 분석을 불러오는 중">
        <Skeleton className="h-[66px] rounded-[10px]" />
        <Skeleton className="h-[300px] rounded-[10px]" />
        <Skeleton className="h-[96px] rounded-[10px]" />
      </div>
    );
  } else if (isNutritionEmpty(summary)) {
    body = (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          title="냉장고가 비어 있어요"
          description="재료를 등록하면 냉장고 속 영양 균형을 분석해 줄게요"
        >
          <RegisterButtons />
        </EmptyState>
      </div>
    );
  } else {
    body = (
      <>
        <section className="flex shrink-0 items-center gap-2.5 rounded-[10px] bg-emerald-50 p-3">
          <Icon name="activity" size={22} className="shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <p className="text-sm font-medium leading-6 text-primary">냉장고 속 재료의 영양 균형</p>
            <p className="text-sm leading-5 text-slate-500">성인 1일 영양성분 기준치로 분석했어요</p>
          </div>
        </section>

        <section className="flex shrink-0 flex-col gap-[3px] rounded-[10px] border border-slate-200 bg-white p-3">
          <h2 className="text-base font-medium leading-6 text-slate-900">영양소 충족률</h2>
          {views.map((view) => (
            <NutrientRow key={view.key} view={view} />
          ))}
        </section>

        <section className="flex shrink-0 flex-col gap-2.5 rounded-[10px] border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <Icon name={lacking.length > 0 ? "circle-alert" : "activity"} size={18} className="shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-px">
              <p className="text-base font-medium leading-6 text-slate-900">
                {lacking.length > 0
                  ? `${withSubjectParticle(lacking.map((v) => v.label).join(", "))} 부족해요`
                  : "부족한 영양소가 없어요"}
              </p>
              <p className="text-sm leading-5 text-slate-500">
                {lacking.length > 0
                  ? `${lacking.map((v) => `${v.label} ${v.shortfallText}`).join(" · ")} 더 필요해요`
                  : "지금 냉장고 재료로 기준치를 채우고 있어요"}
              </p>
            </div>
          </div>
          {unknown.length > 0 && (
            <p className="text-xs leading-5 text-slate-500">
              {withTopicParticle(unknown.map((v) => v.label).join(", "))} 영양 정보가 없는 재료가 있어서 판단하지 못했어요.
            </p>
          )}
        </section>

        <p className="shrink-0 px-1 text-xs leading-5 text-slate-500">
          실제로 먹은 양이 아니라 지금 냉장고에 있는 재료를 기준으로 계산한 값이에요.
        </p>
      </>
    );
  }

  return (
    <>
      <BackHeader title="영양 분석" backHref="/fridge" />
      <main className="flex flex-1 flex-col gap-3 bg-slate-50 px-4 pb-2.5 pt-3.5">{body}</main>
      <div className="sticky bottom-0 z-10 flex h-[72px] shrink-0 items-center border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
        {/* 레시피 연동은 레시피 화면과 협의 후 연결한다 (백엔드 가이드). 그때까지는 눌리지 않는다. */}
        <button
          type="button"
          disabled
          className="flex flex-1 items-center justify-center rounded-md bg-slate-300 px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-slate-700"
        >
          부족 영양소 채우는 레시피 보기 (준비 중)
        </button>
      </div>
    </>
  );
}
