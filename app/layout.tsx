import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceShell } from "@/components/common/ServiceShell";
import { SplashScreen } from "@/components/common/SplashScreen";

const pretendard = localFont({ src: "./fonts/PretendardVariable.woff2", display: "swap", variable: "--font-pretendard", weight: "45 920" });

const SPLASH_GATE = `try{if(sessionStorage.getItem("fv-splash-seen"))document.documentElement.dataset.splash="off"}catch(e){}`;

export const metadata: Metadata = {
  title: "FoodValue",
  description: "AI 식자재 시세 예측 및 구매 시점 지원 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* 이번 탭에서 시작 화면을 이미 봤으면 그리기 전에 숨겨 깜빡임을 막는다 */}
        <script dangerouslySetInnerHTML={{ __html: SPLASH_GATE }} />
      </head>
      <body className="min-h-full">
        <SplashScreen />
        <ServiceShell>{children}</ServiceShell>
      </body>
    </html>
  );
}
