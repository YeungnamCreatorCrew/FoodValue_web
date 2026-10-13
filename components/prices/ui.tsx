import Image from "next/image";
import { recommendationLabel } from "@/lib/prices/format";
import type { Category, PriceItem } from "@/lib/prices/types";

export const categoryLabels: Record<Category, string> = {
  VEGETABLE: "채소",
  GRAIN: "식량작물",
  FRUIT: "과일",
  MEAT: "축산",
  SEAFOOD: "수산",
  ETC: "기타",
};

export function FigmaIcon({
  name,
  size = 20,
  detail = false,
}: {
  name: string;
  size?: number;
  detail?: boolean;
}) {
  return (
    <Image
      src={`/figma/prices/${detail ? "detail" : "list"}-${name}.svg`}
      width={size}
      height={size}
      alt=""
      className="shrink-0"
    />
  );
}

export function PriceChange({ rate }: { rate: number }) {
  return (
    <span
      className={`whitespace-nowrap text-xs font-medium ${
        rate > 0
          ? "text-red-600"
          : rate < 0
            ? "text-blue-600"
            : "text-muted"
      }`}
    >
      {rate > 0 ? "▲" : rate < 0 ? "▼" : "—"} {Math.abs(rate).toFixed(1)}%
    </span>
  );
}

export function RecommendationBadge({ item }: { item: PriceItem }) {
  const tones = {
    BUY_NOW: "bg-emerald-50 text-emerald-700",
    BUY_LATER: "bg-blue-50 text-blue-700",
    HOLD: "bg-amber-50 text-amber-700",
    STABLE: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex h-6 w-[86px] shrink-0 items-center justify-center rounded-[10px] text-[10px] font-medium whitespace-nowrap ${tones[item.recommendation]}`}
    >
      {recommendationLabel(item)}
    </span>
  );
}

// Preserve the requested Figma slot without simulating unsupported operations.
export function UnsupportedAction({
  label,
  icon,
  size,
  detail = false,
  className = "",
}: {
  label: string;
  icon: string;
  size: number;
  detail?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled
      aria-label={`${label} (현재 미지원)`}
      title={`${label}: 현재 ERD/API에서 지원하지 않습니다`}
      className={`flex shrink-0 items-center justify-center ${className}`}
    >
      <FigmaIcon name={icon} size={size} detail={detail} />
    </button>
  );
}

export function SampleNotice({ date }: { date?: string }) {
  return (
    <p className="text-center text-[10px] leading-4 text-slate-400">
      샘플 시세 · AI 예측은 참고용
      {date ? ` · 기준일 ${date}` : ""}
    </p>
  );
}

export function SectionTitle({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <FigmaIcon name={icon} detail size={18} />
        <h2 className="flex-1 text-lg font-semibold leading-6 tracking-[-0.18px]">
          {title}
        </h2>
        {children}
      </div>

      {description && (
        <p className="mt-1 text-sm leading-5 text-[#607068]">{description}</p>
      )}
    </div>
  );
}
