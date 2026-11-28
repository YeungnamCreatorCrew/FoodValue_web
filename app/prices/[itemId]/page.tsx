import { notFound, redirect } from "next/navigation";
import { cache, Suspense } from "react";
import { PriceDetail } from "@/components/detail/price-detail";
import { DetailError } from "@/components/detail/detail-error";
import { PriceWhy } from "@/components/detail/price-why";
import { getPrice, getPriceHistory, getPriceIndicators, resolvePriceRoute } from "@/lib/prices/service";
import { PriceApiError } from "@/lib/prices/api";
import { parseTrack } from "@/lib/prices/track-meta";

/** 품목을 불러온다. 없으면 404, WAS 오류면 failed(던지지 않고 화면에서 다시 시도). notFound는 try 밖에서 부른다. */
const loadRoutePrice = cache(async (itemId: string) => {
  let id: string | null;
  try { id = await resolvePriceRoute(itemId); } catch { return { failed: true as const }; }
  if (!id) notFound();
  let missing = false;
  try {
    return { failed: false as const, id, item: await getPrice(id) };
  } catch (error) {
    if (error instanceof PriceApiError && error.status === 404) missing = true;
    else return { failed: true as const };
  }
  if (missing) notFound();
  return { failed: true as const };
});

export async function generateMetadata({ params }: PageProps<"/prices/[itemId]">) {
  const loaded = await loadRoutePrice((await params).itemId);
  return { title: loaded.failed ? "시세 | 食널" : `${loaded.item.name} 시세 | 食널` };
}

/** 지표도 서버에서 같이 불러 첫 화면에 결론이 바로 보이게 한다. 지표만 실패하면 화면에서 다시 시도한다. */
export default async function PriceDetailPage({ params, searchParams }: PageProps<"/prices/[itemId]">) {
  const { itemId } = await params;
  // ?model=struct면 구조식 예측도 서버에서 같이 불러 첫 화면부터 그 모델로 보인다. 실패하면 화면에서 다시 부른다.
  const track = parseTrack((await searchParams).model);
  const structPromise = track === "STRUCT" ? getPrice(itemId, undefined, "STRUCT").catch(() => null) : Promise.resolve(null);
  // 상세·지표·365일 이력을 함께 부른다. 이력은 기준 가격 4칸과 가격 흐름 그래프가 같이 쓴다(기간을 바꿔도 다시 부르지 않는다).
  const [loaded, indicators, yearHistory] = await Promise.all([loadRoutePrice(itemId), getPriceIndicators(itemId).catch(() => null), getPriceHistory(itemId, 365).catch(() => null)]);
  if (loaded.failed) return <DetailError />;
  if (loaded.id !== itemId) redirect("/prices/" + loaded.id + (track === "STRUCT" ? "?model=struct" : ""));
  const initialStruct = await structPromise;
  return <PriceDetail item={loaded.item} initialIndicators={indicators} yearHistory={yearHistory} initialTrack={track} initialStruct={initialStruct}
    supplyFactors={<Suspense fallback={null}><PriceWhy item={loaded.item} indicators={indicators} /></Suspense>} />;
}
