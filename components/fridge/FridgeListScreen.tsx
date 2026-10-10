"use client";

// FRG-01 재료 목록 화면.
// "use client"는 이 파일이 브라우저에서 동작한다는 표시다. 탭·검색·정렬 같은 "상태"(화면이 기억하는 값)를 쓰기 때문이다.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomTabBar } from "@/components/common/BottomTabBar";
import { FridgeHeader } from "@/components/fridge/FridgeHeader";
import { FinishItemDialog } from "@/components/fridge/FinishItemDialog";
import { FridgeItemCard, FridgeItemCardSkeleton } from "@/components/fridge/FridgeItemCard";
import { RegisterButtons } from "@/components/fridge/RegisterButtons";
import { SearchBar } from "@/components/fridge/SearchBar";
import { SortChips } from "@/components/fridge/SortChips";
import { StorageTabs } from "@/components/fridge/StorageTabs";
import { SummaryBanner } from "@/components/fridge/SummaryBanner";
import { UseAmountModal } from "@/components/fridge/UseAmountModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { deleteFridgeItem, getFridgeItems, getFridgeSummary } from "@/lib/api/fridge";
import { STORAGE_LABEL, withObjectParticle } from "@/lib/fridge/utils";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { FridgeItem, FridgeSort, FridgeSummary, StorageType } from "@/types/fridge";

const PAGE_SIZE = 20;

// 불러온 결과. key는 "어떤 조건으로 불러왔는지"를 적어 둔 것이다.
// 지금 조건(key)과 다르면 아직 새 결과를 기다리는 중(로딩)이라고 판단한다.
type ListResult = { key: string } & (
  | { ok: true; items: FridgeItem[]; total: number; page: number }
  | { ok: false; message: string }
);
type SummaryResult = { key: string } & (
  | { ok: true; data: FridgeSummary }
  | { ok: false; message: string }
);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요.";
}

interface FridgeListScreenProps {
  // 방금 등록한 재료들의 id (등록 화면에서 /fridge?added=12 또는 영수증 등록 후 /fridge?added=12,13,14 로 넘어온 경우)
  addedIdsParam?: number[];
}

