import timeline from "./timeline.json";

export const TIMELINE_START_MONTH = timeline.startMonth;

/** First day of the timeline (local calendar). */
export const TIMELINE_START = new Date(`${TIMELINE_START_MONTH}-01T00:00:00`);

/** First day of the calendar month before runtime (last row on the timeline). */
export function timelineEndMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

/** Last instant of that month (inclusive upper bound for comparisons). */
export function timelineEndExclusive(): Date {
  const end = timelineEndMonth();
  return new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function timelineStartMonthKey(): string {
  return TIMELINE_START_MONTH;
}

export function timelineEndMonthKey(): string {
  const d = timelineEndMonth();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
