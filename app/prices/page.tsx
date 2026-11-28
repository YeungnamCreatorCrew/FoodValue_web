import { Suspense } from "react";
import type { Metadata } from "next";
import { PriceBoard } from "@/components/board/price-board";
import { LoadingRegion, Skeleton } from "@/components/fv/state";
import { listPrices } from "@/lib/prices/service";

export const metadata: Metadata = { title: "전체 시세 | 食널" };

async function BoardWithData() {
  const initial = await listPrices({ size: 50, sort: "name" }).catch(() => null);
  return <PriceBoard initial={initial} />;
}

export default function PricesPage() {
  return <main id="main-content" className="fv-page board-page">
    <Suspense fallback={<LoadingRegion label="품목 시세를 불러오는 중이에요"><div className="board-skel"><Skeleton className="skel-head" /><Skeleton className="skel-chips" /><Skeleton className="skel-table" /></div></LoadingRegion>}><BoardWithData /></Suspense>
  </main>;
}
