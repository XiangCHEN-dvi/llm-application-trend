import {
  timelineEndMonthKey,
  TIMELINE_START_MONTH,
} from "./timeline-bounds.mjs";

export { TIMELINE_START_MONTH, timelineEndMonthKey };

/** @returns {string[]} YYYY-MM */
export function monthRange(
  start = TIMELINE_START_MONTH,
  end = timelineEndMonthKey(),
) {
  const months = [];
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
}

export function emptyMonthly(months) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const month of months) out[month] = 0;
  return out;
}

/** @param {Record<string, number>} monthly */
export function monthlyToArray(months, monthly) {
  return months.map((m) => monthly[m] ?? 0);
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function retryAsync(fn, { tries = 3, delayMs = 2000 } = {}) {
  let lastErr;
  for (let t = 0; t < tries; t++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (t < tries - 1) await sleep(delayMs * (t + 1));
    }
  }
  throw lastErr;
}
