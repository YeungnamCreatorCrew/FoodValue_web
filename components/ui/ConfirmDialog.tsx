"use client";

import { Modal } from "@/components/ui/Modal";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean; // 처리 중이면 버튼을 잠근다
  error?: string | null; // 실패했을 때 보여 줄 메시지
  onConfirm: () => void;
  onCancel: () => void;
}

/** "정말 할까요?" 확인 팝업 (예: 다 먹음 확인, 삭제 확인) */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "취소",
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} closeDisabled={busy}>
      {description && <p className="text-sm leading-6 text-slate-500">{description}</p>}
      {error && (
        <p role="alert" className="text-xs leading-5 text-red-600">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-slate-900 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? "처리 중..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
