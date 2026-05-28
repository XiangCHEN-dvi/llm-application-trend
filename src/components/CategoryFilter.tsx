import type {
  ConceptCategory,
  HistomapView,
  ProductCategory,
} from "../types";
import {
  CONCEPT_CATEGORY_LABELS,
  CONCEPT_CATEGORY_ORDER,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CATEGORY_ORDER,
} from "../types";

interface CategoryFilterProps {
  view: HistomapView;
  conceptCategory: ConceptCategory | "all";
  onConceptCategory: (c: ConceptCategory | "all") => void;
  productCategory: ProductCategory | "all";
  onProductCategory: (c: ProductCategory | "all") => void;
}

export function CategoryFilter({
  view,
  conceptCategory,
  onConceptCategory,
  productCategory,
  onProductCategory,
}: CategoryFilterProps) {
  const category = view === "concepts" ? conceptCategory : productCategory;

  return (
    <label className="histomap-category-filter shrink-0">
      <span className="sr-only">Category filter</span>
      <select
        value={category}
        onChange={(e) => {
          const v = e.target.value;
          if (view === "concepts") {
            onConceptCategory(v as ConceptCategory | "all");
          } else {
            onProductCategory(v as ProductCategory | "all");
          }
        }}
        className="histomap-input histomap-input-on-panel rounded-sm px-2 py-1.5 text-sm"
      >
        <option value="all">All categories</option>
        {view === "concepts"
          ? CONCEPT_CATEGORY_ORDER.map((k) => (
              <option key={k} value={k}>
                {CONCEPT_CATEGORY_LABELS[k]}
              </option>
            ))
          : PRODUCT_CATEGORY_ORDER.map((k) => (
              <option key={k} value={k}>
                {PRODUCT_CATEGORY_LABELS[k]}
              </option>
            ))}
      </select>
    </label>
  );
}
