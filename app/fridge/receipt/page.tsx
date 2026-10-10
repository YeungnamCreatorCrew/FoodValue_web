import type { Metadata } from "next";
import { FridgeReceiptScreen } from "@/components/fridge/receipt/FridgeReceiptScreen";

export const metadata: Metadata = {
  title: "영수증으로 등록 | FoodValue",
};

export default function FridgeReceiptPage() {
  return <FridgeReceiptScreen />;
}
