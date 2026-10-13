import { PriceList } from "@/components/prices/price-list";
import Image from "next/image";
import { UnsupportedAction } from "@/components/prices/ui";
import { mockPricesSource } from "@/lib/prices/mock";
export default async function PricesPage() {
  const initial = await mockPricesSource.list({ category: "ALL", keyword: "", sort: "price-drop", page: 1, size: 12 });
  return <div className="flex min-w-0 flex-1 flex-col">
    <header className="flex h-14 shrink-0 items-center gap-3 bg-white px-5">
      <h1 className="flex-1 text-xl font-semibold leading-7 tracking-[-0.1px] text-primary">시세</h1>
      <UnsupportedAction label="알림" icon="img" size={20} />
      <span aria-label="FoodValue 프로필" className="relative flex size-8 items-center justify-center text-base">
        <Image src="/figma/prices/list-img1.svg" width={32} height={32} alt="" className="absolute inset-0" />
        <span className="relative">FV</span>
      </span>
    </header>
    <PriceList initial={initial} />
  </div>;
}
