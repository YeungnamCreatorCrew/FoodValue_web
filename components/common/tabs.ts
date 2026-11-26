import type { IconName } from "@/components/ui/Icon";

export const TABS: { key: string; label: string; href: string; icon: IconName; activeIcon?: IconName }[] = [
  { key: "home", label: "홈", href: "/", icon: "nav-home" },
  { key: "price", label: "시세", href: "/prices", icon: "nav-price" },
];

export function isTabActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
