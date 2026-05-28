/**
 * Recompute points from termTrends (monthly max). Run: npm run recompute-heat
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  maxMonthlyFromTermTrends,
  monthlyToHeatPoints,
} from "./lib/heat-series-shape.mjs";
import { loadRegistry } from "./lib/load-registry.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const concepts = loadRegistry(root);
const heatPath = join(root, "src/data/heat-series.json");
const heat = JSON.parse(readFileSync(heatPath, "utf8"));
const months = heat.months ?? [];

const categoryById = Object.fromEntries(concepts.map((c) => [c.id, c.category]));

for (const [id, entry] of Object.entries(heat.series ?? {})) {
  if (!categoryById[id] || !entry?.termTrends || !months.length) continue;
  const merged = maxMonthlyFromTermTrends(months, entry.termTrends);
  entry.points = monthlyToHeatPoints(months, merged);
}

heat.formula =
  "score = max(google_trends per term, 0–100 each); termTrends = per-term series; chart width = monthly share across concepts only";
heat.sources = ["google_trends"];
delete heat.partial;
heat.recomputedAt = new Date().toISOString();

writeFileSync(heatPath, JSON.stringify(heat, null, 2) + "\n");
console.log("Recomputed scores for", Object.keys(heat.series).length, "concepts");
