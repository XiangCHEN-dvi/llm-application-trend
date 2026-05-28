import { readFileSync } from "node:fs";

import { flattenConcepts } from "./load-concepts.mjs";

/**
 * @param {{ category: string; products: { id: string; name: string; summary: string }[] }[]} groups
 */
export function flattenProducts(groups) {
  return flattenConcepts(
    groups.map((g) => ({ category: g.category, concepts: g.products })),
  );
}

/** @param {string} path */
export function loadProducts(path) {
  const groups = JSON.parse(readFileSync(path, "utf8"));
  return flattenProducts(groups);
}
