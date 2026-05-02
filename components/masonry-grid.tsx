'use client';

import React, { useState, useEffect } from 'react';

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
