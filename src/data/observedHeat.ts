import type { HeatSeriesFile } from "../types";
import { TIMELINE_START } from "./timelineBounds";
import heatData from "./heat-series.json";

const file = heatData as HeatSeriesFile;

const scoreByConceptMonth = new Map<string, Map<string, number>>();

for (const [id, entry] of Object.entries(file.series ?? {})) {
  const byMonth = new Map<string, number>();
  for (const p of entry.points) byMonth.set(p.month, p.score);
  scoreByConceptMonth.set(id, byMonth);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Composite score for concept at month from heat-series.json */
export function observedScoreAt(conceptId: string, month: Date): number | null {
  const v = scoreByConceptMonth.get(conceptId)?.get(monthKey(month));
  return v == null ? null : v;
}

/** First month with positive score */
export function firstScoreMonth(conceptId: string): Date {
  const points = file.series?.[conceptId]?.points;
  if (!points?.length) return TIMELINE_START;
  for (const p of points) {
    if (p.score > 0) return parseMonthKey(p.month);
  }
  return TIMELINE_START;
}

/**
 * Heat-weighted center of time: Σ(month × score) / Σ(score).
 * Tiebreaker for left→right order after firstScoreMonth.
 */
export function heatCentroidMonth(conceptId: string): Date {
  const points = file.series?.[conceptId]?.points;
  if (!points?.length) return TIMELINE_START;

  let weighted = 0;
  let total = 0;
  for (const p of points) {
    const s = p.score ?? 0;
    if (s <= 0) continue;
    const t = parseMonthKey(p.month).getTime();
    weighted += t * s;
    total += s;
  }
  if (total <= 0) return firstScoreMonth(conceptId);
  return new Date(weighted / total);
}

function parseMonthKey(ym: string): Date {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1);
}
