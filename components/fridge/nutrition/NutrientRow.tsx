import type { NutrientView, Tone } from "@/lib/fridge/nutrition";

const BAR_COLOR: Record<Tone, string> = {
  good: "bg-primary",
  low: "bg-slate-400",
  over: "bg-red-500",
  unknown: "bg-transparent",
};
const LABEL_COLOR: Record<Tone, string> = {
  good: "text-primary",
  low: "text-slate-500",
  over: "text-red-600",
  unknown: "text-slate-500",
};

interface NutrientRowProps {
  view: NutrientView;
}

/** 영양소 한 줄: 이름 / "65% · 210g / 324g" + 상태(충분·부족 …) / 막대 */
export function NutrientRow({ view }: NutrientRowProps) {
  return (
    <div className="flex min-h-[38px] items-center gap-2 py-0.5">
      <p className="w-[62px] shrink-0 text-sm font-medium leading-6 whitespace-nowrap text-slate-700">
        {view.label}
      </p>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2 text-xs font-medium leading-5 whitespace-nowrap">
          <span className="text-slate-700">
            {/* 판단 불가면 일부 재료만 합친 값이라 보여 주지 않는다 */}
            {view.percent === null ? "정보 부족" : `${view.percent}% · ${view.amountText}`}
          </span>
          <span className={LABEL_COLOR[view.tone]}>{view.statusLabel}</span>
        </div>
        <div
          role="progressbar"
          aria-label={`${view.label} 기준치 대비`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={view.percent === null ? undefined : Math.min(view.percent, 100)}
          className="h-[7px] overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={`h-full rounded-full ${BAR_COLOR[view.tone]}`}
            style={{ width: `${view.barRatio * 100}%` }}
          />
        </div>
        {view.note && <p className="text-xs leading-5 text-slate-500">{view.note}</p>}
      </div>
    </div>
  );
}
