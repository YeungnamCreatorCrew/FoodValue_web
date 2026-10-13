import { notFound } from "next/navigation";
import { PriceDetail } from "@/components/prices/price-detail";
import { UnsupportedAction } from "@/components/prices/ui";
import { BackHeader } from "@/components/common/BackHeader";
import { mockPricesSource } from "@/lib/prices/mock";

export async function generateMetadata({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const item = await mockPricesSource.detail(Number(itemId));
  return { title: item ? `${item.name} 시세` : "품목을 찾을 수 없습니다" };
}
export default async function PriceDetailPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  if (!/^\d+$/.test(itemId)) notFound();
  const id = Number(itemId);
  const item = await mockPricesSource.detail(id);
  if (!item) notFound();
  const [chart, regions] = await Promise.all([
    mockPricesSource.chart(id, 90), mockPricesSource.regions(id),
  ]);
  return <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
    <BackHeader title="시세 상세" backHref="/prices" right={<div className="flex items-center gap-2.5">
        <UnsupportedAction label="관심 품목" icon="imgIconStarOff" detail size={22} />
        <UnsupportedAction label="공유" icon="imgIconShare2" detail size={22} />
      </div>} />
    <PriceDetail item={{ ...item, history: chart.history, forecast: chart.forecast, regions }} />
  </div>;
}
