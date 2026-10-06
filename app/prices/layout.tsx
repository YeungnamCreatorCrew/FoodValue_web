import { PriceNavigation } from "@/components/prices/ui";
export default function PricesLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-dvh w-full max-w-[390px] bg-white"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:z-50 focus:bg-white focus:p-2">본문 바로가기</a>{children}<PriceNavigation /></div>;
}
