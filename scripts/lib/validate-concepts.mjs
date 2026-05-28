import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CONCEPT_SIGNALS } from "../../src/data/concept-signals.mjs";
import { loadRegistry } from "./load-registry.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** @returns {string[]} */
export function validateConceptRegistry(rootOverride = root) {
  const items = loadRegistry(rootOverride);
  const ids = new Set(items.map((c) => c.id));
  const errors = [];

  for (const id of ids) {
    if (!CONCEPT_SIGNALS[id]) {
      errors.push(`Missing CONCEPT_SIGNALS for "${id}"`);
    }
  }
  for (const id of Object.keys(CONCEPT_SIGNALS)) {
    if (!ids.has(id)) {
      errors.push(
        `Orphan CONCEPT_SIGNALS entry "${id}" (not in concepts.json or products.json)`,
      );
    }
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = validateConceptRegistry();
  if (errors.length) {
    for (const e of errors) console.error(e);
    process.exit(1);
  }
  const items = loadRegistry(root);
  console.log(
    `OK: ${items.length} registry ids (${items.length} signals in sync)`,
  );
}
