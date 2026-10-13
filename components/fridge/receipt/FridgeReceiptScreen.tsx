"use client";

// FRG-03 영수증으로 등록 화면.
// 흐름: 사진 올리기 → (인식 중) → 인식 결과 확인·수정 → 선택한 재료 등록
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BackHeader } from "@/components/common/BackHeader";
import { ReceiptItemEditModal } from "@/components/fridge/receipt/ReceiptItemEditModal";
import { ReceiptItemRow } from "@/components/fridge/receipt/ReceiptItemRow";
import { ReceiptScanView } from "@/components/fridge/receipt/ReceiptScanView";
import { ReceiptUploadBox } from "@/components/fridge/receipt/ReceiptUploadBox";
import { DatePickerModal } from "@/components/ui/DatePickerModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api/error";
import { confirmReceipt, uploadReceipt } from "@/lib/api/fridge";
import { addDays, formatDotted, relativeDayLabel, todayString } from "@/lib/date";
import { rowError, rowFromCandidate, rowToInput, type ReceiptRow } from "@/lib/fridge/receipt";
import type { Receipt } from "@/types/fridge";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 백엔드 제한 5MB

type Phase = "idle" | "scanning" | "result";
interface Problem {
  message: string;
  status?: number;
}

function toProblem(error: unknown, fallback: string): Problem {
  if (error instanceof ApiError) return { message: error.message, status: error.status };
  return { message: error instanceof Error ? error.message : fallback };
}

