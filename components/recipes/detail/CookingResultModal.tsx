"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { withTopicParticle } from "@/lib/fridge/utils";
import type { CookingResult } from "@/types/recipes";

interface CookingResultModalProps {
  result: CookingResult;
  onConfirm: () => void; // [확인] → 레시피 홈
  onClose: () => void; // ×
}

/** "요리 완료! 맛있게 드세요" 결과 팝업: [확인]은 레시피 홈으로, [요리 자랑하기]는 커뮤니티 글쓰기로 */
export function CookingResultModal({ result, onConfirm, onClose }: CookingResultModalProps) {
  const finished =
    result.finishedNames.length > 0
      ? ` ${withTopicParticle(result.finishedNames.join(", "))} 모두 사용했어요`
      : "";

  return (
    <Modal title="요리 완료! 맛있게 드세요" onClose={onClose}>
      <p className="text-sm leading-6 text-slate-500">
        냉장고에서 재료 {result.deductedCount}개를 차감했어요.{finished}
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-slate-900"
        >
          확인
        </button>
        {/* TODO: 레시피 정보를 전달할 수 있을 때 /community/write?recipe=...로 연결한다. 현재는 커뮤니티 첫 화면으로 이동한다. */}
        <Link
          href="/community"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover"
        >
          요리 자랑하기
        </Link>
      </div>
    </Modal>
  );
}
