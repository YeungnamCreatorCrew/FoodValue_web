import type { Metadata } from "next";
import localFont from "next/font/local";
import "./community.css";

const pretendard = localFont({ src: "../../public/fonts/PretendardVariable.woff2", display: "swap", weight: "45 920" });

export const metadata: Metadata = { title: "커뮤니티 | FoodValue", description: "레시피와 소분 모집, 오늘의 요리를 함께 나누는 FoodValue 커뮤니티" };

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${pretendard.className} cm-shell`} lang="ko">{children}</div>;
}
