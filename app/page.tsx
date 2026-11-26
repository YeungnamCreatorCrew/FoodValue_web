import { Suspense } from "react";
import { PriceBoard } from "@/components/board/price-board";
import { LoadingRegion, Skeleton } from "@/components/fv/state";
import { listPrices } from "@/lib/prices/service";

/** 목록을 서버에서 불러 첫 화면에 바로 그린다. 느리면 바깥 Suspense가 같은 자리의 뼈대를 먼저 보여준다. 실패하면 화면에서 다시 시도한다. */
async function BoardWithData() {
  const initial = await listPrices({ size: 50, sort: "name" }).catch(() => null);
  return <PriceBoard initial={initial} />;
}

/** 홈 = 품목 표. 정렬·거르기는 주소(?sort, ?f, ?q, ?c, ?p)에 남아 뒤로 가기로 돌아와도 그대로다. */
export default function Home() {
  return <main id="main-content" className="fv-page board-page">
    <Suspense fallback={<LoadingRegion label="품목 시세를 불러오는 중이에요"><div className="board-skel"><Skeleton className="skel-head" /><Skeleton className="skel-chips" /><Skeleton className="skel-table" /></div></LoadingRegion>}>
      <BoardWithData />
    </Suspense>
  </main>;
}
