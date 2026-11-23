import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import type { LivePrice } from "@/lib/prices/model";

/** 품목 사진. 사진이 없으면 이름이 적힌 자리표시를 그린다. */
export function IngredientImage({ item }: { item: LivePrice }) {
  return <div className="ingredient-image">{item.image ? <Image src={item.image} alt="" width={240} height={240} className="h-full w-full rounded-[10px] object-cover" /> : <div className="ingredient-placeholder"><Icon name="image-off" size={24} /><span>{item.name}</span></div>}</div>;
}
