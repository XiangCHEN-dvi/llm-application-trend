import timeline from "../../src/data/timeline.json" with { type: "json" };

/** YYYY-MM — same as `timeline.json` startMonth (scripts use string keys). */
export const TIMELINE_START_MONTH = timeline.startMonth;

export function timelineEndMonthKey() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function timelineEndDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
}

export function timelineStartDate() {
  return new Date(`${timeline.startMonth}-01T00:00:00Z`);
}
