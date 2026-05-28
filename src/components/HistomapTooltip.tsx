import type { HistomapItem } from "../types";
import { CONCEPT_SIGNALS } from "../data/concept-signals.mjs";

interface HistomapTooltipProps {
  itemId: string;
  x: number;
  y: number;
  itemMap: Map<string, HistomapItem>;
  categoryLabels: Record<string, string>;
}

export function HistomapTooltip({
  itemId,
  x,
  y,
  itemMap,
  categoryLabels,
}: HistomapTooltipProps) {
  const item = itemMap.get(itemId);
  if (!item) return null;

  const offset = 14;
  const maxW = 300;
  const terms = CONCEPT_SIGNALS[itemId as keyof typeof CONCEPT_SIGNALS]?.terms ?? [];
  const category = categoryLabels[item.category] ?? item.category;
  const metaClass =
    "mt-2 font-mono text-[10px] uppercase tracking-wide opacity-75";

  return (
    <div
      className="histomap-tooltip pointer-events-none fixed z-50 max-w-[min(300px,90vw)] rounded-sm px-3 py-2.5 text-sm shadow-md"
      style={{
        left: Math.min(x + offset, window.innerWidth - maxW - 12),
        top: Math.min(y + offset, window.innerHeight - 160),
      }}
      role="tooltip"
    >
      <p className="font-bold leading-snug">{item.name}</p>
      <p className="mt-1 text-xs leading-relaxed opacity-90">{item.summary}</p>
      {terms.length > 0 && (
        <p className={metaClass}>Search terms: {terms.join(", ")}</p>
      )}
      <p className={metaClass}>Category: {category}</p>
    </div>
  );
}
