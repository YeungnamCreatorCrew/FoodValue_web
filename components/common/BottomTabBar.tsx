import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TABS } from "./tabs";

// ⚠️ 임시 컴포넌트: 하단 탭바 위치와 구조는 친구와 정하기 전까지 냉장고·레시피 화면에서만 쓴다.
// - 메뉴 목록은 tabs.ts에 있다(PC 왼쪽 메뉴 SideNav와 같이 쓴다). 폰 폭에서만 보이고, PC(lg)에서는 숨긴다.

interface BottomTabBarProps {
  active: "fridge" | "recipe";
}

export function BottomTabBar({ active }: BottomTabBarProps) {
  return (
    <nav className="sticky bottom-0 z-10 flex h-[68px] lg:hidden shrink-0 items-center border border-slate-200 bg-white px-2.5">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className="flex h-[60px] flex-1 flex-col items-center justify-center gap-1"
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
