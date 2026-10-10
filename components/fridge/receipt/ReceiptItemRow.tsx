import { Icon } from "@/components/ui/Icon";
import { STORAGE_LABEL } from "@/lib/fridge/utils";
import { rowError, type ReceiptRow } from "@/lib/fridge/receipt";

interface ReceiptItemRowProps {
  row: ReceiptRow;
  onToggle: () => void; // 체크박스
  onEdit: () => void; // 줄을 눌러 고치기
}

/** 인식 결과 한 줄: [체크] 재료명 · 수량 단위 · 보관 위치 / 수정 */
export function ReceiptItemRow({ row, onToggle, onEdit }: ReceiptItemRowProps) {
  const error = rowError(row);
  const needsFix = row.selected && error !== null; // 등록하려면 고쳐야 하는 줄

  return (
    <div
      className={`flex h-[66px] shrink-0 items-center gap-2 rounded-lg border bg-white px-2.5 ${
        needsFix ? "border-red-300" : "border-slate-200"
      } ${row.selected ? "" : "opacity-60"}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={row.selected}
        aria-label={`${row.displayName} 선택`}
        onClick={onToggle}
        className="flex size-[18px] shrink-0 items-center justify-center"
      >
        <span
          className={`size-[14px] rounded-[2px] border ${
            row.selected ? "border-primary bg-primary" : "border-slate-300 bg-white"
          }`}
        />
      </button>

      <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-base font-medium leading-6 text-slate-900">
            {row.displayName}
          </span>
          <span className="flex shrink-0 items-center gap-[3px] text-sm font-medium leading-6 whitespace-nowrap text-slate-500">
            <Icon name="pencil" size={12} />
            수정
          </span>
        </span>
        {needsFix ? (
          <span className="truncate text-sm leading-6 text-red-600">{error}</span>
        ) : (
          <span className="truncate text-sm leading-6 text-slate-700">
            {Number(row.quantity)}
            {row.unit ?? ""} · {STORAGE_LABEL[row.storage]}
          </span>
        )}
      </button>
    </div>
  );
}
