import type { Metadata } from "next";
<<<<<<< HEAD
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "FoodValue", template: "%s | FoodValue" },
  description: "매일의 식생활에 가치를 더하는 FoodValue",
=======
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodValue",
  description: "1~2인 가구를 위한 식자재 관리 서비스",
>>>>>>> dev
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
<<<<<<< HEAD
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
=======
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* Pretendard 폰트 (CDN) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full">
        {/* 화면 폭: 가운데 최대 430px 고정 (임시 결정 — 팀 확정 시 수정) */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-slate-50">
          {children}
        </div>
      </body>
>>>>>>> dev
    </html>
  );
}
