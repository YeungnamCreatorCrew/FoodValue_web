"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { consumeFridgeItem } from "@/lib/api/fridge";
import { withObjectParticle } from "@/lib/fridge/utils";
import type { FridgeItem } from "@/types/fridge";

interface FinishItemDialogProps {
  item: FridgeItem;
  onClose: () => void;
  onDone: (updated: FridgeItem) => void; // 잔량 전체를 사용(FINISH)한 뒤의 재료
}

/** "대파를 다 먹었나요?" 확인 팝업. 확인하면 FINISH(잔량 전체 사용)로 처리한다. */
export function FinishItemDialog({ item, onClose, onDone }: FinishItemDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      const updated = await consumeFridgeItem(item.id, { reason: "FINISH" });
      onDone(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "처리하지 못했어요. 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <ConfirmDialog
      title={`${withObjectParticle(item.displayName)} 다 먹었나요?`}
      description="냉장고 목록에서 사라지고, 사용 기록에 남아요"
      confirmLabel="다 먹었어요"
      busy={busy}
      error={error}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}
