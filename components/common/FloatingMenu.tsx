"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { isTabActive, TABS } from "./tabs";

export function FloatingMenu() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const open = hovered || pinned;
  const close = () => { setHovered(false); setPinned(false); };

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) { setHovered(false); setPinned(false); }
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setHovered(false); setPinned(false); trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  return <header className="floating-header">
    <Link href="/" className="mobile-brand" aria-label="FoodValue 홈">FoodValue</Link>
    {/* 메뉴가 4개 이하라 데스크톱에서는 펼쳐 둔다. 모바일은 아래 햄버거 메뉴를 쓴다. */}
    <nav aria-label="주 메뉴" className="desktop-nav">
      {TABS.map(tab => <Link key={tab.key} href={tab.href} aria-current={isTabActive(pathname, tab.href) ? "page" : undefined}>{tab.label}</Link>)}
    </nav>
    <div ref={root} className="floating-menu-root"
      onPointerEnter={event => { if (event.pointerType === "mouse" && window.matchMedia("(min-width: 1024px)").matches) setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
      <button ref={trigger} type="button" className="menu-trigger" aria-label="주 메뉴" aria-expanded={open} aria-controls="floating-navigation"
        onClick={() => { setPinned(!pinned); setHovered(false); }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={open ? "m6 6 12 12M6 18 18 6" : "M4 6h16M4 12h16M4 18h16"} /></svg>
      </button>
      <div className="floating-menu-bridge" hidden={!open}>
        <nav id="floating-navigation" aria-label="주 메뉴" className="floating-menu-panel">
          <p className="px-3 pb-3 pt-1 text-lg font-bold text-primary">FoodValue</p>
          {TABS.map(tab => <Link key={tab.key} href={tab.href} onClick={close} aria-current={isTabActive(pathname, tab.href) ? "page" : undefined}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-primary-soft aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary">
            <Icon name={tab.icon} size={20} />{tab.label}
          </Link>)}
        </nav>
      </div>
    </div>
  </header>;
}
