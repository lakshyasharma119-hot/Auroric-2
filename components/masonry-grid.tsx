'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ASPECT_RATIOS, DEFAULT_ASPECT_RATIO_ID } from '@/lib/constants/aspectRatios';
import type { AspectRatioId } from '@/lib/constants/aspectRatios';

// ─── NEW: Typed, height-aware masonry grid (Option A) ───────────────────────
// Uses greedy shortest-column bin-packing for gap-free layout.
// Items MUST have an aspectRatioId so the engine knows each card's
// rendered height before layout — this is what makes "no gaps" tractable.

export interface MasonryItem {
  id: string;
  aspectRatioId?: AspectRatioId;
}

interface TypedMasonryGridProps<T extends MasonryItem> {
  items: T[];
  renderCard: (item: T, columnWidth: number) => React.ReactNode;
  columns?: { base: number; sm: number; md: number; lg: number; xl: number };
  gap?: number;
}

/**
 * Height-aware masonry grid with greedy shortest-column packing.
 *
 * NOTE: Re-running the full bucket assignment on every new batch of items
 * (rather than only appending to the shortest column) is intentional —
 * recomputing from scratch keeps columns balanced as new items of varying
 * ratios arrive, at an acceptable cost for feed-sized item counts (≤50
 * per the landing page cap; for larger paginated views consider
 * append-only for performance).
 */
export function TypedMasonryGrid<T extends MasonryItem>({
  items,
  renderCard,
  columns = { base: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 16,
}: TypedMasonryGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(columns.lg);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setContainerWidth(w);
      if (w < 480) setColumnCount(columns.base);
      else if (w < 768) setColumnCount(columns.sm);
      else if (w < 1024) setColumnCount(columns.md);
      else if (w < 1280) setColumnCount(columns.lg);
      else setColumnCount(columns.xl);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [columns]);

  const columnWidth = columnCount > 0
    ? (containerWidth - gap * (columnCount - 1)) / columnCount
    : 0;

  // Greedy shortest-column packing — prevents the gap problem.
  const columnBuckets = useMemo(() => {
    const heights = new Array(columnCount).fill(0);
    const buckets: T[][] = Array.from({ length: columnCount }, () => []);
    for (const item of items) {
      const ratioId = item.aspectRatioId || DEFAULT_ASPECT_RATIO_ID;
      const ratio = ASPECT_RATIOS[ratioId]?.decimal ?? 1;
      const itemHeight = columnWidth / ratio;
      let shortest = 0;
      for (let i = 1; i < columnCount; i++) {
        if (heights[i] < heights[shortest]) shortest = i;
      }
      buckets[shortest].push(item);
      heights[shortest] += itemHeight + gap;
    }
    return buckets;
  }, [items, columnCount, columnWidth, gap]);

  return (
    <div ref={containerRef} className="flex w-full gap-4">
      {columnBuckets.map((bucket, colIdx) => (
        <div key={colIdx} className="flex flex-1 flex-col gap-4 min-w-0">
          {bucket.map((item) => (
            <div key={item.id} className="animate-slideUp">
              {renderCard(item, columnWidth)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── LEGACY: Children-based masonry grid (backward compatible) ──────────────
// Kept as the default export so existing pages (explore, profile, search,
// board, trending, popular, user) continue to work without changes.
// @deprecated — migrate callers to TypedMasonryGrid for height-aware layout.

interface MasonryGridProps {
  children: React.ReactNode[];
  columns?: number;
}

function useResponsiveColumns(defaultColumns: number): number {
  const [columns, setColumns] = useState(defaultColumns);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 640) setColumns(2);       // mobile
      else if (w < 1024) setColumns(3); // tablet
      else setColumns(4);               // desktop
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return columns;
}

export default function MasonryGrid({ children, columns = 4 }: MasonryGridProps) {
  const responsiveColumns = useResponsiveColumns(columns);

  // Distribute children into columns
  const columnArrays: React.ReactNode[][] = Array.from({ length: responsiveColumns }, () => []);

  React.Children.forEach(children, (child, index) => {
    columnArrays[index % responsiveColumns].push(child);
  });

  return (
    <div className="flex gap-4 w-full">
      {columnArrays.map((col, colIdx) => (
        <div key={colIdx} className="flex-1 flex flex-col gap-4 min-w-0">
          {col.map((child, childIdx) => (
            <div key={childIdx} className={`animate-slideUp masonry-delay-${Math.min(childIdx, 9)}`}>
              {child}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
