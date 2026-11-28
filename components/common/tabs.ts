import type { FvIconName } from "@/components/fv/icons";

export const TABS: { label: string; href: string; icon: FvIconName }[] = [
  { label: "홈", href: "/", icon: "home" },
  { label: "전체 시세", href: "/prices", icon: "search" },
  { label: "주요 뉴스", href: "/news", icon: "news" },
  { label: "분석실", href: "/analysis", icon: "chart" },
];

/** 품목 상세에서도 전체 시세 메뉴를 켠다. */
export function isTabActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
