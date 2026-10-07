"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteFridgeItem } from "@/lib/api/fridge";
import { withObjectParticle } from "@/lib/fridge/utils";
import type { FridgeItem } from "@/types/fridge";

interface DeleteItemDialogProps {
  item: FridgeItem;
  onClose: () => void;
  onDone: () => void; // 삭제가 끝났을 때
}

/** "대파를 삭제할까요?" 확인 팝업 */
export function DeleteItemDialog({ item, onClose, onDone }: DeleteItemDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteFridgeItem(item.id);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제하지 못했어요. 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <ConfirmDialog
      title={`${withObjectParticle(item.displayName)} 삭제할까요?`}
      // 피그마 문구("사용 기록도 함께 삭제")는 백엔드(소프트 삭제: 사용 이력 보존)와 달라서 바꿨다 — 디자인 수정 필요
      description="냉장고 목록에서 삭제돼요. 잘못 등록했을 때 쓰세요"
      confirmLabel="삭제"
      tone="danger"
      busy={busy}
      error={error}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}
