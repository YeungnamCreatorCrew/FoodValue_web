import Image from "next/image";
import type { LivePrice } from "@/lib/prices/model";

/** 품목 사진. 어디서나 같은 정사각형·모서리이고, 보이는 크기에 맞는 사진만 받는다. 사진이 없으면 같은 크기의 자리표시. */
export function IngredientImage({ item, size = 56 }: { item: Pick<LivePrice, "name" | "image">; size?: number }) {
  const style = { "--thumb": `${size}px` } as React.CSSProperties;
  return <div className="ingredient-image" style={style}>
    {item.image ? <Image src={item.image} alt="" width={size} height={size} sizes={`${size}px`} />
      : <div className="ingredient-placeholder" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6" /></svg></div>}
  </div>;
}
