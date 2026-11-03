import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceShell } from "@/components/common/ServiceShell";

const pretendard = localFont({ src: "./fonts/PretendardVariable.woff2", display: "swap", variable: "--font-pretendard", weight: "45 920" });

export const metadata: Metadata = {
  title: "FoodValue",
  description: "AI 식자재 시세 예측 및 구매 시점 지원 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ServiceShell>{children}</ServiceShell>
      </body>
    </html>
  );
}
