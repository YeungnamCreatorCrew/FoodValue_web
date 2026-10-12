"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { TABS } from "./tabs";

// ⚠️ 임시 컴포넌트: PC(넓은 화면)에서만 보이는 왼쪽 메뉴. 폰에서는 하단 탭바(BottomTabBar)가 같은 역할을 한다.
// 어느 메뉴가 선택됐는지는 주소(pathname)로 알아낸다. 그래서 탭바가 없는 화면(등록·상세 등)에서도 표시된다.
export function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주 메뉴"
      className="fixed inset-y-0 left-0 z-20 hidden w-[220px] flex-col gap-1 border-r border-slate-200 bg-white p-4 lg:flex"
    >
      <p className="px-3 pb-4 pt-2 text-xl font-semibold text-primary">FoodValue</p>
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/" ? pathname === "/" : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
              isActive ? "bg-emerald-50 text-primary" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon name={isActive ? (tab.activeIcon ?? tab.icon) : tab.icon} size={20} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
