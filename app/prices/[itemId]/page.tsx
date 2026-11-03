import { notFound, redirect } from "next/navigation";
import { PriceDetail } from "@/components/prices/price-detail";
import { findPrice } from "@/lib/prices/catalog";

export async function generateMetadata({ params }: PageProps<"/prices/[itemId]">) {
  const { itemId } = await params;
  const item = findPrice(itemId);
  return { title: item ? `${item.name} 시세 | FoodValue` : "품목을 찾을 수 없습니다" };
}
export default async function PriceDetailPage({ params }: PageProps<"/prices/[itemId]">) {
  const { itemId } = await params;
  const item = findPrice(itemId);
  if (!item) notFound();
  // Preserve existing numeric green-onion links without showing obsolete fixtures.
  if (itemId === "1") redirect(`/prices/${item.id}`);
  return <PriceDetail item={item} />;
}
