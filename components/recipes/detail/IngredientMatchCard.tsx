import type { RecipeIngredient } from "@/types/recipes";

interface IngredientMatchCardProps {
  ingredients: RecipeIngredient[];
}

/** 재료 & 냉장고 매칭: 보유 재료는 "필요 / 보유"로, 부족한 재료는 시세와 [빠른 구매]로 보여 준다 */
export function IngredientMatchCard({ ingredients }: IngredientMatchCardProps) {
  const owned = ingredients.filter((i) => i.owned);
  const missing = ingredients.filter((i) => !i.owned);

  return (
    <section className="flex shrink-0 flex-col gap-[3px] rounded-[10px] border border-slate-200 bg-white px-2 py-1.5">
      <div className="flex h-[22px] items-center justify-between whitespace-nowrap">
        <h3 className="text-[15px] font-bold leading-[22px] text-slate-900">재료 &amp; 냉장고 매칭</h3>
        <p className="text-[10px] leading-[14px] text-slate-500">
          {missing.length === 0
            ? "모두 보유 중"
            : `${ingredients.length}개 중 ${missing.length}개 부족`}
        </p>
      </div>

      {owned.map((ingredient) => (
        <div
          key={ingredient.name}
          className="flex min-h-[26px] items-center gap-2 border-b border-slate-100 px-2 py-1"
        >
          <p className="min-w-0 flex-1 truncate text-[11px] font-bold leading-[14px] text-slate-900">
            {ingredient.name}
          </p>
          <p className="w-[78px] shrink-0 text-[10px] leading-[14px] text-slate-500">필요 {ingredient.needText}</p>
          <p className="w-[78px] shrink-0 text-right text-[10px] font-semibold leading-[14px] text-primary">
            보유 {ingredient.ownedText}
          </p>
        </div>
      ))}

      {missing.map((ingredient) => (
        <div
          key={ingredient.name}
          className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1"
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-2 text-[11px] font-bold leading-[15px] whitespace-nowrap text-slate-900">
              <p className="min-w-0 truncate">
                {ingredient.name} · 필요 {ingredient.needText}
              </p>
              {ingredient.purchase && <p className="shrink-0">{ingredient.purchase.priceText}</p>}
            </div>
            {ingredient.purchase?.marketNote && (
              <p className="text-[9px] leading-[13px] text-emerald-700">{ingredient.purchase.marketNote}</p>
            )}
            {ingredient.purchase?.lowestPriceText && (
              <p className="text-[9px] leading-[13px] text-slate-500">{ingredient.purchase.lowestPriceText}</p>
            )}
          </div>
          {ingredient.purchase && (
            // [빠른 구매]는 네이버 쇼핑 최저가 페이지를 새 탭으로 연다
            <a
              href={ingredient.purchase.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[30px] w-[82px] shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover"
            >
              빠른 구매
            </a>
          )}
        </div>
      ))}
    </section>
  );
}
