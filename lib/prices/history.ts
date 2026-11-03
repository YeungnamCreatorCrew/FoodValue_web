// Date-only UTC arithmetic; never uses the current clock or host time zone.
import type { FactorHistoryPoint, FactorKey } from "./poc-types";

export const dateNumber = (date: string) => Date.parse(`${date}T00:00:00Z`);
export function historyForPeriod<T extends { date: string }>(history: readonly T[], baseDate: string, days: number): T[] {
  const end = dateNumber(baseDate);
  const start = end - (days - 1) * 86_400_000;
  return history.filter(point => dateNumber(point.date) >= start && dateNumber(point.date) <= end)
    .toSorted((a, b) => a.date.localeCompare(b.date, "en"));
}

/** Compare the same feature on exact dates; never substitute a nearby day. */
export function compareFactorWeek(history: readonly FactorHistoryPoint[], baseDate: string, key: FactorKey) {
  const previousDate = new Date(dateNumber(baseDate) - 7 * 86_400_000).toISOString().slice(0, 10);
  const current = history.find(point => point.date === baseDate)?.[key];
  const previous = history.find(point => point.date === previousDate)?.[key];
  if (current === undefined || previous === undefined || !Number.isFinite(current) || !Number.isFinite(previous)) return null;
  return { current, previous, previousDate, difference: current - previous };
}
