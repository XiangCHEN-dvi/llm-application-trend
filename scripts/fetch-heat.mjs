/**
 * Fetch Google Trends signals, compute heat, write heat-series.json.
 *
 * Usage:
 *   npm run fetch-heat
 *
 * Proxy (HttpsProxyAgent on google-trends-api):
 *   export https_proxy=http://127.0.0.1:7897 http_proxy=http://127.0.0.1:7897
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { CONCEPT_SIGNALS } from "../src/data/concept-signals.mjs";
import { fetchTrendsPerTerm, proxyUrlFromEnv } from "./lib/fetch-trends.mjs";
import {
  buildConceptHeatEntry,
  conceptPoints,
  monthlyToHeatPoints,
  termTrendsToStored,
} from "./lib/heat-series-shape.mjs";
import { formatSearchTerm } from "./lib/signal-query.mjs";
import { loadRegistry } from "./lib/load-registry.mjs";
import { emptyMonthly, monthRange, sleep } from "./lib/heat-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const heatPath = join(root, "src/data/heat-series.json");

const concepts = loadRegistry(root);
const months = monthRange();

const HEAT_FORMULA =
  "score = max(google_trends per term, 0–100 each); termTrends = per-term series; chart width = monthly share across concepts only";

/** @param {Record<string, number>} monthly */
function scoresFromMonthly(monthly) {
  return months.map((m) => Math.max(0, monthly[m] ?? 0));
}

async function rawForConcept(id) {
  const sig = CONCEPT_SIGNALS[id];
  if (!sig) throw new Error(`Missing CONCEPT_SIGNALS for ${id}`);

  console.log(`\n→ ${id}`);
  for (const term of sig.terms) {
    console.log(`  Trends: ${formatSearchTerm(term)}`);
  }

  /** @type {Record<string, Record<string, number>>} */
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

  return { merged, byTerm };
}

function writePayload(series, partial = false) {
  const payload = {
    generatedAt: new Date().toISOString(),
    partial,
    formula: HEAT_FORMULA,
    sources: ["google_trends"],
    months,
    series,
  };
  writeFileSync(heatPath, JSON.stringify(payload, null, 2) + "\n");
}

function loadExistingSeries() {
  if (process.env.FETCH_FORCE === "1") return {};
  try {
    const raw = JSON.parse(readFileSync(heatPath, "utf8"));
    return raw.series ?? {};
  } catch {
    return {};
  }
}

function peakFromEntry(entry) {
  const points = conceptPoints(entry);
  let peak = 0;
  let peakMonth = points[0]?.month ?? "";
  for (const p of points) {
    if ((p.score ?? 0) >= peak) {
      peak = p.score ?? 0;
      peakMonth = p.month;
    }
  }
  return { peak, peakMonth };
}

async function main() {
  console.log(`Months: ${months[0]} … ${months[months.length - 1]} (${months.length})`);
  console.log(`Trends proxy: ${proxyUrlFromEnv() ?? "none"}`);

  /** @type {Record<string, object>} */
  const series = loadExistingSeries();
  const cached = Object.keys(series).length;
  if (cached) console.log(`Resuming: ${cached} concepts already in heat-series.json`);
  const summaryRows = [];

  for (const concept of concepts) {
    const { id, category } = concept;
    if (series[id]) {
      const { peak, peakMonth } = peakFromEntry(series[id]);
      summaryRows.push({
        id,
        category,
        peak: peak.toFixed(3),
        peakMonth,
      });
      console.log(`\n↷ ${id} (cached)`);
      continue;
    }
    try {
      const raw = await rawForConcept(id);
      const score = scoresFromMonthly(raw.merged);
      const points = monthlyToHeatPoints(
        months,
        Object.fromEntries(months.map((m, i) => [m, score[i] ?? 0])),
      );
      const termTrends = termTrendsToStored(months, raw.byTerm);

      series[id] = buildConceptHeatEntry(points, termTrends);

      const peak = Math.max(...score, 0);
      const peakMonth = months[score.indexOf(peak)] ?? "";
      summaryRows.push({
        id,
        category,
        peak: peak.toFixed(3),
        peakMonth,
      });

      writePayload(series, true);
    } catch (err) {
      console.error(`  ✗ ${id}:`, err.message ?? err);
    }
  }

  writePayload(series, false);

  console.log("\n--- Peak score by concept ---");
  summaryRows.sort((a, b) => Number(b.peak) - Number(a.peak));
  for (const r of summaryRows) {
    console.log(
      `${r.peak.padStart(5)}  ${r.peakMonth}  [${r.category}]  ${r.id}`,
    );
  }
  console.log(`\nWrote ${heatPath} (${summaryRows.length}/${concepts.length} concepts)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
