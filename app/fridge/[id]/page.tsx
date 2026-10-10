import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FridgeItemDetailScreen } from "@/components/fridge/FridgeItemDetailScreen";

export const metadata: Metadata = {
  title: "재료 상세 | FoodValue",
};

export default async function FridgeItemPage({ params }: PageProps<"/fridge/[id]">) {
  const { id } = await params;
  // 주소가 /fridge/abc 처럼 숫자가 아니면 404 화면을 보여 준다
  if (!/^\d+$/.test(id)) notFound();
  return <FridgeItemDetailScreen id={Number(id)} />;
}
