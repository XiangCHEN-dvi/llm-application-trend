import type { HistomapItem } from "../types";
import { firstScoreMonth, heatCentroidMonth } from "../data/observedHeat";

/** Left→right within a category: earlier first non-zero score, then earlier centroid. */
function compareWithinCategory(aId: string, bId: string): number {
  const byFirst =
    firstScoreMonth(aId).getTime() - firstScoreMonth(bId).getTime();
  if (byFirst !== 0) return byFirst;
  const byCentroid =
    heatCentroidMonth(aId).getTime() - heatCentroidMonth(bId).getTime();
  if (byCentroid !== 0) return byCentroid;
  return aId.localeCompare(bId);
}

export interface ClusterLayout {
  membersByCluster: Map<string, string[]>;
  sortedItems: HistomapItem[];
}

export function buildClusterLayout(
  items: HistomapItem[],
  categorySortIndex: (category: string) => number,
): ClusterLayout {
  const membersByCluster = new Map<string, string[]>();

  for (const item of items) {
    const list = membersByCluster.get(item.category) ?? [];
    list.push(item.id);
    membersByCluster.set(item.category, list);
  }

  for (const [cat, members] of membersByCluster) {
    members.sort(compareWithinCategory);
    membersByCluster.set(cat, members);
  }

  const sortedItems = [...items].sort((a, b) => {
    const byCat = categorySortIndex(a.category) - categorySortIndex(b.category);
    if (byCat !== 0) return byCat;
    return compareWithinCategory(a.id, b.id);
  });

  return { membersByCluster, sortedItems };
}