export function FridgeReceiptScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [receiptDate, setReceiptDate] = useState(todayString());
  const [uploadProblem, setUploadProblem] = useState<Problem | null>(null);
  const [confirmProblem, setConfirmProblem] = useState<Problem | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [dateOpen, setDateOpen] = useState(false);

  // 사진 미리보기용 임시 주소는 쓰고 나면 반드시 해제한다 (메모리 누수 방지)
  const urlRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );
  function replacePreview(next: string | null) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = next;
    setPreviewUrl(next);
  }

  async function handlePick(file: File) {
    setUploadProblem(null);
    setConfirmProblem(null);
    // 서버에 보내기 전에 같은 규칙(PNG/JPEG, 5MB 이하)으로 먼저 확인한다
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setUploadProblem({ message: "PNG 또는 JPEG 사진만 올릴 수 있어요. (HEIC 사진은 JPEG로 바꿔 주세요)" });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadProblem({ message: "사진은 5MB 이하여야 해요." });
      return;
    }

    replacePreview(URL.createObjectURL(file));
    setPhase("scanning");
    try {
      const result = await uploadReceipt(file);
      setReceipt(result);
      setReceiptDate(result.purchasedAt);
      setRows(result.candidates.map((candidate, index) => rowFromCandidate(candidate, index, result.purchasedAt)));
      setPhase("result");
    } catch (e) {
      setUploadProblem(toProblem(e, "영수증을 인식하지 못했어요. 다시 시도해 주세요."));
      replacePreview(null);
      setPhase("idle");
    }
  }

  function updateRow(key: number, patch: Partial<ReceiptRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function changeReceiptDate(date: string) {
    setReceiptDate(date);
    setRows((prev) => prev.map((r) => ({ ...r, purchasedAt: date }))); // 전체 줄의 구입일을 한 번에 바꾼다
  }

  const selectedRows = rows.filter((r) => r.selected);
  const invalidCount = selectedRows.filter((r) => rowError(r) !== null).length;
  const canSubmit = phase === "result" && selectedRows.length > 0 && invalidCount === 0 && !confirming;
  const editingRow = rows.find((r) => r.key === editingKey) ?? null;
  const today = todayString();

  async function handleConfirm() {
    if (!receipt || !canSubmit) return;
    setConfirming(true);
    setConfirmProblem(null);
    try {
      const created = await confirmReceipt(receipt.id, selectedRows.map(rowToInput));
      // 등록한 재료들이 목록 맨 위에 보이도록 id를 들고 목록 화면으로 간다
      router.push(`/fridge?added=${created.map((item) => item.id).join(",")}`);
    } catch (e) {
      setConfirmProblem(toProblem(e, "등록하지 못했어요. 다시 시도해 주세요."));
      setConfirming(false);
    }
  }

  let footerLabel = "영수증을 올려 주세요";
  if (phase === "scanning") footerLabel = "인식 중…";
  else if (phase === "result") {
    footerLabel =
      selectedRows.length === 0
        ? "등록할 재료를 선택해 주세요"
        : confirming
          ? "등록 중..."
          : `선택한 재료 ${selectedRows.length}개 등록`;
  }

  return (
    <>
      <BackHeader title="영수증으로 등록" backHref="/fridge" />

      <main className="flex flex-1 flex-col gap-2.5 bg-slate-50 px-4 pb-2.5 pt-3">
        {phase === "scanning" ? (
          <ReceiptScanView previewUrl={previewUrl} />
        ) : (
          <>
            <ReceiptUploadBox previewUrl={previewUrl} disabled={confirming} onPick={handlePick} />

            {uploadProblem && (
              <div role="alert" className="flex flex-col gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm leading-5 text-red-700">
                <p>{uploadProblem.message}</p>
                {uploadProblem.status === 503 && (
                  <Link href="/fridge/new" className="font-medium text-primary underline">
                    직접 등록하러 가기
                  </Link>
                )}
              </div>
            )}

            {phase === "result" && receipt && (
              <>
                <button
                  type="button"
                  onClick={() => setDateOpen(true)}
                  className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left"
                >
                  <span className="text-xs font-medium leading-5 whitespace-nowrap text-slate-700">구입일</span>
                  <span suppressHydrationWarning className="min-w-0 flex-1 text-sm leading-6 text-slate-900">
                    {formatDotted(receiptDate)}
                    <span className="ml-1.5 text-xs font-medium text-slate-500">
                      {relativeDayLabel(receiptDate, today)}
                    </span>
                  </span>
                  <span className="text-xs font-medium leading-5 whitespace-nowrap text-primary">전체 변경</span>
                </button>

                <section className="flex shrink-0 flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <h2 className="flex-1 text-base font-medium leading-6 text-slate-900">인식 결과</h2>
                    <p className="text-sm font-medium leading-5 whitespace-nowrap text-primary">
                      {selectedRows.length}개 선택
                    </p>
                  </div>

                  {rows.length === 0 ? (
                    <div className="py-8">
                      <EmptyState
                        showIllustration={false}
                        title="식품을 찾지 못했어요"
                        description="영수증 전체가 잘 보이게 다시 올려 주세요"
                      />
                    </div>
                  ) : (
                    rows.map((row) => (
                      <ReceiptItemRow
                        key={row.key}
                        row={row}
                        onToggle={() => updateRow(row.key, { selected: !row.selected })}
                        onEdit={() => setEditingKey(row.key)}
                      />
                    ))
                  )}
                </section>

                {rows.length > 0 && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 ${
                      invalidCount > 0 ? "text-red-600" : "text-slate-500"
                    }`}
                  >
                    <Icon name="info" size={14} className="shrink-0" />
                    <p className="min-w-0 flex-1 text-sm leading-5">
                      {invalidCount > 0
                        ? `고쳐야 하는 항목이 ${invalidCount}개 있어요. 눌러서 고쳐 주세요`
                        : "인식이 틀린 항목은 눌러서 고칠 수 있어요"}
                    </p>
                  </div>
                )}

                {confirmProblem && (
                  <div role="alert" className="flex flex-col gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm leading-5 text-red-700">
                    <p>{confirmProblem.message}</p>
                    {confirmProblem.status === 409 && (
                      <Link href="/fridge" className="font-medium text-primary underline">
                        냉장고로 가기
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <div className="service-action-bar sticky z-10 flex h-[72px] shrink-0 items-center border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleConfirm}
          className={`flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap ${
            canSubmit
              ? "bg-primary text-primary-foreground hover:bg-primary-hover"
              : "bg-slate-300 text-slate-700"
          } ${phase === "scanning" ? "h-11" : ""}`}
        >
          {footerLabel}
        </button>
      </div>

      {editingRow && (
        <ReceiptItemEditModal
          key={editingRow.key}
          row={editingRow}
          onSave={(updated) => {
            setRows((prev) => prev.map((r) => (r.key === updated.key ? updated : r)));
            setEditingKey(null);
          }}
          onExclude={() => {
            updateRow(editingRow.key, { selected: false });
            setEditingKey(null);
          }}
          onClose={() => setEditingKey(null)}
        />
      )}

      {dateOpen && (
        <DatePickerModal
          title="구입일 선택"
          description="영수증의 모든 재료에 적용돼요"
          value={receiptDate}
          maxDate={today}
          quickPicks={[
            { label: "오늘", date: today },
            { label: "어제", date: addDays(today, -1) },
            { label: "3일 전", date: addDays(today, -3) },
          ]}
          onConfirm={(date) => {
            changeReceiptDate(date);
            setDateOpen(false);
          }}
          onClose={() => setDateOpen(false)}
        />
      )}
    </>
  );
}
