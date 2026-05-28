export type ConceptCategory =
  | "memory"
  | "prompting"
  | "tools"
  | "application";

export type ProductCategory = "open-source" | "closed-source";

export type HistomapView = "concepts" | "products";

export interface ConceptDefinition {
  id: string;
  name: string;
  summary: string;
  links?: { label: string; url: string }[];
}

export interface ProductDefinition {
  id: string;
  name: string;
  summary: string;
  links?: { label: string; url: string }[];
}

export interface ConceptCategoryGroup {
  category: ConceptCategory;
  concepts: ConceptDefinition[];
}

export interface ProductCategoryGroup {
  category: ProductCategory;
  products: ProductDefinition[];
}

export interface Concept extends ConceptDefinition {
  category: ConceptCategory;
}

export interface Product extends ProductDefinition {
  category: ProductCategory;
}

/** Shared shape for histomap rows (concepts or products). */
export interface HistomapItem {
  id: string;
  name: string;
  summary: string;
  category: string;
}

/** Monthly Google Trends index for one search term (0–100, peak month = 100). */
export interface TermHeatPoint {
  month: string;
  trends: number;
}

/** Monthly max across terms; used by the chart. */
export interface HeatSeriesPoint {
  month: string;
  /** max(term trends) for this month, 0–100 */
  score: number;
}

export interface ConceptHeatEntry {
  points: HeatSeriesPoint[];
  /** Per-term raw Trends series (keys match concept-signals.mjs term strings). */
  termTrends: Record<string, TermHeatPoint[]>;
}

export interface HeatSeriesFile {
  generatedAt: string;
  formula: string;
  sources: string[];
  months: string[];
  partial?: boolean;
  series: Record<string, ConceptHeatEntry>;
}

export const CONCEPT_CATEGORY_ORDER: readonly ConceptCategory[] = [
  "prompting",
  "memory",
  "tools",
  "application",
];

export const CONCEPT_CATEGORY_LABELS: Record<ConceptCategory, string> = {
  memory: "Memory",
  prompting: "Prompting",
  tools: "Tools",
  application: "Application",
};

export const PRODUCT_CATEGORY_ORDER: readonly ProductCategory[] = [
  "open-source",
  "closed-source",
];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  "open-source": "Open source",
  "closed-source": "Closed source",
};

export function conceptCategorySortIndex(category: ConceptCategory): number {
  const i = CONCEPT_CATEGORY_ORDER.indexOf(category);
  return i === -1 ? CONCEPT_CATEGORY_ORDER.length : i;
}

export function productCategorySortIndex(category: ProductCategory): number {
  const i = PRODUCT_CATEGORY_ORDER.indexOf(category);
  return i === -1 ? PRODUCT_CATEGORY_ORDER.length : i;
}
