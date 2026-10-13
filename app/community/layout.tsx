import type { Metadata } from "next";
import "./community.css";

export const metadata: Metadata = { title: "커뮤니티 | FoodValue", description: "레시피와 소분 모집, 오늘의 요리를 함께 나누는 FoodValue 커뮤니티" };

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <div className="cm-shell" lang="ko">{children}</div>;
}
