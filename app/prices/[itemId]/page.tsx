import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceDetail } from "@/components/prices/price-detail";
import { FigmaIcon, UnsupportedAction } from "@/components/prices/ui";
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
  return <div className="bg-[#f7faf8]">
    <header className="flex h-14 items-center gap-3 bg-white px-4">
      <Link href="/prices" aria-label="시세 목록으로 돌아가기" className="flex size-[22px] items-center justify-center"><FigmaIcon name="img" detail size={22} /></Link>
      <p className="flex-1 text-sm font-semibold leading-5 text-[#17251f]">시세 상세</p>
      <div className="flex items-center gap-2.5">
        <UnsupportedAction label="관심 품목" icon="imgIconStarOff" detail size={22} />
        <UnsupportedAction label="공유" icon="imgIconShare2" detail size={22} />
      </div>
    </header>
    <PriceDetail item={{ ...item, history: chart.history, forecast: chart.forecast, regions }} />
  </div>;
}
