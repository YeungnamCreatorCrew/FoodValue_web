import type { IconName } from "@/components/ui/Icon";

export const TABS: { key: string; label: string; href: string; icon: IconName; activeIcon?: IconName }[] = [
  { key: "home", label: "홈", href: "/", icon: "nav-home" },
  { key: "about", label: "판단 방식", href: "/about", icon: "nav-price" },
];

/** 품목 상세(/prices/…)는 홈에서 들어가는 화면이라 홈 메뉴를 켠다. */
export function isTabActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/prices");
  return pathname === href || pathname.startsWith(`${href}/`);
}
