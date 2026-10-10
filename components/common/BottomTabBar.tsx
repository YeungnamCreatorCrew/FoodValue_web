import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";

// ⚠️ 임시 컴포넌트: 하단 탭바 위치와 구조는 친구와 정하기 전까지 냉장고·레시피 화면에서만 쓴다.
// - 탭 주소(/, /prices, /recipes, /community)는 브랜치 이름을 따라 임시로 정했다.
// - 피그마에는 "선택된 탭" 아이콘이 냉장고·레시피만 있어서, 지금은 active="fridge" | "recipe"만 지원한다.
//   다른 탭이 선택된 모양이 필요하면 해당 아이콘을 피그마에서 더 내려받아야 한다.
const TABS: { key: string; label: string; href: string; icon: IconName; activeIcon?: IconName }[] = [
  { key: "home", label: "홈", href: "/", icon: "nav-home" },
  { key: "fridge", label: "냉장고", href: "/fridge", icon: "nav-fridge", activeIcon: "nav-fridge-active" },
  { key: "price", label: "시세", href: "/prices", icon: "nav-price" },
  { key: "recipe", label: "레시피", href: "/recipes", icon: "nav-recipe", activeIcon: "nav-recipe-active" },
  { key: "community", label: "커뮤니티", href: "/community", icon: "nav-community" },
];

interface BottomTabBarProps {
  active: "fridge" | "recipe";
}

export function BottomTabBar({ active }: BottomTabBarProps) {
  return (
    <nav className="sticky bottom-0 z-10 flex h-[68px] shrink-0 items-center border border-slate-200 bg-white px-2.5">
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
