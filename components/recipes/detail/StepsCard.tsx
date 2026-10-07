import { Icon } from "@/components/ui/Icon";
import type { RecipeStep } from "@/types/recipes";

interface StepsCardProps {
  steps: RecipeStep[];
  totalMinutes: number;
}

/** 단계별 조리 가이드: 번호, 제목, 걸리는 시간, 설명 */
export function StepsCard({ steps, totalMinutes }: StepsCardProps) {
  return (
    <section className="flex shrink-0 flex-col gap-[5px]">
      <div className="flex h-[22px] items-center justify-between whitespace-nowrap">
        <h3 className="text-[15px] font-bold leading-[22px] text-slate-900">단계별 조리 가이드</h3>
        <p className="text-[10px] leading-[14px] text-slate-500">총 {totalMinutes}분</p>
      </div>
      {steps.map((step, index) => (
        <div
          key={index}
          className="flex min-h-14 items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold leading-[14px] text-white">
            {index + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <div className="flex items-start justify-between gap-2 whitespace-nowrap">
              <p className="min-w-0 truncate text-[11px] font-bold leading-[15px] text-slate-900">{step.title}</p>
              <p className="shrink-0 text-[9px] leading-[13px] text-slate-500">약 {step.minutes}분</p>
            </div>
            <p className="text-[9px] leading-[13px] text-slate-600">{step.description}</p>
          </div>
          <div className="flex h-11 w-[52px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
            <Icon name="image-off" size={20} />
          </div>
        </div>
      ))}
    </section>
  );
}