export function FridgeListScreen({ addedIdsParam }: FridgeListScreenProps) {
  const router = useRouter();
  const hasAdded = !!addedIdsParam && addedIdsParam.length > 0;
  const [addedIds] = useState<number[]>(addedIdsParam ?? []); // 주소에서 지워도 기억하려고 상태로 복사해 둔다
  const [toastOpen, setToastOpen] = useState(hasAdded);
  const [undoing, setUndoing] = useState(false);
  const [undoFailed, setUndoFailed] = useState(false);

  const [storage, setStorage] = useState<StorageType | undefined>(undefined);
  // 서버 기본 정렬은 구입일 오래된 순. 방금 등록한 재료가 맨 위에 보이도록 등록 직후에는 "최근 등록순"으로 시작한다.
  const [sort, setSort] = useState<FridgeSort>(hasAdded ? "newest" : "purchased");
  const [keywordInput, setKeywordInput] = useState("");
  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const [retry, setRetry] = useState(0); // [다시 시도]를 누를 때마다 1씩 늘려서 다시 불러온다

  const [list, setList] = useState<ListResult | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  // 지금 열려 있는 창: 사용량 입력 또는 다 먹음 확인
  const [modal, setModal] = useState<{ type: "use" | "finish"; item: FridgeItem } | null>(null);
  // 재료가 목록에서 사라졌을 때 +1 해서, 탭의 개수를 화면 깜빡임 없이 다시 불러온다
  const [summaryVersion, setSummaryVersion] = useState(0);

  const listKey = JSON.stringify([storage, sort, keyword, retry]);
  const summaryKey = String(retry);

  // 주소에 붙은 ?added=... 는 한 번 쓰고 지운다 (새로고침해도 토스트가 또 뜨지 않게)
  useEffect(() => {
    if (hasAdded) router.replace("/fridge");
  }, [hasAdded, router]);

  // 목록 불러오기: 탭·정렬·검색어가 바뀌면 처음(1페이지)부터 다시 불러온다
  useEffect(() => {
    let cancelled = false; // 그 사이 조건이 또 바뀌었으면 늦게 온 결과는 버린다
    getFridgeItems({
      storage,
      sort,
      keyword: keyword || undefined,
      page: 1,
      size: PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled) {
          setList({ key: listKey, ok: true, items: res.items, total: res.total, page: 1 });
          setLoadMoreFailed(false);
        }
      })
      .catch((error) => {
        if (!cancelled) setList({ key: listKey, ok: false, message: errorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [storage, sort, keyword, retry, listKey]);

  // 보관 위치별 개수(요약): 처음 한 번, 다시 시도할 때만 불러온다
  useEffect(() => {
    let cancelled = false;
    getFridgeSummary()
      .then((data) => {
        if (!cancelled) setSummary({ key: summaryKey, ok: true, data });
      })
      .catch((error) => {
        if (!cancelled) setSummary({ key: summaryKey, ok: false, message: errorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [summaryKey, summaryVersion]);

  /** 사용 차감·다 먹음이 끝났을 때: 목록의 그 재료를 바꾸고(또는 지우고), 창을 닫는다 */
  function handleConsumed(updated: FridgeItem) {
    const isGone = Number(updated.quantity) <= 0; // 잔량 0은 기본 목록에서 숨겨진다
    setList((prev) => {
      if (!prev || !prev.ok) return prev;
      return {
        ...prev,
        items: isGone
          ? prev.items.filter((i) => i.id !== updated.id)
          : prev.items.map((i) => (i.id === updated.id ? updated : i)),
        total: isGone ? prev.total - 1 : prev.total,
      };
    });
    if (isGone) setSummaryVersion((n) => n + 1);
    setModal(null);
  }

  async function loadMore() {
    if (!list || !list.ok || list.key !== listKey) return;
    setLoadingMore(true);
    setLoadMoreFailed(false);
    try {
      const res = await getFridgeItems({
        storage,
        sort,
        keyword: keyword || undefined,
        page: list.page + 1,
        size: PAGE_SIZE,
      });
      setList((prev) =>
        prev && prev.ok && prev.key === listKey
          ? { ...prev, items: [...prev.items, ...res.items], total: res.total, page: prev.page + 1 }
          : prev,
      );
    } catch {
      setLoadMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }

  // ───────── 화면에 무엇을 보여 줄지 판단 ─────────
  const currentList = list && list.key === listKey ? list : null; // 지금 조건에 맞는 결과만
  const currentSummary = summary && summary.key === summaryKey ? summary : null;
  const summaryData = currentSummary?.ok ? currentSummary.data : null;
  const totalCount = summaryData
    ? summaryData.counts.FRIDGE + summaryData.counts.FREEZER + summaryData.counts.ROOM
    : null;

  const failureMessage =
    currentList && !currentList.ok
      ? currentList.message
      : currentSummary && !currentSummary.ok
        ? currentSummary.message
        : null;
  const isLoading = !failureMessage && !currentList;
  const okList = currentList?.ok ? currentList : null;
  const isFridgeEmpty = !!okList && okList.total === 0 && !keyword && !storage;

  // 방금 등록한 재료가 목록에 나타나면 토스트를 띄우고, 6초 뒤 닫는다
  const addedItems = okList ? okList.items.filter((i) => addedIds.includes(i.id)) : [];
  const toastVisible = toastOpen && addedItems.length > 0;
  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => setToastOpen(false), 6000);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  /** [실행 취소]: 방금 등록한 재료(들)를 삭제한다 */
  async function handleUndo() {
    if (addedItems.length === 0) return;
    setUndoing(true);
    setUndoFailed(false);
    const targetIds = addedItems.map((i) => i.id);
    try {
      await Promise.all(targetIds.map((targetId) => deleteFridgeItem(targetId)));
      setList((prev) =>
        prev && prev.ok
          ? {
              ...prev,
              items: prev.items.filter((i) => !targetIds.includes(i.id)),
              total: prev.total - targetIds.length,
            }
          : prev,
      );
      setSummaryVersion((n) => n + 1);
      setToastOpen(false);
    } catch {
      setUndoFailed(true);
    } finally {
      setUndoing(false);
    }
  }

  function retryAll() {
    setList(null);
    setSummary(null);
    setRetry((n) => n + 1);
  }

  return (
    <>
      <FridgeHeader />
      <main
        className={`flex flex-1 flex-col gap-2 bg-slate-50 px-4 py-2.5 ${
          failureMessage || isFridgeEmpty ? "justify-center" : ""
        }`}
      >
        {failureMessage ? (
          <ErrorState description={failureMessage} onRetry={retryAll} />
        ) : isFridgeEmpty ? (
          <EmptyState
            title="냉장고가 비어 있어요"
            description="재료를 등록하면 냉장고에 무엇이 있는지 한눈에 볼 수 있어요"
          >
            <RegisterButtons />
          </EmptyState>
        ) : (
          <>
            {totalCount === null ? (
              <Skeleton className="h-[62px] shrink-0 rounded-[10px]" />
            ) : (
              <SummaryBanner totalCount={totalCount} />
            )}
            <SearchBar value={keywordInput} onChange={setKeywordInput} />
            <SortChips value={sort} onChange={setSort} />
            <RegisterButtons />
            <StorageTabs value={storage} counts={summaryData?.counts ?? null} onChange={setStorage} />

            {isLoading ? (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2" aria-busy="true" aria-label="재료 목록을 불러오는 중">
                <FridgeItemCardSkeleton />
                <FridgeItemCardSkeleton />
                <FridgeItemCardSkeleton />
              </div>
            ) : okList && okList.items.length === 0 ? (
              <div className="py-10">
                <EmptyState
                  showIllustration={false}
                  title={
                    keyword
                      ? `"${keyword}" 검색 결과가 없어요`
                      : `${storage ? STORAGE_LABEL[storage] : ""} 재료가 없어요`.trim()
                  }
                  description={
                    keyword ? "다른 이름으로 검색해 보세요" : "재료를 등록하면 여기에 보여요"
                  }
                />
              </div>
            ) : (
              okList && (
                <>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {okList.items.map((item) => (
                      <FridgeItemCard
                        key={item.id}
                        item={item}
                        highlighted={toastVisible && addedIds.includes(item.id)}
                        onUse={(target) => setModal({ type: "use", item: target })}
                        onFinish={(target) => setModal({ type: "finish", item: target })}
                      />
                    ))}
                  </div>
                  {okList.items.length < okList.total && (
                    <div className="flex flex-col items-center gap-1.5 pb-2">
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="h-[34px] w-full rounded-lg border border-slate-200 bg-white text-xs font-medium leading-5 text-primary disabled:opacity-50"
                      >
                        {loadingMore ? "불러오는 중..." : "더 보기"}
                      </button>
                      {loadMoreFailed && (
                        <p className="text-xs leading-5 text-red-600">
                          더 불러오지 못했어요. 다시 눌러 주세요.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )
            )}
          </>
        )}
      </main>
      <BottomTabBar active="fridge" />
      {toastVisible && (
        <Toast
          message={
            undoFailed
              ? "되돌리지 못했어요. 다시 시도해 주세요"
              : addedItems.length === 1
                ? `${withObjectParticle(addedItems[0].displayName)} 냉장고에 등록했어요`
                : `재료 ${addedItems.length}개를 냉장고에 등록했어요`
          }
          actionLabel="실행 취소"
          onAction={handleUndo}
          actionDisabled={undoing}
        />
      )}
      {modal?.type === "use" && (
        <UseAmountModal item={modal.item} onClose={() => setModal(null)} onDone={handleConsumed} />
      )}
      {modal?.type === "finish" && (
        <FinishItemDialog item={modal.item} onClose={() => setModal(null)} onDone={handleConsumed} />
      )}
    </>
  );
}
