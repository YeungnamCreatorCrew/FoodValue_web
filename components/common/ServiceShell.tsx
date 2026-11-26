"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FvIcon, LogoMark } from "@/components/fv/icons";
import { isTabActive, TABS } from "./tabs";
import { HelpDrawer } from "./help-drawer";

const TAB_ICON = { home: "home", about: "info" } as const;

/** 홈·상세·판단 방식의 틀: 위 헤더(메뉴 + 지표 읽는 법) + 모바일 하단 탭 2개. 범위 밖 화면(로그인 등)은 예전 틀을 그대로 쓴다. */
export function ServiceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const priceArea = pathname === "/" || pathname === "/about" || pathname === "/prices" || pathname.startsWith("/prices/");
  if (!priceArea) {
    return <div className="service-shell flex min-h-dvh flex-col"><div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col bg-slate-50 md:max-w-[720px] lg:max-w-[960px]">{children}</div></div>;
  }
  return <div className="fv-shell">
    <a href="#main-content" className="fv-skip">본문 바로가기</a>
    <header className="fv-header">
      <div className="fv-header-inner">
        <Link href="/" className="fv-logo" aria-label="FoodValue 홈"><LogoMark />FoodValue</Link>
        <nav aria-label="주 메뉴" className="fv-nav">
          {TABS.map(tab => <Link key={tab.key} href={tab.href} prefetch={false} aria-current={isTabActive(pathname, tab.href) ? "page" : undefined}>{tab.label}</Link>)}
        </nav>
        <div className="fv-header-tools"><HelpDrawer /></div>
      </div>
    </header>
    {children}
    <nav aria-label="하단 메뉴" className="fv-tabbar">
      {TABS.map(tab => <Link key={tab.key} href={tab.href} prefetch={false} aria-current={isTabActive(pathname, tab.href) ? "page" : undefined}>
        <FvIcon name={TAB_ICON[tab.key as keyof typeof TAB_ICON] ?? "home"} size={22} />{tab.label}
      </Link>)}
    </nav>
  </div>;
}
