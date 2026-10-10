import type { Metadata } from "next";
import "./globals.css";
import { SideNav } from "@/components/common/SideNav";

export const metadata: Metadata = {
  title: "FoodValue",
  description: "1~2인 가구를 위한 식자재 관리 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* Pretendard 폰트 (CDN) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full">
        {/* 반응형 (임시 결정 — 팀 확정 시 수정)
            폰: 최대 430px 한 줄 / 태블릿(md): 720px / PC(lg): 왼쪽 메뉴 220px + 본문 최대 960px */}
        <SideNav />
        <div className="lg:pl-[220px]">
          <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-slate-50 md:max-w-[720px] lg:max-w-[960px]">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
