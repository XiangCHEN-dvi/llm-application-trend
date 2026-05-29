import { useCallback, useMemo, useState } from "react";
import type { HistomapItem } from "../types";
import { TIMELINE_START, timelineEndExclusive } from "../data/timelineBounds";
import {
  activeMonthCount,
  buildChartGeometry,
} from "../utils/heatSeries";
import { fitBandLabel } from "../utils/labelFit";
import { buildClusterLayout } from "../utils/clusters";
import {
  CHART_CONTENT_WIDTH,
  CHART_MARGIN_BOTTOM,
  CHART_MARGIN_LEFT,
  CHART_MARGIN_RIGHT,
  CHART_MARGIN_TOP,
  CHART_SVG_WIDTH,
} from "../constants/chartLayout";
import { HistomapTooltip } from "./HistomapTooltip";

const MARGIN_LEFT = CHART_MARGIN_LEFT;
const MARGIN_RIGHT = CHART_MARGIN_RIGHT;
const MARGIN_TOP = CHART_MARGIN_TOP;
const MARGIN_BOTTOM = CHART_MARGIN_BOTTOM;
const CHART_WIDTH = CHART_CONTENT_WIDTH;
const ROW_HEIGHT = 14;
const BAND_TRANSITION = "opacity 0.15s ease, filter 0.15s ease";

function bandVisual(conceptId: string, hoveredId: string | null) {
  if (!hoveredId) {
    return { opacity: 0.96, filter: undefined as string | undefined };
  }
  if (conceptId === hoveredId) {
    return { opacity: 1, filter: "brightness(1.06)" };
  }
  return { opacity: 0.7, filter: "saturate(0.65) brightness(0.97)" };
}

interface HistomapChartProps {
  items: HistomapItem[];
  categoryLabels: Record<string, string>;
  categorySortIndex: (category: string) => number;
  itemMap: Map<string, HistomapItem>;
  colorForMember: (
    category: string,
    memberIndex: number,
    memberCount: number,
  ) => string;
}

interface HoverState {
  itemId: string;
  x: number;
  y: number;
}

