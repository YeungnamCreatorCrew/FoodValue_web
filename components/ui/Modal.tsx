"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  closeDisabled?: boolean; // 처리 중에는 닫지 못하게 할 때
  gap?: "sm" | "md" | "lg"; // 안쪽 간격 8 / 12 / 16px. 확인 팝업은 sm, 입력 창은 lg
  children: ReactNode;
}

const GAP_CLASS = { sm: "gap-2", md: "gap-3", lg: "gap-4" } as const;

/**
 * 화면 가운데에 뜨는 창. 뒤는 어둡게 가려진다.
 * 닫는 방법: 오른쪽 위 ×, 어두운 배경 클릭, Esc 키 (모두 onClose를 부른다)
 * 확인 팝업(ConfirmDialog)과 입력 창(사용량 입력 등)이 같은 틀을 쓴다.
 */
export function Modal({ title, onClose, closeDisabled = false, gap = "sm", children }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  // onClose가 매번 새로 만들어져도 키보드 이벤트를 다시 걸지 않으려고 최신 값을 ref에 둔다
  const closeRef = useRef(() => {});
  useEffect(() => {
    closeRef.current = closeDisabled ? () => {} : onClose;
  });

  useEffect(() => {
    dialogRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // 창 뒤의 화면이 같이 스크롤되지 않게
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeRef.current();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-900/[.32]"
        onClick={() => closeRef.current()}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[calc(100dvh-32px)] w-full max-w-[358px] flex-col overflow-y-auto rounded-xl bg-white p-4 outline-none ${GAP_CLASS[gap]}`}
      >
        <div className="flex h-[30px] shrink-0 items-center gap-2">
          <h2 id={titleId} className="min-w-0 flex-1 text-lg font-semibold leading-7 text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="닫기"
            className="shrink-0 text-2xl leading-8 tracking-[-0.144px] text-slate-500 disabled:opacity-50"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
