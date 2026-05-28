import type { HistomapItem } from "../types";
import { TIMELINE_START, timelineEndMonth } from "../data/timelineBounds";
import { observedScoreAt } from "../data/observedHeat";
import { isOnTimeline } from "./timeline";

/** Chart band width from heat-series.json; zero when no score for that month */
export function rawHeatAt(item: HistomapItem, month: Date): number {
  if (!isOnTimeline(month)) return 0;
  return observedScoreAt(item.id, month) ?? 0;
}

export interface MonthSlice {
  date: Date;
  label: string;
  shares: Map<string, number>;
}

export function generateMonthGrid(): Date[] {
  const months: Date[] = [];
  const cursor = new Date(TIMELINE_START);
  cursor.setDate(1);
  const end = timelineEndMonth();
  while (cursor <= end) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export function buildMonthSlices(items: HistomapItem[]): MonthSlice[] {
  const months = generateMonthGrid();

  return months.map((date) => {
    const raw = new Map<string, number>();
    let total = 0;
    for (const c of items) {
      const h = rawHeatAt(c, date);
      if (h > 0.001) {
        raw.set(c.id, h);
        total += h;
      }
    }
    const shares = new Map<string, number>();
    if (total > 0) {
      for (const [id, h] of raw) shares.set(id, h / total);
    }
    const label =
      date.getMonth() === 0
        ? String(date.getFullYear())
        : date.toLocaleString("en-US", { month: "short" });
    return { date, label, shares };
  });
}

type Bounds = { xLeft: number; xRight: number; width: number };

function boundsForSlice(
  slice: MonthSlice,
  items: HistomapItem[],
  chartWidth: number,
): Map<string, Bounds> {
  const bands: { id: string; xLeft: number; xRight: number }[] = [];
  let x = 0;

  for (const c of items) {
    const share = slice.shares.get(c.id) ?? 0;
    if (share <= 0) continue;
    const xRight = x + share * chartWidth;
    bands.push({ id: c.id, xLeft: x, xRight });
    x = xRight;
  }

  if (bands.length === 0) return new Map();

  bands[0]!.xLeft = 0;
  bands[bands.length - 1]!.xRight = chartWidth;
  for (let i = 0; i < bands.length - 1; i++) {
    bands[i]!.xRight = bands[i + 1]!.xLeft;
  }

  const bounds = new Map<string, Bounds>();
  for (const b of bands) {
    bounds.set(b.id, {
      xLeft: b.xLeft,
      xRight: b.xRight,
      width: b.xRight - b.xLeft,
    });
  }
  return bounds;
}

export interface ConceptPath {
  conceptId: string;
  d: string;
}

export interface ConceptLabelAnchor {
  x: number;
  y: number;
  width: number;
}

interface BoundaryPoint {
  xLeft: number;
  xRight: number;
  y: number;
}

function polygonFromBoundaries(points: BoundaryPoint[]): string {
  if (points.length < 2) return "";

  const parts = [`M ${points[0]!.xLeft} ${points[0]!.y}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`L ${points[i]!.xLeft} ${points[i]!.y}`);
  }
  const last = points[points.length - 1]!;
  parts.push(`L ${last.xRight} ${last.y}`);
  for (let i = points.length - 2; i >= 0; i--) {
    parts.push(`L ${points[i]!.xRight} ${points[i]!.y}`);
  }
  parts.push("Z");
  return parts.join(" ");
}

export function buildConceptPaths(
  items: HistomapItem[],
  chartWidth: number,
  rowHeight: number,
  monthCount?: number,
): ConceptPath[] {
  const slices = buildMonthSlices(items);
  if (slices.length === 0) return [];

  const n = monthCount ?? slices.length;
  const sliceBounds = slices
    .slice(0, n)
    .map((s) => boundsForSlice(s, items, chartWidth));
  const paths: ConceptPath[] = [];

  for (const c of items) {
    let run: BoundaryPoint[] = [];

    const flush = () => {
      if (run.length < 2) {
        run = [];
        return;
      }
      const d = polygonFromBoundaries(run);
      if (d) paths.push({ conceptId: c.id, d });
      run = [];
    };

    for (let i = 0; i < sliceBounds.length; i++) {
      const b = sliceBounds[i]!.get(c.id);
      const yTop = i * rowHeight;
      const yBottom = (i + 1) * rowHeight;

      // score 0 → no share: end this run (do not bridge across zero months).
      if (!b) {
        flush();
        continue;
      }

      const prev = run[run.length - 1];
      // Same width as previous month: extend one rectangle; else add a new strip
      // (still one polygon for this contiguous non-zero run).
      if (
        prev &&
        prev.xLeft === b.xLeft &&
        prev.xRight === b.xRight &&
        prev.y === yTop
      ) {
        prev.y = yBottom;
      } else {
        run.push({ xLeft: b.xLeft, xRight: b.xRight, y: yTop });
        run.push({ xLeft: b.xLeft, xRight: b.xRight, y: yBottom });
      }
    }
    flush();
  }

  return paths;
}

export function buildConceptLabelAnchors(
  items: HistomapItem[],
  chartWidth: number,
  rowHeight: number,
  monthCount: number,
): Map<string, ConceptLabelAnchor> {
  const slices = buildMonthSlices(items).slice(0, monthCount);
  const sliceBounds = slices.map((s) => boundsForSlice(s, items, chartWidth));
  const anchors = new Map<string, ConceptLabelAnchor>();

  for (const c of items) {
    let best: ConceptLabelAnchor = { x: 0, y: 0, width: 0 };

    for (let i = 0; i < sliceBounds.length; i++) {
      const b = sliceBounds[i]!.get(c.id);
      if (!b) continue;
      const width = b.xRight - b.xLeft;
      if (width > best.width) {
        best = {
          x: (b.xLeft + b.xRight) / 2,
          y: i * rowHeight + rowHeight / 2,
          width,
        };
      }
    }

    if (best.width > 0) anchors.set(c.id, best);
  }

  return anchors;
}

export function activeMonthCount(items: HistomapItem[]): number {
  const months = generateMonthGrid();
  for (let i = months.length - 1; i >= 0; i--) {
    let total = 0;
    for (const c of items) {
      total += rawHeatAt(c, months[i]!);
    }
    if (total > 0.001) return i + 1;
  }
  return months.length;
}
