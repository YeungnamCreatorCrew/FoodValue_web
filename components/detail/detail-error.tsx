"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ErrorState, LoadingRegion, Skeleton } from "@/components/fv/state";

/** 서버에서 시세를 못 불러왔을 때. 다시 시도는 화면을 서버에서 새로 그린다(브라우저가 WAS를 직접 부르지 않아 콘솔 오류가 없다). */
export function DetailError() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <main id="main-content" className="fv-page detail-page">
    <Link href="/" prefetch={false} className="fv-link">‹ 전체 품목</Link>
    <h1 className="fv-h1">품목 시세</h1>
    {pending ? <LoadingRegion label="다시 불러오는 중이에요"><Skeleton className="loading-summary" /></LoadingRegion>
      : <ErrorState message="" onRetry={() => start(() => router.refresh())} />}
  </main>;
}
