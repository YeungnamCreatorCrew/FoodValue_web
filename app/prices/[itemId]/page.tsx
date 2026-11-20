import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { PriceDetail } from "@/components/prices/price-detail";
import { getPrice, resolvePriceRoute } from "@/lib/prices/service";
import { PriceApiError } from "@/lib/prices/api";

const loadRoutePrice = cache(async (itemId: string) => {
  const id = await resolvePriceRoute(itemId);
  if (!id) notFound();
  const item = await getPrice(id).catch(error => {
    if (error instanceof PriceApiError && error.status === 404) notFound();
    throw error;
  });
  return { id, item };
});

export async function generateMetadata({ params }: PageProps<"/prices/[itemId]">) {
  const { item } = await loadRoutePrice((await params).itemId);
  return { title: `${item.name} 시세 | FoodValue` };
}

export default async function PriceDetailPage({ params }: PageProps<"/prices/[itemId]">) {
  const { itemId } = await params;
  const { id, item } = await loadRoutePrice(itemId);
  if (id !== itemId) redirect("/prices/" + id);
  return <PriceDetail item={item} />;
}
