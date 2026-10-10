import { Icon } from "@/components/ui/Icon";
import type { RecipeNutrition } from "@/types/recipes";

interface NutritionCardProps {
  nutrition: RecipeNutrition;
}

// 성인 1일 영양성분 기준치(백엔드 가이드): 단백질 55g, 나트륨 2000mg
const PROTEIN_REFERENCE_G = 55;
// [확인 필요] 나트륨 경고를 띄우는 기준. 피그마에 기준이 없어서 1일 기준치의 절반 이상일 때로 임시로 정했다.
const SODIUM_WARNING_MG = 1000;

/** 영양 정보 요약 (1인분 기준): 칼로리, 단백질, 탄수화물 + 나트륨 안내 */
export function NutritionCard({ nutrition }: NutritionCardProps) {
  const proteinPercent = Math.round((nutrition.proteinG / PROTEIN_REFERENCE_G) * 100);

  return (
    <section className="flex shrink-0 flex-col gap-1 rounded-[10px] border border-slate-200 bg-white px-2.5 py-1.5">
      <div className="flex h-[22px] items-center justify-between whitespace-nowrap">
        <h3 className="text-[15px] font-bold leading-[22px] text-slate-900">영양 정보 요약</h3>
        <p className="text-[10px] leading-[14px] text-slate-500">1인분 기준</p>
      </div>
      <div className="flex h-[38px] gap-1.5 whitespace-nowrap">
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-md bg-slate-50">
          <p className="text-[9px] leading-3 text-slate-500">칼로리</p>
          <p className="text-[13px] font-bold leading-[17px] text-slate-900">{nutrition.calories}kcal</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-md bg-emerald-50 text-primary">
          <p className="text-[9px] leading-3">단백질 · {proteinPercent}%</p>
          <p className="text-[13px] font-bold leading-[17px]">{nutrition.proteinG}g</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-md bg-slate-50">
          <p className="text-[9px] leading-3 text-slate-500">탄수화물</p>
          <p className="text-[13px] font-bold leading-[17px] text-slate-900">{nutrition.carbohydrateG}g</p>
        </div>
      </div>
      {nutrition.sodiumMg >= SODIUM_WARNING_MG && (
        <div className="flex min-h-6 items-center gap-[5px] rounded-md bg-amber-50 px-2 py-1">
          <Icon name="alert-triangle" size={14} className="shrink-0" />
          <p className="min-w-0 flex-1 text-[9px] leading-[13px] text-amber-700">
            나트륨 수치가 높은 편이에요 · 간을 싱겁게 조절해 보세요
          </p>
        </div>
      )}
    </section>
  );
}
