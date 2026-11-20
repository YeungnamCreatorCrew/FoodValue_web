import type { LivePrice } from "@/lib/prices/model";
import { priceNotices } from "@/lib/prices/status";

export function PriceNotices({ item, className = "" }: { item: LivePrice; className?: string }) {
  const notices = priceNotices(item);
  if (!notices.length) return null;
  return <ul className={`flex flex-col gap-1 text-xs text-muted ${className}`} aria-label="데이터 상태 안내">
    {notices.map(notice => <li key={notice}><span aria-hidden="true">ⓘ </span>{notice}</li>)}
  </ul>;
}
