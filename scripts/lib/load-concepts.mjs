import { readFileSync } from "node:fs";

/**
 * @param {{ category: string; concepts: { id: string; name: string; summary: string; links?: { label: string; url: string }[] }[] }[]} groups
 */
export function flattenConcepts(groups) {
  /** @type {{ id: string; name: string; summary: string; category: string; links?: { label: string; url: string }[] }[]} */
  const out = [];
  const seen = new Set();

  for (const group of groups) {
    for (const concept of group.concepts) {
      if (seen.has(concept.id)) {
        throw new Error(`Duplicate concept id: ${concept.id}`);
      }
      seen.add(concept.id);
      out.push({ ...concept, category: group.category });
    }
  }
  return out;
}

/** @param {string} path */
export function loadConcepts(path) {
  const groups = JSON.parse(readFileSync(path, "utf8"));
  return flattenConcepts(groups);
}
