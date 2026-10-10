"use client";

// FRG-04 재료 상세 화면.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackHeader } from "@/components/common/BackHeader";
import { DeleteItemDialog } from "@/components/fridge/DeleteItemDialog";
import { FinishItemDialog } from "@/components/fridge/FinishItemDialog";
import { ItemSummaryCard, ItemSummaryCardSkeleton } from "@/components/fridge/ItemSummaryCard";
import { UsageHistory } from "@/components/fridge/UsageHistory";
import { UseAmountModal } from "@/components/fridge/UseAmountModal";
import { DatePickerModal } from "@/components/ui/DatePickerModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { getFridgeItem, getFridgeItemUsages, updateFridgeItem } from "@/lib/api/fridge";
import { ApiError } from "@/lib/api/error";
import { addDays, formatDotted, todayString } from "@/lib/date";
import type { FridgeItem, FridgeItemDetail, ItemUsage, StorageType } from "@/types/fridge";

const USAGE_PAGE_SIZE = 20;

const STORAGE_OPTIONS: { value: StorageType; label: string }[] = [
  { value: "FRIDGE", label: "냉장" },
  { value: "FREEZER", label: "냉동" },
  { value: "ROOM", label: "실온" },
];

const SUB_LABEL = "text-sm font-medium leading-5 text-slate-700";
const SECTION_TITLE = "text-base font-medium leading-6 text-slate-900";
const READONLY_BOX =
  "flex h-[42px] w-full items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm leading-6 text-slate-500";

type DetailResult = { key: string } & (
  | { ok: true; item: FridgeItemDetail }
  | { ok: false; message: string; notFound: boolean }
);
type UsageResult = { key: string } & (
  | { ok: true; usages: ItemUsage[]; total: number; page: number }
  | { ok: false }
);

interface FridgeItemDetailScreenProps {
  id: number;
}

