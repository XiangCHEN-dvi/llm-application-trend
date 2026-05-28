import type { ConceptCategory, ProductCategory } from "../types";

const CONCEPT_RAMPS: Record<ConceptCategory, readonly string[]> = {
  prompting: [
    "#7a3238",
    "#8f4248",
    "#a85860",
    "#bc7078",
    "#d08c94",
    "#e4b0b4",
  ],
  memory: [
    "#324e68",
    "#42607c",
    "#547490",
    "#6a8ca4",
    "#88a4b8",
    "#a8c0d0",
  ],
  tools: [
    "#3a5c3c",
    "#4a704c",
    "#5e8660",
    "#749c78",
    "#8eb494",
    "#aac8ae",
  ],
  application: [
    "#5a4878",
    "#6c5a8c",
    "#806ea0",
    "#9684b4",
    "#b09cc8",
    "#c8b8dc",
  ],
};

const PRODUCT_RAMPS: Record<ProductCategory, readonly string[]> = {
  "open-source": CONCEPT_RAMPS.prompting,
  "closed-source": CONCEPT_RAMPS.memory,
};

function colorFromRamp(
  ramps: Record<string, readonly string[]>,
  category: string,
  memberIndex: number,
): string {
  const ramp = ramps[category] ?? ramps[Object.keys(ramps)[0]!]!;
  return ramp[memberIndex % ramp.length]!;
}

export function colorForConceptMember(
  category: ConceptCategory,
  memberIndex: number,
  _memberCount: number,
): string {
  return colorFromRamp(CONCEPT_RAMPS, category, memberIndex);
}

export function colorForProductMember(
  category: ProductCategory,
  memberIndex: number,
  _memberCount: number,
): string {
  return colorFromRamp(PRODUCT_RAMPS, category, memberIndex);
}
