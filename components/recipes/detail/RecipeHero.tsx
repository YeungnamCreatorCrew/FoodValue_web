import { Icon } from "@/components/ui/Icon";
import type { RecipeDetail } from "@/types/recipes";

interface RecipeHeroProps {
  recipe: Pick<RecipeDetail, "title" | "description" | "minutes" | "difficulty" | "servings">;
}

const CHIP = "flex h-5 items-center rounded-full bg-slate-100 px-[7px] text-[10px] font-bold leading-[14px] whitespace-nowrap text-slate-600";

/** 대표 정보: 사진 자리, "AI 맞춤 레시피" 배지, 이름, 시간·난이도·인분, 한 줄 설명 */
export function RecipeHero({ recipe }: RecipeHeroProps) {
  return (
    <section className="flex shrink-0 gap-2.5">
      <div className="flex h-[120px] w-[126px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-100">
        <Icon name="image-off" size={20} />
        <p className="text-[10px] leading-[14px] whitespace-nowrap text-slate-400">대표 이미지</p>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-[7px]">
        <span className="flex h-5 items-center rounded-full bg-emerald-50 px-[7px] text-[10px] font-bold leading-[14px] whitespace-nowrap text-primary">
          AI 맞춤 레시피
        </span>
        <h2 className="text-lg font-bold leading-6 text-slate-900">{recipe.title}</h2>
        <div className="flex flex-wrap gap-[5px]">
          <span className={CHIP}>{recipe.minutes}분</span>
          <span className={CHIP}>난이도 {recipe.difficulty}</span>
          <span className={CHIP}>{recipe.servings}인분</span>
        </div>
        <p className="text-[10px] leading-[14px] text-slate-500">{recipe.description}</p>
      </div>
    </section>
  );
}
