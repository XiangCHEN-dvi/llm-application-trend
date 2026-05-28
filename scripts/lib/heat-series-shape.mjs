/** @param {{ points?: { month: string, score: number }[] } | null | undefined} entry */
export function conceptPoints(entry) {
  return entry?.points ?? [];
}

/** @param {number} v */
export function roundHeat(v) {
  return Math.round(v * 1000) / 1000;
}

/**
 * @param {string[]} months
 * @param {Record<string, number>} monthly
 */
export function monthlyToHeatPoints(months, monthly) {
  return months.map((month) => ({
    month,
    score: roundHeat(monthly[month] ?? 0),
  }));
}

/**
 * @param {string[]} months
 * @param {Record<string, Record<string, number>>} byTerm
 */
export function termTrendsToStored(months, byTerm) {
  /** @type {Record<string, { month: string, trends: number }[]>} */
  const out = {};
  for (const [term, monthly] of Object.entries(byTerm)) {
    out[term] = months.map((month) => ({
      month,
      trends: roundHeat(monthly[month] ?? 0),
    }));
  }
  return out;
}

/**
 * @param {string[]} months
 * @param {Record<string, { month: string, trends: number }[]>} termTrends
 */
export function maxMonthlyFromTermTrends(months, termTrends) {
  /** @type {Record<string, number>} */
  const merged = Object.fromEntries(months.map((m) => [m, 0]));
  for (const points of Object.values(termTrends ?? {})) {
    for (const p of points) {
      if (!(p.month in merged)) continue;
      merged[p.month] = Math.max(merged[p.month], p.trends ?? 0);
    }
  }
  return merged;
}

/**
 * @param {{ month: string, score: number }[]} points
 * @param {Record<string, { month: string, trends: number }[]>} termTrends
 */
export function buildConceptHeatEntry(points, termTrends) {
  return { points, termTrends };
}
