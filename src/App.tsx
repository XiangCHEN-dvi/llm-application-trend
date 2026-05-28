import { useCallback, useMemo, useState } from "react";
import { concepts, conceptMap } from "./data/concepts";
import { products, productMap } from "./data/products";
import { CategoryFilter } from "./components/CategoryFilter";
import { HistomapChart } from "./components/HistomapChart";
import { MethodologyFooter } from "./components/MethodologyFooter";
import { ViewTabs } from "./components/ViewTabs";
import type {
  ConceptCategory,
  HistomapView,
  ProductCategory,
} from "./types";
import {
  CONCEPT_CATEGORY_LABELS,
  PRODUCT_CATEGORY_LABELS,
  conceptCategorySortIndex,
  productCategorySortIndex,
} from "./types";
import {
  colorForConceptMember,
  colorForProductMember,
} from "./theme/palette";

export default function App() {
  const [view, setView] = useState<HistomapView>("concepts");
  const [conceptCategory, setConceptCategory] = useState<
    ConceptCategory | "all"
  >("all");
  const [productCategory, setProductCategory] = useState<
    ProductCategory | "all"
  >("all");

  const filteredConcepts = useMemo(() => {
    if (conceptCategory === "all") return concepts;
    return concepts.filter((c) => c.category === conceptCategory);
  }, [conceptCategory]);

  const filteredProducts = useMemo(() => {
    if (productCategory === "all") return products;
    return products.filter((p) => p.category === productCategory);
  }, [productCategory]);

  const colorForConcept = useCallback(
    (category: string, memberIndex: number, memberCount: number) =>
      colorForConceptMember(
        category as ConceptCategory,
        memberIndex,
        memberCount,
      ),
    [],
  );

  const colorForProduct = useCallback(
    (category: string, memberIndex: number, memberCount: number) =>
      colorForProductMember(
        category as ProductCategory,
        memberIndex,
        memberCount,
      ),
    [],
  );

  return (
    <div className="histomap-page">
      <div className="histomap-shell mx-auto w-full px-4 pb-4 sm:px-6">
        <div className="histomap-chart-stack">
          <div className="histomap-frame">
            <div className="histomap-header-row">
              <h1 className="histomap-title text-sm font-bold tracking-wide uppercase sm:text-base">
                The LLM Application Histomap
              </h1>
              <ViewTabs view={view} onView={setView} />
            </div>
            <section
              id="panel-histomap"
              role="tabpanel"
              aria-labelledby={
                view === "concepts" ? "tab-concepts" : "tab-products"
              }
              className="histomap-panel"
            >
              <div className="histomap-panel-toolbar">
              <CategoryFilter
                view={view}
                conceptCategory={conceptCategory}
                onConceptCategory={setConceptCategory}
                productCategory={productCategory}
                onProductCategory={setProductCategory}
              />
            </div>
              <div className="histomap-panel-body">
                {view === "concepts" ? (
                  <HistomapChart
                    items={filteredConcepts}
                    categoryLabels={CONCEPT_CATEGORY_LABELS}
                    categorySortIndex={(c) =>
                      conceptCategorySortIndex(c as ConceptCategory)
                    }
                    itemMap={conceptMap}
                    colorForMember={colorForConcept}
                  />
                ) : (
                  <HistomapChart
                    items={filteredProducts}
                    categoryLabels={PRODUCT_CATEGORY_LABELS}
                    categorySortIndex={(c) =>
                      productCategorySortIndex(c as ProductCategory)
                    }
                    itemMap={productMap}
                    colorForMember={colorForProduct}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
        <MethodologyFooter />
      </div>
    </div>
  );
}
