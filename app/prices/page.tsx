import { PriceList } from "@/components/prices/price-list";
export default async function PricesPage({ searchParams }: PageProps<"/prices">) {
  const query = await searchParams;
  const keyword = typeof query.q === "string" ? query.q.trim() : "";
  return <PriceList key={keyword} initialKeyword={keyword} />;
}
