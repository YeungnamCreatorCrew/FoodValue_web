"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePriceList } from "@/lib/prices/use-prices";

/** 상세 맨 위: 다른 품목으로 바로 이동. 8개 이하면 버튼, 많으면 고르는 상자. 목록을 못 받으면 홈 링크만 남긴다. */
export function ItemSwitcher({ currentId }: { currentId: string }) {
  const { data } = usePriceList({ size: 50, sort: "name" });
  const router = useRouter();
  const items = data?.items ?? [];
  return <nav aria-label="품목 바꾸기" className="switcher">
    <Link href="/" prefetch={false} className="fv-link switcher-home">‹ 전체 품목</Link>
    {items.length > 1 && items.length <= 8 && <ul className="switcher-list">
      {items.map(item => <li key={item.id}>
        <Link href={`/prices/${item.id}`} prefetch={false} className="switcher-item" aria-current={item.id === currentId ? "page" : undefined}>{item.name}</Link>
      </li>)}
    </ul>}
    {items.length > 8 && <label className="switcher-select"><span className="fv-cap">다른 품목</span>
      <select value={currentId} onChange={event => router.push(`/prices/${event.target.value}`)}>
        {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>}
  </nav>;
}
