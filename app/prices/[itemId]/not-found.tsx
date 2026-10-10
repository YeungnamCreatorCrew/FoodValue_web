import Link from "next/link";
export default function NotFound() {
  return <main id="main-content" className="px-5 py-16 text-center"><h1 className="text-xl font-semibold">품목을 찾을 수 없습니다.</h1><p className="mt-2 text-sm text-muted">시세 목록에서 다른 품목을 선택해 주세요.</p><Link href="/prices" className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm text-white">시세 목록으로</Link></main>;
}
