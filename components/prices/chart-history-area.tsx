import { useId } from "react";

/** A faint fill beneath the existing history path; no prices are interpolated. */
export function ChartHistoryArea({ path, startX, endX, bottom }: {
  path: string; startX: number; endX: number; bottom: number;
}) {
  const id = useId();
  if (!path) return null;
  return <>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="var(--price-chart-color)" stopOpacity="0.10" />
      <stop offset="100%" stopColor="var(--price-chart-color)" stopOpacity="0.01" />
    </linearGradient></defs>
    <path d={`${path} L${endX},${bottom} L${startX},${bottom} Z`} fill={`url(#${id})`} aria-hidden="true" />
  </>;
}
