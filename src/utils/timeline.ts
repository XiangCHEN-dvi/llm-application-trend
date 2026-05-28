import {
  TIMELINE_START,
  timelineEndExclusive,
} from "../data/timelineBounds";

export function parseDate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

export function dateToPercent(date: Date): number {
  const start = TIMELINE_START.getTime();
  const end = timelineEndExclusive().getTime();
  const t = date.getTime();
  return Math.max(0, Math.min(100, ((t - start) / (end - start)) * 100));
}

/** Whether a calendar month lies on the shared timeline grid */
export function isOnTimeline(month: Date): boolean {
  const t = month.getTime();
  return (
    t >= TIMELINE_START.getTime() && t <= timelineEndExclusive().getTime()
  );
}

export function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
