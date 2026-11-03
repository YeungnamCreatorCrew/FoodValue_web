"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { popularIngredients } from "@/lib/home/price-focused-mock";
import { Icon } from "@/components/ui/Icon";

export function HomeSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const search = (value: string) => router.push(value.trim() ? `/prices?q=${encodeURIComponent(value.trim())}` : "/prices");
  return <div className="home-search-area">
    <form role="search" className="home-search" onSubmit={event => { event.preventDefault(); search(keyword); }}>
      <Icon name="search" size={21} />
      <label htmlFor="home-search" className="sr-only">찾고 싶은 식재료</label>
      <input id="home-search" type="search" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="찾고 싶은 식재료를 검색해보세요. (예: 대파, 양파, 토마토)" />
      <button type="submit">검색</button>
    </form>

  </div>;
}

export function PopularIngredientChips() {
  const router = useRouter();
  const search = (name: string) => router.push(`/prices?q=${encodeURIComponent(name)}`);
  return <div className="popular-ingredients"><p><span aria-hidden="true">🔥</span> 많이 찾는 식재료</p><div className="popular-chips" aria-label="많이 찾는 식재료">{popularIngredients.map(name => <button type="button" key={name} onClick={() => search(name)}>{name}</button>)}</div></div>;
}
