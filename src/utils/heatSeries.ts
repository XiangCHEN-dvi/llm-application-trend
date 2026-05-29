import type { HistomapItem } from "../types";
import { TIMELINE_START, timelineEndMonth } from "../data/timelineBounds";
import { observedScoreAt } from "../data/observedHeat";
import { isOnTimeline } from "./timeline";

function rawHeatAt(item: HistomapItem, month: Date): number {
  if (!isOnTimeline(month)) return 0;
  return observedScoreAt(item.id, month) ?? 0;
}

function generateMonthGrid(): Date[] {
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

function buildMonthShares(items: HistomapItem[]): Map<string, number>[] {
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
    return shares;
  });
}

type Bounds = { xLeft: number; xRight: number };

function boundsForSlice(
  shares: Map<string, number>,
  items: HistomapItem[],
  chartWidth: number,
): Map<string, Bounds> {
  const bands: { id: string; xLeft: number; xRight: number }[] = [];
  let x = 0;

  for (const c of items) {
    const share = shares.get(c.id) ?? 0;
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
    bounds.set(b.id, { xLeft: b.xLeft, xRight: b.xRight });
  }
  return bounds;
}

function buildSliceBounds(
  items: HistomapItem[],
  chartWidth: number,
  monthCount: number,
): Map<string, Bounds>[] {
  return buildMonthShares(items)
    .slice(0, monthCount)
    .map((shares) => boundsForSlice(shares, items, chartWidth));
}

function lastDrawableMonthIndex(monthCount: number): number {
  return monthCount - 2;
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

export interface ChartGeometry {
  paths: ConceptPath[];
  labelAnchors: Map<string, ConceptLabelAnchor>;
}

interface MonthStrip {
  monthIndex: number;
  xLeft: number;
  xRight: number;
  yTop: number;
  yBottom: number;
}

/** One calendar-month band: top = this month’s bounds, bottom = next month’s (trapezoid). */
function monthBandPath(
  strip: MonthStrip,
  bottomLeft: number,
  bottomRight: number,
): string {
  return `M ${strip.xLeft} ${strip.yTop} L ${strip.xRight} ${strip.yTop} L ${bottomRight} ${strip.yBottom} L ${bottomLeft} ${strip.yBottom} Z`;
}

/** Debut month wedge: apex → this month’s top-left → top-right. */
function debutWedgePath(strip: MonthStrip, apexX: number): string {
  const yPrior = strip.yTop - (strip.yBottom - strip.yTop);
  return `M ${apexX} ${yPrior} L ${strip.xLeft} ${strip.yTop} L ${strip.xRight} ${strip.yTop} Z`;
}

/** Exit month wedge: this month’s top-left → top-right → apex at row bottom. */
function exitWedgePath(strip: MonthStrip, apexX: number): string {
  return `M ${strip.xLeft} ${strip.yTop} L ${strip.xRight} ${strip.yTop} L ${apexX} ${strip.yBottom} Z`;
}

/** Walk left; first neighbor with data in targetMonth → its xRight; else chart left. */
function wedgeApexX(
  items: HistomapItem[],
  sliceBounds: Map<string, Bounds>[],
  conceptIndex: number,
  targetMonthIndex: number,
): number {
  if (targetMonthIndex < 0 || targetMonthIndex >= sliceBounds.length) return 0;
  const month = sliceBounds[targetMonthIndex]!;

  for (let j = conceptIndex - 1; j >= 0; j--) {
    const b = month.get(items[j]!.id);
    if (b) return b.xRight;
  }
  return 0;
}

function pathsForRun(
  strips: MonthStrip[],
  conceptIndex: number,
  items: HistomapItem[],
  sliceBounds: Map<string, Bounds>[],
): string[] {
  const out: string[] = [];
  const conceptId = items[conceptIndex]!.id;
  const lastDrawable = lastDrawableMonthIndex(sliceBounds.length);

  for (let i = 0; i < strips.length; i++) {
    const s = strips[i]!;
    if (s.monthIndex > lastDrawable) continue;

    const below = sliceBounds[s.monthIndex + 1]!.get(conceptId);
    if (below) {
      out.push(monthBandPath(s, below.xLeft, below.xRight));
    } else {
      out.push(
        exitWedgePath(
          s,
          wedgeApexX(items, sliceBounds, conceptIndex, s.monthIndex + 1),
        ),
      );
    }
    if (i === 0 && s.monthIndex > 0) {
      out.push(
        debutWedgePath(
          s,
          wedgeApexX(items, sliceBounds, conceptIndex, s.monthIndex - 1),
        ),
      );
    }
  }
  return out;
}

function buildPaths(
  items: HistomapItem[],
  sliceBounds: Map<string, Bounds>[],
  rowHeight: number,
): ConceptPath[] {
  const paths: ConceptPath[] = [];

  for (let conceptIndex = 0; conceptIndex < items.length; conceptIndex++) {
    const c = items[conceptIndex]!;
    let run: MonthStrip[] = [];

    const flush = () => {
      for (const d of pathsForRun(run, conceptIndex, items, sliceBounds)) {
        paths.push({ conceptId: c.id, d });
      }
      run = [];
    };

    for (let i = 0; i < sliceBounds.length; i++) {
      const b = sliceBounds[i]!.get(c.id);
      if (!b) {
        flush();
        continue;
      }

      run.push({
        monthIndex: i,
        xLeft: b.xLeft,
        xRight: b.xRight,
        yTop: i * rowHeight,
        yBottom: (i + 1) * rowHeight,
      });
    }
    flush();
  }

  return paths;
}

function buildLabelAnchors(
  items: HistomapItem[],
  sliceBounds: Map<string, Bounds>[],
  rowHeight: number,
): Map<string, ConceptLabelAnchor> {
  const anchors = new Map<string, ConceptLabelAnchor>();
  const lastDrawable = lastDrawableMonthIndex(sliceBounds.length);

  for (const c of items) {
    let best: ConceptLabelAnchor = { x: 0, y: 0, width: 0 };

    for (let i = 0; i <= lastDrawable; i++) {
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

export function buildChartGeometry(
  items: HistomapItem[],
  chartWidth: number,
  rowHeight: number,
  monthCount: number,
): ChartGeometry {
  const sliceBounds = buildSliceBounds(items, chartWidth, monthCount);
  if (sliceBounds.length === 0) {
    return { paths: [], labelAnchors: new Map() };
  }

  return {
    paths: buildPaths(items, sliceBounds, rowHeight),
    labelAnchors: buildLabelAnchors(items, sliceBounds, rowHeight),
  };
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
