import { join } from "node:path";

import { loadConcepts } from "./load-concepts.mjs";
import { loadProducts } from "./load-products.mjs";

/** All histomap row ids (concepts + products) for heat fetch / validation. */
export function loadRegistry(root) {
  const concepts = loadConcepts(join(root, "src/data/concepts.json"));
  const products = loadProducts(join(root, "src/data/products.json"));
  return [...concepts, ...products];
}
