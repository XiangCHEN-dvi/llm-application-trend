/**
 * Re-fetch heat for one concept (deletes its existing series entry first).
 *
 * Usage:
 *   node scripts/fetch-heat-concept.mjs deepseek
 *
 * Proxy: same as fetch-heat (https_proxy / HTTPS_PROXY / http_proxy / HTTP_PROXY)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { CONCEPT_SIGNALS } from "../src/data/concept-signals.mjs";
import { fetchTrendsPerTerm, proxyUrlFromEnv } from "./lib/fetch-trends.mjs";
import {
  buildConceptHeatEntry,
  monthlyToHeatPoints,
  termTrendsToStored,
} from "./lib/heat-series-shape.mjs";
import { formatSearchTerm } from "./lib/signal-query.mjs";
import { emptyMonthly, monthRange, sleep } from "./lib/heat-utils.mjs";

const id = process.argv[2];
if (!id) {
  console.error("Usage: node scripts/fetch-heat-concept.mjs <concept-id>");
  process.exit(1);
}

const sig = CONCEPT_SIGNALS[id];
if (!sig) {
  console.error(`Unknown concept id "${id}" (no entry in concept-signals.mjs)`);
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const heatPath = join(root, "src/data/heat-series.json");
const months = monthRange();

const heat = JSON.parse(readFileSync(heatPath, "utf8"));
heat.series ??= {};
delete heat.series[id];

console.log(`→ ${id}`);
for (const term of sig.terms) {
  console.log(`  Trends: ${formatSearchTerm(term)}`);
}
console.log(`Trends proxy: ${proxyUrlFromEnv() ?? "none"}`);

let byTerm = Object.fromEntries(
  sig.terms.map((term) => [term, emptyMonthly(months)]),
);
let merged = null;

if (process.env.SKIP_TRENDS !== "1") {
  await sleep(2000);
  const fetched = await fetchTrendsPerTerm(sig.terms, months);
  if (fetched) {
    byTerm = fetched.byTerm;
    merged = fetched.merged;
  }
}
if (!merged) {
  merged = Object.fromEntries(months.map((m) => [m, 0]));
}

const score = months.map((m) => Math.max(0, merged[m] ?? 0));
heat.series[id] = buildConceptHeatEntry(
  monthlyToHeatPoints(
    months,
    Object.fromEntries(months.map((m, i) => [m, score[i] ?? 0])),
  ),
  termTrendsToStored(months, byTerm),
);

heat.generatedAt = new Date().toISOString();
delete heat.partial;

writeFileSync(heatPath, JSON.stringify(heat, null, 2) + "\n");

const peak = Math.max(...score, 0);
const peakMonth = months[score.indexOf(peak)] ?? "";
const nz = score.filter((s) => s > 0).length;
console.log(`\nWrote ${heatPath} — ${id}: peak ${peak} @ ${peakMonth}, ${nz} non-zero months`);
