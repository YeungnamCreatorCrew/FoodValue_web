// 날짜 도구. 날짜는 "YYYY-MM-DD" 문자열로 주고받는다 (서버와 같은 형식).
// 시각이 아니라 "날짜"만 다루므로 브라우저(로컬) 시간 기준으로 계산한다.

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 연·월·일 숫자 → "2026-10-07" (month는 1~12) */
export function makeDateString(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parse(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function format(date: Date): string {
  return makeDateString(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function todayString(): string {
  return format(new Date());
}

/** 날짜에 days일을 더한다 (빼려면 음수) */
export function addDays(date: string, days: number): string {
  const result = parse(date);
  result.setDate(result.getDate() + days);
  return format(result);
}

/** "2026-10-01" → "2026. 10. 01" */
export function formatDotted(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}. ${month}. ${day}`;
}

/** 오늘 기준 상대 표현: 오늘, 어제, 3일 전 (30일이 넘으면 빈 글자) */
export function relativeDayLabel(date: string, today: string = todayString()): string {
  const diff = Math.round((parse(today).getTime() - parse(date).getTime()) / 86_400_000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  if (diff >= 2 && diff <= 30) return `${diff}일 전`;
  return "";
}
