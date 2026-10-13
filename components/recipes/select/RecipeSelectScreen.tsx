"use client";

// RCP-01 재료 선택: 냉장고 재료를 직접 고르고 [선택한 재료로 추천받기]를 누를 때만 LLM을 부른다.
// 재료는 기본으로 아무것도 체크되어 있지 않다. (CLAUDE.md 확정 결정 2번)
// 냉장고 카드의 [레시피] 버튼으로 들어오면(?item=ID) 그 재료만 미리 체크된다.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BackHeader } from "@/components/common/BackHeader";
import { SearchBar } from "@/components/fridge/SearchBar";
import { StorageTabs } from "@/components/fridge/StorageTabs";
import { IngredientPickRow } from "@/components/recipes/select/IngredientPickRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ToggleChip } from "@/components/ui/ToggleChip";
import { getFridgeSummary } from "@/lib/api/fridge";
import { getAllFridgeItems } from "@/lib/fridge/loadAll";
import { STORAGE_LABEL } from "@/lib/fridge/utils";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { FridgeItem, FridgeSummary, StorageType } from "@/types/fridge";
import type { MaxMinutes, ServingsOption } from "@/types/recipes";

interface RecipeSelectScreenProps {
  preselectedIds: number[]; // 미리 체크해 둘 재료 id
  initialNutrition: boolean; // "부족 영양소 보충" 조건을 미리 켜 둘지 (영양 분석 화면에서 들어올 때)
}

type ListResult = { key: string } & (
  | { ok: true; items: FridgeItem[] }
  | { ok: false; message: string }
);
interface Picked {
  id: number;
  name: string;
}

