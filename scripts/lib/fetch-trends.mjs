import { timelineEndDate, timelineStartDate } from "./timeline-bounds.mjs";
import { emptyMonthly, retryAsync, sleep } from "./heat-utils.mjs";
import { formatSearchTerm } from "./signal-query.mjs";

/** @returns {string | null} */
export function proxyUrlFromEnv() {
  const url =
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.http_proxy ||
    process.env.HTTP_PROXY;
  const trimmed = url?.trim();
  return trimmed || null;
}

let cachedAgentUrl = null;
/** @type {import("https").Agent | undefined} */
let cachedAgent;

/** @returns {Promise<import("https").Agent | undefined>} */
async function trendsHttpsAgent() {
  const proxyUrl = proxyUrlFromEnv();
  if (!proxyUrl) return undefined;
  if (cachedAgent && cachedAgentUrl === proxyUrl) return cachedAgent;

  try {
    const { HttpsProxyAgent } = await import("https-proxy-agent");
    cachedAgentUrl = proxyUrl;
    cachedAgent = new HttpsProxyAgent(proxyUrl);
    return cachedAgent;
  } catch {
    console.warn(
      "https-proxy-agent not installed; run: npm install https-proxy-agent",
    );
    return undefined;
  }
}

/**
 * Fetch monthly Google Trends via google-trends-api.
 * Uses https_proxy / HTTPS_PROXY / http_proxy / HTTP_PROXY when set.
 * @param {string} keyword
 * @param {string[]} months
 */
export async function fetchTrendsMonthly(keyword, months) {
  let googleTrends;
  try {
    googleTrends = (await import("google-trends-api")).default;
  } catch {
    return null;
  }

  const startTime = timelineStartDate();
  const endTime = timelineEndDate();
  const agent = await trendsHttpsAgent();

  try {
    const raw = await retryAsync(
      () =>
        googleTrends.interestOverTime({
          keyword,
          startTime,
          endTime,
          geo: "",
          ...(agent ? { agent } : {}),
        }),
      { tries: 3, delayMs: 2500 },
    );
    const parsed = JSON.parse(raw);
    const timeline = parsed?.default?.timelineData ?? [];
    /** @type {Record<string, number>} */
    const monthly = {};
    for (const m of months) monthly[m] = 0;

    for (const point of timeline) {
      const t = Number(point.time) * 1000;
      const d = new Date(t);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (!(key in monthly)) continue;
      const v = Array.isArray(point.value)
        ? Number(point.value[0]) || 0
        : Number(point.value) || 0;
      monthly[key] = Math.max(monthly[key], v);
    }
    return monthly;
  } catch (err) {
    console.warn(`Trends failed for "${keyword}":`, err.message ?? err);
    return null;
  }
}

/**
 * Query each term separately; return per-term monthly series and max merge.
 * Each term keeps its own Trends 0–100 scale (peak month = 100 for that query).
 * @param {string[]} terms
 * @param {string[]} months
 * @param {{ delayMs?: number }} [opts]
 * @returns {Promise<{ byTerm: Record<string, Record<string, number>>, merged: Record<string, number> } | null>}
 */
export async function fetchTrendsPerTerm(terms, months, opts = {}) {
  const { delayMs = 2000 } = opts;
  const pairs = terms
    .map((term) => ({ term, keyword: formatSearchTerm(term) }))
    .filter((p) => p.keyword);
  if (!pairs.length) return null;

  /** @type {Record<string, Record<string, number>>} */
  const byTerm = {};
  let merged = emptyMonthly(months);
  let anyOk = false;

  for (let i = 0; i < pairs.length; i++) {
    if (i > 0 && delayMs > 0) await sleep(delayMs);
    const { term, keyword } = pairs[i];
    const one = await fetchTrendsMonthly(keyword, months);
    if (!one) {
      byTerm[term] = emptyMonthly(months);
      continue;
    }
    anyOk = true;
    byTerm[term] = one;
    for (const m of months) {
      merged[m] = Math.max(merged[m], one[m] ?? 0);
    }
  }

  return anyOk ? { byTerm, merged } : null;
}
