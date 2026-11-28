import type { Metadata } from "next";
import { AnalysisRoom, type OverviewItem } from "@/components/analysis/analysis-room";
import { getPrice, getPriceFactors, getPriceHistory, getPriceIndicators, listPrices } from "@/lib/prices/service";
import { EmptyState } from "@/components/fv/state";

export const metadata: Metadata = { title: "분석실 | FoodValue" };

/**
 * 분석실: 판단과 AI 예측이 어떤 값으로 어떻게 계산됐는지 펼쳐 보는 화면.
 * 지금 WAS API(목록·상세·지표·요인·365일 이력)만 쓰고, 나머지는 lib/analysis/compute.ts에서 다시 계산한다.
 */
export default async function AnalysisPage({ searchParams }: PageProps<"/analysis">) {
  const query = await searchParams;
  const page = await listPrices({ size: 50, sort: "name" }).catch(() => null);
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

  // 품목 한눈에 보기용 1년 이력은 품목마다 한 번씩 부른다. 고른 품목은 그 값을 같이 쓴다.
  const [histories, detail, indicators, factors] = await Promise.all([
    Promise.all(page.items.slice(0, 12).map(item => getPriceHistory(item.id, 365).catch(() => null))),
    getPrice(selected.id).catch(() => selected),
    getPriceIndicators(selected.id).catch(() => null),
    getPriceFactors(selected.id).catch(() => null),
  ]);
  const overview: OverviewItem[] = page.items.slice(0, 12).map((item, index) => ({ item, history: histories[index]?.priceHistory ?? [] }));
  const history = overview.find(row => row.item.id === selected.id)?.history ?? [];
  return <AnalysisRoom overview={overview} item={detail} indicators={indicators} factors={factors} history={history} />;
}
