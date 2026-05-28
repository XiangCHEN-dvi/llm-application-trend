import type { HistomapView } from "../types";

interface ViewTabsProps {
  view: HistomapView;
  onView: (view: HistomapView) => void;
}

export function ViewTabs({ view, onView }: ViewTabsProps) {
  return (
    <div
      className="histomap-tablist"
      role="tablist"
      aria-label="Histomap view"
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === "concepts"}
        id="tab-concepts"
        aria-controls="panel-histomap"
        className={`histomap-tab ${view === "concepts" ? "histomap-tab-active" : ""}`}
        onClick={() => onView("concepts")}
      >
        Concepts
      </button>
      <button
        type="button"
        role="tab"
        id="tab-products"
        aria-controls="panel-histomap"
        aria-selected={view === "products"}
        className={`histomap-tab ${view === "products" ? "histomap-tab-active" : ""}`}
        onClick={() => onView("products")}
      >
        Products
      </button>
    </div>
  );
}
