import type { FvIconName } from "@/components/fv/icons";

export const TABS: { label: string; href: string; icon: FvIconName }[] = [
  { label: "홈", href: "/", icon: "home" },
  { label: "분석실", href: "/analysis", icon: "chart" },
  { label: "주요 뉴스", href: "/news", icon: "news" },
];

/** 품목 상세(/prices/…)는 홈에서 들어가는 화면이라 홈 메뉴를 켠다. */
export function isTabActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "/prices" || pathname.startsWith("/prices/");
  return pathname === href || pathname.startsWith(`${href}/`);
}
