import type { Metadata } from "next";
import { FridgeListScreen } from "@/components/fridge/FridgeListScreen";

export const metadata: Metadata = {
  title: "내 냉장고 | FoodValue",
};

export default async function FridgePage({ searchParams }: PageProps<"/fridge">) {
  // 등록 화면에서 넘어오면 /fridge?added=12 (영수증 등록은 /fridge?added=12,13,14)가 붙는다
  const { added } = await searchParams;
  const addedIds =
    typeof added === "string" && /^\d+(,\d+)*$/.test(added) ? added.split(",").map(Number) : undefined;
  return <FridgeListScreen addedIdsParam={addedIds} />;
}