export function HistomapChart({
  items,
  categoryLabels,
  categorySortIndex,
  itemMap,
  colorForMember,
}: HistomapChartProps) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const layout = useMemo(
    () => buildClusterLayout(items, categorySortIndex),
    [items, categorySortIndex],
  );
  const sorted = layout.sortedItems;

  const colorById = useMemo(() => {
    const m = new Map<string, string>();
    for (const item of sorted) {
      const members = layout.membersByCluster.get(item.category) ?? [item.id];
      m.set(
        item.id,
        colorForMember(
          item.category,
          members.indexOf(item.id),
          members.length,
        ),
      );
    }
    return m;
  }, [sorted, layout, colorForMember]);

  const monthCount = useMemo(() => activeMonthCount(sorted), [sorted]);
  const chartHeight = Math.max(0, monthCount - 1) * ROW_HEIGHT;

  const { paths, labelAnchors: labelAnchorMap } = useMemo(
    () => buildChartGeometry(sorted, CHART_WIDTH, ROW_HEIGHT, monthCount),
    [sorted, monthCount],
  );

  const pathsByConcept = useMemo(() => {
    const map = new Map<string, typeof paths>();
    for (const path of paths) {
      const list = map.get(path.conceptId);
      if (list) list.push(path);
      else map.set(path.conceptId, [path]);
    }
    return map;
  }, [paths]);

  const hoveredId = hover?.itemId ?? null;

  const conceptDrawOrder = useMemo(() => {
    const ids = [...pathsByConcept.keys()];
    if (!hoveredId) return ids;
    return [...ids.filter((id) => id !== hoveredId), hoveredId];
  }, [pathsByConcept, hoveredId]);

  const labelAnchors = useMemo(
    () =>
      [...labelAnchorMap.entries()].map(([id, anchor]) => ({
        id,
        ...anchor,
        w: anchor.width,
      })),
    [labelAnchorMap],
  );

  const yearTicks = useMemo(() => {
    const ticks: { y: number; label: string }[] = [];
    const startYear = TIMELINE_START.getFullYear();
    const end = timelineEndExclusive();
    const endYear = end.getFullYear();
    for (let y = startYear; y <= endYear; y++) {
      const d = new Date(`${y}-01-01`);
      if (d < TIMELINE_START || d > end) continue;
      const ratio =
        (d.getTime() - TIMELINE_START.getTime()) /
        (end.getTime() - TIMELINE_START.getTime());
      const tickY = ratio * chartHeight;
      if (tickY <= chartHeight) {
        ticks.push({ y: tickY, label: String(y) });
      }
    }
    return ticks;
  }, [chartHeight]);

  const svgWidth = MARGIN_LEFT + CHART_WIDTH + MARGIN_RIGHT;
  const svgHeight = MARGIN_TOP + chartHeight + MARGIN_BOTTOM;

  const showTooltip = useCallback((itemId: string, clientX: number, clientY: number) => {
    setHover({ itemId, x: clientX, y: clientY });
  }, []);

  const moveTooltip = useCallback((clientX: number, clientY: number) => {
    setHover((prev) => (prev ? { ...prev, x: clientX, y: clientY } : null));
  }, []);

  const hideTooltip = useCallback(() => setHover(null), []);

  if (items.length === 0) {
    return (
      <p className="histomap-empty px-4 py-10 text-center text-sm text-[var(--color-muted)] sm:px-6">
        No entries in this view yet.
      </p>
    );
  }

  return (
    <div className="relative">
      {hover && (
        <HistomapTooltip
          itemId={hover.itemId}
          x={hover.x}
          y={hover.y}
          itemMap={itemMap}
          categoryLabels={categoryLabels}
        />
      )}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="histomap-svg block w-full"
        style={{ maxWidth: CHART_SVG_WIDTH }}
        role="img"
        aria-label="LLM histomap: vertical time, horizontal discourse share"
      >
        <defs>
          <pattern
            id="paper-grain"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.35" fill="#00000008" />
          </pattern>
        </defs>

        <rect
          x={MARGIN_LEFT}
          y={MARGIN_TOP}
          width={CHART_WIDTH}
          height={chartHeight}
          className="histomap-chart-bg"
        />
        <rect
          x={MARGIN_LEFT}
          y={MARGIN_TOP}
          width={CHART_WIDTH}
          height={chartHeight}
          fill="url(#paper-grain)"
        />

        {yearTicks.map((tick) => (
          <g key={tick.label}>
            <line
              x1={MARGIN_LEFT}
              x2={MARGIN_LEFT + CHART_WIDTH}
              y1={MARGIN_TOP + tick.y}
              y2={MARGIN_TOP + tick.y}
              className="histomap-grid-line"
            />
            <text
              x={MARGIN_LEFT - 8}
              y={MARGIN_TOP + tick.y + 4}
              textAnchor="end"
              className="histomap-axis-label"
            >
              {tick.label}
            </text>
          </g>
        ))}

        <g transform={`translate(${MARGIN_LEFT}, ${MARGIN_TOP})`}>
          {conceptDrawOrder.map((conceptId) => {
            const segments = pathsByConcept.get(conceptId) ?? [];
            const visual = bandVisual(conceptId, hoveredId);
            const active = hoveredId === conceptId;
            return (
              <g
                key={conceptId}
                className="histomap-band-group"
                style={{
                  opacity: visual.opacity,
                  filter: visual.filter,
                  transition: BAND_TRANSITION,
                }}
                onMouseOver={(e) =>
                  showTooltip(conceptId, e.clientX, e.clientY)
                }
                onMouseMove={(e) => moveTooltip(e.clientX, e.clientY)}
                onMouseOut={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (next && e.currentTarget.contains(next)) return;
                  hideTooltip();
                }}
              >
                {segments.map((path, i) => (
                  <path
                    key={i}
                    d={path.d}
                    fill={colorById.get(conceptId)}
                    className="histomap-band"
                    stroke={active ? "#2c2416" : "none"}
                    strokeWidth={active ? 1.25 : 0}
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            );
          })}

          {[...labelAnchors]
            .sort((a, b) => {
              if (!hoveredId) return 0;
              if (a.id === hoveredId) return 1;
              if (b.id === hoveredId) return -1;
              return 0;
            })
            .map(({ id, x, y, w }) => {
              const item = sorted.find((s) => s.id === id);
              if (!item) return null;
              const name = item.name;
              const fit = fitBandLabel(name, w);
              const visual = bandVisual(id, hoveredId);
              return (
                <text
                  key={`label-${id}`}
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  className="histomap-band-label"
                  style={{
                    fontSize: fit.fontSize,
                    opacity: visual.opacity,
                    filter: visual.filter,
                    transition: BAND_TRANSITION,
                  }}
                  textLength={fit.textLength}
                  lengthAdjust={fit.lengthAdjust}
                  pointerEvents="none"
                >
                  {name}
                </text>
              );
            })}
        </g>
      </svg>
    </div>
  );
}
