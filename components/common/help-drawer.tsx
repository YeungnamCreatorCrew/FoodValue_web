"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FvIcon } from "@/components/fv/icons";

const HelpPanel = dynamic(() => import("./help-panel").then(module => module.HelpPanel));
/** 화면 어디서나 여는 '지표 읽는 법'. 본문을 밀어내지 않고 오른쪽에서 겹쳐 열린다. Esc로 닫고, 닫으면 (?) 버튼으로 돌아간다. */

export function HelpDrawer() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) button.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); return; }
      if (event.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>("a[href], button")];
      if (!items.length) return;
      const first = items[0], last = items.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [open]);

  return <>
    <button ref={button} type="button" className="help-button" aria-haspopup="dialog" aria-expanded={open} aria-label="지표 읽는 법" onClick={() => setOpen(true)}>
      <FvIcon name="help" size={20} /><span>지표 읽는 법</span>
    </button>
    {open && <HelpPanel ref={panel} onClose={() => setOpen(false)} />}
  </>;
}
