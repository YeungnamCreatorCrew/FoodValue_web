import Link from "next/link";
import { EmptyState } from "@/components/fv/state";

export default function NotFound() {
  return <main id="main-content" className="fv-page">
    <h1 className="fv-h1">품목을 찾을 수 없어요</h1>
    <EmptyState title="품목 없음" action={<Link href="/" className="fv-btn">전체 품목 보기</Link>}>주소가 바뀌었거나 시세를 제공하지 않는 품목이에요.</EmptyState>
  </main>;
}
