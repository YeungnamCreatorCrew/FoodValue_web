import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "시세 | FoodValue", template: "%s | FoodValue" },
  description: "식자재 시세와 7일 가격 예측을 확인하세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
    >
      <body>{children}</body>
    </html>
  );
}
