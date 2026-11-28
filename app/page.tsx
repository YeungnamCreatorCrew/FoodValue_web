import { Suspense } from "react";
import { MarketHome } from "@/components/home/market-home";
import { LoadingRegion, Skeleton } from "@/components/fv/state";
import { listPrices } from "@/lib/prices/service";
import { redirect } from "next/navigation";

/** 목록을 서버에서 불러 첫 화면에 바로 그린다. 느리면 바깥 Suspense가 같은 자리의 뼈대를 먼저 보여준다. 실패하면 화면에서 다시 시도한다. */
async function HomeWithData() {
  const initial = await listPrices({ size: 50, sort: "name" }).catch(() => null);
  return <MarketHome data={initial} />;
}

/** 기존 홈 표의 검색·정렬 북마크는 전체 시세로 연결한다. */
export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  if (["sort", "f", "q", "c", "p"].some(key => params[key] !== undefined)) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) for (const entry of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, entry);
    redirect(`/prices?${query}`);
  }
  return <main id="main-content" className="fv-page market-home-page">
    <Suspense fallback={<LoadingRegion label="품목 시세를 불러오는 중이에요"><div className="board-skel"><Skeleton className="skel-head" /><Skeleton className="skel-chips" /><Skeleton className="skel-table" /></div></LoadingRegion>}>
      <HomeWithData />
    </Suspense>
  </main>;
}
