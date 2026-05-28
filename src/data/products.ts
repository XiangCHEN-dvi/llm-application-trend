import type {
  Product,
  ProductCategoryGroup,
  ProductDefinition,
} from "../types";
import { productCategorySortIndex } from "../types";
import productsData from "./products.json";

function flattenProducts(groups: ProductCategoryGroup[]): Product[] {
  const out: Product[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const item of group.products) {
      if (seen.has(item.id)) {
        throw new Error(`Duplicate product id: ${item.id}`);
      }
      seen.add(item.id);
      out.push({ ...item, category: group.category });
    }
  }
  return out;
}

const groups = [...(productsData as ProductCategoryGroup[])].sort(
  (a, b) =>
    productCategorySortIndex(a.category) - productCategorySortIndex(b.category),
);

export const productGroups = groups;

export const products = flattenProducts(groups);

export const productMap = new Map(products.map((p) => [p.id, p]));

export type { ProductDefinition };
