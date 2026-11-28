/** 화면 글자색(currentColor)을 따르는 선 아이콘. 장식이라 화면 낭독기에는 숨긴다. */
const PATHS = {
  home: ["M3 10.5 12 3l9 7.5", "M5 9.5V21h14V9.5", "M10 21v-6h4v6"],
  news: ["M5 3h14v18H5z", "M8 7h8", "M8 11h8", "M8 15h5"],
  chart: ["M3 3v18h18", "m7 15 4-4 3 3 5-6"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z", "m20 20-4-4"],
  info: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 11v5", "M12 7.5v.01"],
  back: ["M15 18l-6-6 6-6"],
  next: ["m9 18 6-6-6-6"],
  refresh: ["M21 12a9 9 0 1 1-2.64-6.36", "M21 4v5h-5"],
  help: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4", "M12 17.5v.01"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3 2"],
} as const;

export type FvIconName = keyof typeof PATHS;

export function FvIcon({ name, size = 20, strokeWidth = 2 }: { name: FvIconName; size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {PATHS[name].map(d => <path key={d} d={d} />)}
  </svg>;
}

/** 로고 마크: 초록 사각형 위 가격 선 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <rect width="32" height="32" rx="8" fill="var(--fv-brand)" />
    <path d="m7 21 6-6 4 4 8-8" fill="none" stroke="var(--fv-on-brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
