import type { Metadata } from "next";
import { FridgeNewScreen } from "@/components/fridge/FridgeNewScreen";

export const metadata: Metadata = {
  title: "재료 등록 | FoodValue",
};

export default function FridgeNewPage() {
  return <FridgeNewScreen />;
}
