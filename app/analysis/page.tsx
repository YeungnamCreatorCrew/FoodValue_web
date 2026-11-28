import type { Metadata } from "next";
import { AnalysisRoom } from "@/components/analysis/analysis-room";
import { getPrice, getPriceFactors, getPriceHistories, getPriceIndicators, listPrices } from "@/lib/prices/service";
import { EmptyState } from "@/components/fv/state";

export const metadata: Metadata = { title: "분석실 | 食널" };

/**
 * 분석실: 판단과 AI 예측이 어떤 값으로 어떻게 계산됐는지 펼쳐 보는 화면.
 * 지금 WAS API(목록·상세·지표·요인·365일 이력)만 쓰고, 나머지는 lib/analysis/compute.ts에서 다시 계산한다.
 */
const PAGE_SIZE = 50; // WAS 목록 한 쪽 최대

/** 품목 고르기 검색이 모든 품목을 찾을 수 있게 목록을 끝까지 받는다(첫 쪽 뒤 나머지 쪽은 한꺼번에). 뒤쪽이 실패하면 받은 데까지만 쓴다. */
async function listAllPrices() {
  const first = await listPrices({ size: PAGE_SIZE, sort: "name" });
  const pages = Math.ceil(first.total / PAGE_SIZE);
  if (pages <= 1) return first;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) =>
    listPrices({ size: PAGE_SIZE, sort: "name", page: i + 2 }).then(page => page.items).catch(() => [])));
  return { ...first, items: [...first.items, ...rest.flat()] };
}

export default async function AnalysisPage({ searchParams }: PageProps<"/analysis">) {
  const query = await searchParams;
  const page = await listAllPrices().catch(() => null);
  if (!page) return <main id="main-content" className="fv-page analysis-page">
    <h1 className="fv-h1">분석실</h1>
    <EmptyState title="품목을 불러오지 못했어요">가격 서버에 연결하지 못했어요. 잠시 뒤 다시 열어 주세요.</EmptyState>
  </main>;
  const requested = typeof query.item === "string" ? query.item : null;
  const selected = page.items.find(item => item.id === requested) ?? page.items[0];
  if (!selected) return <main id="main-content" className="fv-page analysis-page">
    <h1 className="fv-h1">분석실</h1>
    <EmptyState title="품목이 없어요">시세를 제공하는 품목이 아직 없어요.</EmptyState>
  </main>;

  // 1년 이력은 고른 품목 하나만 받는다(품목 고르기는 검색이라 품목별 그래프가 없다). 실패하면 그래프·분포만 비고 나머지는 그대로 보여준다.
  const [history, detail, indicators, factors] = await Promise.all([
    getPriceHistories([selected.id], 365).then(map => map.get(selected.id) ?? []).catch(() => []),
    getPrice(selected.id).catch(() => selected),
    getPriceIndicators(selected.id).catch(() => null),
    getPriceFactors(selected.id).catch(() => null),
  ]);
  return <AnalysisRoom items={page.items} item={detail} indicators={indicators} factors={factors} history={history} />;
}
