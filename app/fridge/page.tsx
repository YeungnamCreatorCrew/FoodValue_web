import type { Metadata } from "next";
import { FridgeListScreen } from "@/components/fridge/FridgeListScreen";

export const metadata: Metadata = {
  title: "내 냉장고 | FoodValue",
};

export default async function FridgePage({ searchParams }: PageProps<"/fridge">) {
  // 등록 화면에서 넘어오면 /fridge?added=재료id 가 붙는다
  const { added } = await searchParams;
  const addedId = typeof added === "string" && /^\d+$/.test(added) ? Number(added) : undefined;
  return <FridgeListScreen addedIdParam={addedId} />;
}
