import type { LivePrice } from "@/lib/prices/model";
import { PriceChart } from "./price-chart";

export function RecentPriceChart({ item }: { item: LivePrice }) {
  return <div className="recent-price-chart"><PriceChart item={item} /></div>;
}
