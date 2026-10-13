import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceShell } from "@/components/common/ServiceShell";

const pretendard = localFont({ src: "./fonts/PretendardVariable.woff2", display: "swap", variable: "--font-pretendard", weight: "45 920" });

export const metadata: Metadata = {
  title: "FoodValue",
  description: "1~2인 가구를 위한 식자재 관리 서비스",
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