export function RecipeSelectScreen({ preselectedIds, initialNutrition }: RecipeSelectScreenProps) {
  const router = useRouter();
  const [storage, setStorage] = useState<StorageType | undefined>(undefined);
  const [keywordInput, setKeywordInput] = useState("");
  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const [retry, setRetry] = useState(0);

  const [list, setList] = useState<ListResult | null>(null);
  const [summary, setSummary] = useState<FridgeSummary | null>(null);
  const [picked, setPicked] = useState<Picked[]>([]); // 고른 재료 (탭·검색을 바꿔도 유지된다)
  const pendingPreselect = useRef<number[]>(preselectedIds); // 재료 목록이 오면 이름을 찾아서 체크한다

  const [maxMinutes, setMaxMinutes] = useState<MaxMinutes | null>(null);
  const [servings, setServings] = useState<ServingsOption | null>(null);
  const [nutrition, setNutrition] = useState(initialNutrition);

  const listKey = JSON.stringify([storage, keyword, retry]);

  useEffect(() => {
    let cancelled = false;
    getAllFridgeItems({ storage, keyword: keyword || undefined, sort: "name" })
      .then((items) => {
        if (cancelled) return;
        setList({ key: listKey, ok: true, items });
        if (pendingPreselect.current.length > 0) {
          const found = items
            .filter((i) => pendingPreselect.current.includes(i.id))
            .map((i) => ({ id: i.id, name: i.displayName }));
          pendingPreselect.current = [];
          if (found.length > 0) setPicked((prev) => [...prev, ...found.filter((f) => !prev.some((p) => p.id === f.id))]);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setList({
            key: listKey,
            ok: false,
            message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [storage, keyword, retry, listKey]);

  // 보관 위치별 개수 (탭에 표시). 실패해도 탭만 개수 없이 보인다.
  useEffect(() => {
    let cancelled = false;
    getFridgeSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [retry]);

  function togglePick(item: FridgeItem) {
    setPicked((prev) =>
      prev.some((p) => p.id === item.id)
        ? prev.filter((p) => p.id !== item.id)
        : [...prev, { id: item.id, name: item.displayName }],
    );
  }

  function handleRecommend() {
    if (picked.length === 0) return;
    const params = new URLSearchParams({ items: picked.map((p) => p.id).join(",") });
    if (maxMinutes) params.set("time", String(maxMinutes));
    if (servings) params.set("servings", String(servings));
    if (nutrition) params.set("nutrition", "1");
    router.push(`/recipes/result?${params.toString()}`);
  }

  const current = list && list.key === listKey ? list : null;
  const okList = current?.ok ? current : null;
  const isFridgeEmpty = !!okList && okList.items.length === 0 && !keyword && !storage;

  // 냉장고에 재료가 하나도 없을 때 (피그마: 재료선택_빈상태)
  if (isFridgeEmpty) {
    return (
      <>
        <BackHeader title="재료 선택" backHref="/recipes" />
        <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-2.5">
          <EmptyState
            title="고를 수 있는 재료가 없어요"
            description="냉장고에 재료를 등록하면 레시피를 추천받을 수 있어요"
          >
            <Link
              href="/fridge/new"
              className="flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover"
            >
              냉장고에 재료 등록하기
            </Link>
          </EmptyState>
        </main>
      </>
    );
  }

  return (
    <>
      <BackHeader title="재료 선택" backHref="/recipes" />
      <main className="flex flex-1 flex-col gap-3 bg-slate-50 px-4 pb-2.5 pt-3">
        <div className="flex shrink-0 flex-col gap-1">
          <p className="text-lg font-semibold leading-7 text-slate-900">레시피에 쓸 재료를 골라주세요</p>
          <p className="text-sm leading-5 text-slate-500">고른 재료로만 AI가 레시피를 추천해요</p>
        </div>

        <SearchBar value={keywordInput} onChange={setKeywordInput} />
        <StorageTabs value={storage} counts={summary?.counts ?? null} onChange={setStorage} />

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {current && !current.ok ? (
            <div className="py-8 md:col-span-2">
              <ErrorState
                description={current.message}
                onRetry={() => {
                  setList(null);
                  setRetry((n) => n + 1);
                }}
              />
            </div>
          ) : !okList ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:col-span-2" aria-busy="true" aria-label="재료를 불러오는 중">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[50px] shrink-0 rounded-[10px]" />
              ))}
            </div>
          ) : okList.items.length === 0 ? (
            <div className="py-8 md:col-span-2">
              <EmptyState
                showIllustration={false}
                title={keyword ? `"${keyword}" 검색 결과가 없어요` : `${storage ? STORAGE_LABEL[storage] : ""} 재료가 없어요`.trim()}
                description={keyword ? "다른 이름으로 검색해 보세요" : "다른 보관 위치를 눌러 보세요"}
              />
            </div>
          ) : (
            okList.items.map((item) => (
              <IngredientPickRow
                key={item.id}
                item={item}
                selected={picked.some((p) => p.id === item.id)}
                onToggle={() => togglePick(item)}
              />
            ))
          )}
        </div>

        <section className="flex shrink-0 flex-col gap-2">
          <h2 className="text-base font-medium leading-6 text-slate-900">추천 조건 (선택)</h2>
          <div className="flex flex-wrap gap-1.5">
            <ToggleChip label="20분 이내" selected={maxMinutes === 20} onClick={() => setMaxMinutes(maxMinutes === 20 ? null : 20)} />
            <ToggleChip label="40분 이내" selected={maxMinutes === 40} onClick={() => setMaxMinutes(maxMinutes === 40 ? null : 40)} />
            <ToggleChip label="1인분" selected={servings === 1} onClick={() => setServings(servings === 1 ? null : 1)} />
            <ToggleChip label="2인분" selected={servings === 2} onClick={() => setServings(servings === 2 ? null : 2)} />
            <ToggleChip label="부족 영양소 보충" selected={nutrition} onClick={() => setNutrition(!nutrition)} />
          </div>
        </section>
      </main>

      <div className="service-action-bar sticky z-10 flex h-[72px] shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-base font-medium leading-6 text-slate-900">선택한 재료 {picked.length}개</p>
          <p className="truncate text-xs font-medium leading-5 text-slate-500">
            {picked.length === 0 ? "재료를 1개 이상 골라주세요" : picked.map((p) => p.name).join(" · ")}
          </p>
        </div>
        <button
          type="button"
          disabled={picked.length === 0}
          onClick={handleRecommend}
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
        >
          선택한 재료로 추천받기
        </button>
      </div>
    </>
  );
}
