"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomTabBar } from "./BottomTabBar";
import { SideNav } from "./SideNav";

export function ServiceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // 인증 화면은 서비스 메뉴와 본문 폭/왼쪽 여백을 적용하지 않는다.
  if (pathname === "/auth" || pathname.startsWith("/auth/")) {
    return <div className="flex min-h-dvh flex-col">{children}</div>;
  }

  return (
    <div className="service-shell">
      <SideNav />
      <div className="lg:pl-[220px]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-slate-50 md:max-w-[720px] lg:max-w-[960px]">
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
          <BottomTabBar />
        </div>
      </div>
    </div>
  );
}
