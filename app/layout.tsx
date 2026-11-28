import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceShell } from "@/components/common/ServiceShell";
import { SplashScreen } from "@/components/common/SplashScreen";

const pretendard = localFont({ src: "./fonts/PretendardVariable.woff2", display: "swap", variable: "--font-pretendard", weight: "45 920" });

const SPLASH_GATE = `try{if(sessionStorage.getItem("siknal-brush-splash-seen-v3"))document.documentElement.dataset.splash="off"}catch(e){}`;

export const metadata: Metadata = {
  title: "食널",
  description: "농산물 소매가를 지난 가격 지표로 판단하고, AI 7일 예측은 참고로 보여주는 시세 서비스",
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
