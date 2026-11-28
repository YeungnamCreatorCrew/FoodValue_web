"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FvIcon, LogoMark } from "@/components/fv/icons";
import { isTabActive, TABS } from "./tabs";
import { HelpDrawer } from "./help-drawer";

export function ServiceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // 판단 방식(/about)은 탭에서 뺐지만 도움말의 '전체 보기'로 여는 같은 서비스 화면이다.
  const serviceArea = TABS.some(tab => isTabActive(pathname, tab.href)) || pathname === "/about";
  if (!serviceArea) {
    return <div className="service-shell flex min-h-dvh flex-col"><div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col bg-slate-50 md:max-w-[720px] lg:max-w-[960px]">{children}</div></div>;
  }
  return <div className="fv-shell">
    <a href="#main-content" className="fv-skip">본문 바로가기</a>
    <header className="fv-header">
      <div className="fv-header-inner">
        <Link href="/" className="fv-logo" aria-label="FoodValue 홈"><LogoMark />FoodValue</Link>
        <nav aria-label="주 메뉴" className="fv-nav">
          {TABS.map(tab => <Link key={tab.href} href={tab.href} prefetch={false} aria-current={isTabActive(pathname, tab.href) ? "page" : undefined}>{tab.label}</Link>)}
        </nav>
        <div className="fv-header-tools"><HelpDrawer /></div>
      </div>
    </header>
    {children}
    <nav aria-label="하단 메뉴" className="fv-tabbar">
      {TABS.map(tab => <Link key={tab.href} href={tab.href} prefetch={false} aria-current={isTabActive(pathname, tab.href) ? "page" : undefined}>
        <FvIcon name={tab.icon} size={22} />{tab.label}
      </Link>)}
    </nav>
  </div>;
}
