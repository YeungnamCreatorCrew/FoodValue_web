import type { IconName } from "@/components/ui/Icon";

// 하단 탭바(모바일·태블릿)와 왼쪽 메뉴(PC)가 같이 쓰는 메뉴 목록.
// 피그마에는 "선택된 탭" 아이콘이 냉장고·레시피만 있어서 activeIcon은 그 둘만 있다.
export const TABS: { key: string; label: string; href: string; icon: IconName; activeIcon?: IconName }[] = [
  { key: "home", label: "홈", href: "/", icon: "nav-home" },
  { key: "fridge", label: "냉장고", href: "/fridge", icon: "nav-fridge", activeIcon: "nav-fridge-active" },
  { key: "price", label: "시세", href: "/prices", icon: "nav-price" },
  { key: "recipe", label: "레시피", href: "/recipes", icon: "nav-recipe", activeIcon: "nav-recipe-active" },
  { key: "community", label: "커뮤니티", href: "/community", icon: "nav-community" },
];

export function isTabActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