export function FridgeItemDetailScreen({ id }: FridgeItemDetailScreenProps) {
  const router = useRouter();
  const [retry, setRetry] = useState(0);
  const key = `${id}-${retry}`;

  const [detail, setDetail] = useState<DetailResult | null>(null);
  const [usage, setUsage] = useState<UsageResult | null>(null);
  const [loadingMoreUsage, setLoadingMoreUsage] = useState(false);

  // 고치는 중인 값. 건드리지 않은 칸은 undefined (서버 값을 그대로 보여 준다)
  const [edits, setEdits] = useState<{ displayName?: string; storage?: StorageType; purchasedAt?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null); // 잠깐 띄우는 안내 문구
  const [modal, setModal] = useState<"date" | "use" | "finish" | "delete" | null>(null);

  // 재료 정보 불러오기
  useEffect(() => {
    let cancelled = false;
    getFridgeItem(id)
      .then((item) => {
        if (!cancelled) setDetail({ key, ok: true, item });
      })
      .catch((error) => {
        if (cancelled) return;
        const notFound = error instanceof ApiError && error.status === 404;
        setDetail({
          key,
          ok: false,
          notFound,
          message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, key]);

  // 사용 기록 불러오기 (재료 정보와 따로 불러와서, 기록이 실패해도 재료는 보인다)
  useEffect(() => {
    let cancelled = false;
    getFridgeItemUsages(id, { page: 1, size: USAGE_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setUsage({ key, ok: true, usages: res.items, total: res.total, page: 1 });
      })
      .catch(() => {
        if (!cancelled) setUsage({ key, ok: false });
      });
    return () => {
      cancelled = true;
    };
  }, [id, key]);

  // 토스트는 3초 뒤에 닫는다
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  /** 사용 차감이 끝났을 때: 재료의 남은 양을 바꾸고, 새로 생긴 사용 기록이 보이게 기록을 다시 불러온다 */
  async function handleUsed(updated: FridgeItem) {
    setDetail((prev) => (prev && prev.ok ? { ...prev, item: { ...prev.item, ...updated } } : prev));
    setModal(null);
    setToast("사용량을 차감했어요");
    try {
      const res = await getFridgeItemUsages(id, { page: 1, size: USAGE_PAGE_SIZE });
      setUsage({ key, ok: true, usages: res.items, total: res.total, page: 1 });
    } catch {
      // 기록을 못 불러와도 차감은 끝났다. 이전 기록을 그대로 둔다.
    }
  }

  async function loadMoreUsage() {
    if (!usage || !usage.ok || usage.key !== key) return;
    setLoadingMoreUsage(true);
    try {
      const res = await getFridgeItemUsages(id, { page: usage.page + 1, size: USAGE_PAGE_SIZE });
      setUsage((prev) =>
        prev && prev.ok && prev.key === key
          ? { ...prev, usages: [...prev.usages, ...res.items], total: res.total, page: prev.page + 1 }
          : prev,
      );
    } catch {
      // 더 불러오지 못해도 이미 보이는 기록은 그대로 둔다 (버튼을 다시 누를 수 있다)
    } finally {
      setLoadingMoreUsage(false);
    }
  }

  function retryAll() {
    setDetail(null);
    setUsage(null);
    setRetry((n) => n + 1);
  }

  // ───────── 화면에 무엇을 보여 줄지 판단 ─────────
  const currentDetail = detail && detail.key === key ? detail : null;
  const item = currentDetail?.ok ? currentDetail.item : null;
  const currentUsage = usage && usage.key === key ? usage : null;

  const today = todayString();
  const nameValue = edits.displayName ?? item?.displayName ?? "";
  const storageValue = edits.storage ?? item?.storage ?? "FRIDGE";
  const dateValue = edits.purchasedAt ?? item?.purchasedAt ?? today;

  const nameError = nameValue.trim() ? null : "재료 이름을 입력해 주세요";
  const isDirty =
    !!item &&
    (nameValue.trim() !== item.displayName ||
      storageValue !== item.storage ||
      dateValue !== item.purchasedAt);
  const canSave = isDirty && !nameError && !saving;

  async function handleSave() {
    if (!item || !canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      // 바뀐 값만 보낸다 (수량·단위·연결 품목은 수정할 수 없다)
      const updated = await updateFridgeItem(item.id, {
        ...(nameValue.trim() !== item.displayName && { displayName: nameValue.trim() }),
        ...(storageValue !== item.storage && { storage: storageValue }),
        ...(dateValue !== item.purchasedAt && { purchasedAt: dateValue }),
      });
      setDetail((prev) => (prev && prev.ok ? { ...prev, item: { ...prev.item, ...updated } } : prev));
      setEdits({});
      setToast("저장했어요");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  const header = (
    <BackHeader
      title="재료 상세"
      backHref="/fridge"
      right={
        item && (
          <button
            type="button"
            onClick={() => setModal("delete")}
            className="shrink-0 text-sm font-medium leading-6 whitespace-nowrap text-red-600"
          >
            삭제
          </button>
        )
      }
    />
  );

  // 불러오지 못했거나 재료가 없을 때
  if (currentDetail && !currentDetail.ok) {
    return (
      <>
        {header}
        <main className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-50 px-4">
          {currentDetail.notFound ? (
            <>
              <ErrorState
                title="재료를 찾을 수 없어요"
                description="이미 삭제했거나 없는 재료예요."
              />
              <Link
                href="/fridge"
                className="flex h-[34px] items-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium leading-5 text-primary"
              >
                냉장고로 돌아가기
              </Link>
            </>
          ) : (
            <ErrorState description={currentDetail.message} onRetry={retryAll} />
          )}
        </main>
      </>
    );
  }

  return (
    <>
      {header}

      <main className="flex flex-1 flex-col gap-3 bg-slate-50 px-4 pb-2.5 pt-3">
        {!item ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="재료 정보를 불러오는 중">
            <ItemSummaryCardSkeleton />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-[42px] w-full rounded-lg" />
            <Skeleton className="h-[38px] w-full rounded-lg" />
            <Skeleton className="h-[42px] w-full rounded-lg" />
          </div>
        ) : (
          <>
            <ItemSummaryCard item={item} />

            <button
              type="button"
              disabled={Number(item.quantity) <= 0}
              onClick={() => setModal("use")}
              className="flex h-[34px] w-full shrink-0 items-center justify-center rounded-lg border border-emerald-50 bg-emerald-50 px-3 text-xs font-medium leading-5 whitespace-nowrap text-primary disabled:opacity-50"
            >
              사용 차감
            </button>

            <section className="flex shrink-0 flex-col gap-2">
              <h2 className={SECTION_TITLE}>정보 수정</h2>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="item-name" className={SUB_LABEL}>
                  이름
                </label>
                <input
                  id="item-name"
                  value={nameValue}
                  onChange={(event) => setEdits((prev) => ({ ...prev, displayName: event.target.value }))}
                  aria-invalid={!!nameError}
                  className="h-[42px] w-full rounded-lg border border-slate-200 bg-white px-3 text-sm leading-6 text-slate-900 outline-none focus:border-primary"
                />
                {nameError && (
                  <p role="alert" className="text-xs leading-5 text-red-600">
                    {nameError}
                  </p>
                )}
              </div>

              {/* 수량·단위는 백엔드가 수정을 허용하지 않아 읽기 전용 (피그마는 수정 가능으로 그려져 있음 — 디자인 수정 필요) */}
              <div className="flex gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className={SUB_LABEL}>수량</p>
                  <div className={READONLY_BOX}>{Number(item.quantity)}</div>
                </div>
                <div className="flex w-28 shrink-0 flex-col gap-1.5">
                  <p className={SUB_LABEL}>단위</p>
                  <div className={READONLY_BOX}>{item.unit}</div>
                </div>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                수량과 단위는 바꿀 수 없어요. 잘못 등록했다면 삭제하고 다시 등록해 주세요.
              </p>

              <div className="flex flex-col gap-1.5">
                <p className={SUB_LABEL}>보관 위치</p>
                <SegmentedControl
                  ariaLabel="보관 위치"
                  value={storageValue}
                  options={STORAGE_OPTIONS}
                  onChange={(next) => setEdits((prev) => ({ ...prev, storage: next }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <p className={SUB_LABEL}>구입일</p>
                <button
                  type="button"
                  onClick={() => setModal("date")}
                  className="flex h-[42px] w-full items-center rounded-lg border border-slate-200 bg-white px-3 text-left text-sm leading-6 text-slate-900"
                >
                  {formatDotted(dateValue)}
                </button>
              </div>

              {saveError && (
                <p role="alert" className="text-xs leading-5 text-red-600">
                  {saveError}
                </p>
              )}
            </section>

            <UsageHistory
              usages={currentUsage?.ok ? currentUsage.usages : null}
              failed={!!currentUsage && !currentUsage.ok}
              unit={item.unit}
              total={currentUsage?.ok ? currentUsage.total : 0}
              loadingMore={loadingMoreUsage}
              onLoadMore={loadMoreUsage}
              onRetry={retryAll}
            />

            <section className="flex shrink-0 flex-col gap-1.5">
              <h2 className={SECTION_TITLE}>바로가기</h2>
              {item.priceAvailable && (
                // TODO: 시세 상세 주소는 시세 화면(친구 담당)이 정해지면 맞춘다. itemId로 연결할 준비만 해 둔다.
                <Link
                  href={`/prices/${item.itemId}`}
                  className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3"
                >
                  <Icon name="line-chart" size={16} className="shrink-0" />
                  <span className="min-w-0 flex-1 text-sm font-medium leading-6 text-slate-700">
                    이 재료 시세 보기
                  </span>
                  <span className="text-xs font-medium leading-5 text-slate-500">›</span>
                </Link>
              )}
              {/* 레시피 이동은 레시피 화면과 협의 후 연결한다 (백엔드 가이드). 그때까지는 눌리지 않는다. */}
              <div
                aria-disabled="true"
                className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 opacity-60"
              >
                <Icon name="book-open" size={16} className="shrink-0" />
                <span className="min-w-0 flex-1 text-sm font-medium leading-6 text-slate-700">
                  이 재료로 만들 수 있는 레시피
                </span>
                <span className="text-xs font-medium leading-5 whitespace-nowrap text-slate-500">준비 중</span>
              </div>
            </section>
          </>
        )}
      </main>

      <div className="sticky bottom-0 z-10 flex h-[72px] shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
        <button
          type="button"
          disabled={!item || Number(item.quantity) <= 0}
          onClick={() => setModal("finish")}
          className="flex min-w-0 flex-1 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-slate-900 disabled:opacity-50"
        >
          다 먹음
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className="flex min-w-0 flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>

      {toast && <Toast message={toast} />}

      {item && modal === "use" && (
        <UseAmountModal item={item} onClose={() => setModal(null)} onDone={handleUsed} />
      )}

      {item && modal === "date" && (
        <DatePickerModal
          title="구입일 선택"
          description="재료를 산 날짜를 골라주세요"
          value={dateValue}
          maxDate={today}
          quickPicks={[
            { label: "오늘", date: today },
            { label: "어제", date: addDays(today, -1) },
            { label: "3일 전", date: addDays(today, -3) },
          ]}
          onConfirm={(date) => {
            setEdits((prev) => ({ ...prev, purchasedAt: date }));
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {item && modal === "finish" && (
        <FinishItemDialog item={item} onClose={() => setModal(null)} onDone={() => router.push("/fridge")} />
      )}
      {item && modal === "delete" && (
        <DeleteItemDialog item={item} onClose={() => setModal(null)} onDone={() => router.push("/fridge")} />
      )}
    </>
  );
}
