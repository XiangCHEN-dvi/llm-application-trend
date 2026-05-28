import type {
  Concept,
  ConceptCategoryGroup,
  ConceptDefinition,
} from "../types";
import { conceptCategorySortIndex } from "../types";
import conceptsData from "./concepts.json";

function flattenConcepts(groups: ConceptCategoryGroup[]): Concept[] {
  const out: Concept[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const item of group.concepts) {
      if (seen.has(item.id)) {
        throw new Error(`Duplicate concept id: ${item.id}`);
      }
      seen.add(item.id);
      out.push({ ...item, category: group.category });
    }
  }
  return out;
}

const groups = [...(conceptsData as ConceptCategoryGroup[])].sort(
  (a, b) =>
    conceptCategorySortIndex(a.category) - conceptCategorySortIndex(b.category),
);

export const conceptGroups = groups;

export const concepts = flattenConcepts(groups);

export const conceptMap = new Map(concepts.map((c) => [c.id, c]));

export type { ConceptDefinition };
