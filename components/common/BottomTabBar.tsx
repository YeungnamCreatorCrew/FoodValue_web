"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { isTabActive, TABS } from "./tabs";

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="주 메뉴" className="sticky bottom-0 z-20 flex h-[var(--service-nav-height)] shrink-0 items-center border border-slate-200 bg-white px-2.5 pb-[env(safe-area-inset-bottom)] lg:hidden">
      {TABS.map((tab) => {
        const isActive = isTabActive(pathname, tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className="flex h-[60px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg hover:bg-slate-50"
          >
            <Icon name={isActive ? (tab.activeIcon ?? tab.icon) : tab.icon} size={20} />
            <span
              className={`text-xs leading-5 ${isActive ? "text-primary" : "text-slate-500"}`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
