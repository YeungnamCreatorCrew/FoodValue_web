"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { FvIcon } from "@/components/fv/icons";

/**
 * 화면 가운데 뜨는 팝업. 열리면 포커스가 팝업으로 들어가고, Tab은 팝업 안에서만 돌고, Esc나 바깥을 누르면 닫힌다.
 * 닫히면 연 버튼(returnTo)으로 포커스를 돌려준다. 열려 있는 동안 뒤 화면은 스크롤되지 않는다.
 */
export function Modal({ titleId, title, badge, onClose, returnTo, children }: {
  titleId: string; title: string; badge?: ReactNode; onClose: () => void; returnTo: RefObject<HTMLElement | null>; children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const back = returnTo.current;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), select, input")];
      if (!items.length) return;
      const first = items[0], last = items.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; back?.focus(); };
  }, [onClose, returnTo]);
  // body에 직접 그린다. 상세 오른쪽 칸(sticky)이 쌓임 맥락을 만들어 팝업이 헤더 아래로 깔리지 않게.
  return createPortal(<div className="modal-layer">
    <div className="modal-backdrop" aria-hidden="true" onClick={onClose} />
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="modal-panel">
      <div className="modal-head">
        <h2 id={titleId} className="fv-h2">{title}</h2>{badge}
        <button type="button" className="help-close modal-close" aria-label="닫기" onClick={onClose}><FvIcon name="close" size={22} /></button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>, document.body);
}
