'use client';

import React from 'react';
import { ASPECT_RATIO_LIST } from '@/lib/constants/aspectRatios';
import type { AspectRatioId } from '@/lib/constants/aspectRatios';

interface AspectRatioPickerProps {
  selected: AspectRatioId | null;
  onSelect: (id: AspectRatioId) => void;
}

/**
 * Aspect ratio selection UI — purely driven by ASPECT_RATIO_LIST.
 * Renders as a wrapping flex group of pill buttons matching the existing
 * Auroric UI style (rounded-lg, accent highlight on selection).
 */
export default function AspectRatioPicker({ selected, onSelect }: AspectRatioPickerProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-1">
        Aspect Ratio <span className="text-accent">*</span>
      </label>
      <p className="text-xs text-foreground/50 mb-3">
        Select an aspect ratio for optimal feed presentation.
      </p>
      <div className="flex flex-wrap gap-2">
        {ASPECT_RATIO_LIST.map((ratio) => (
          <button
            key={ratio.id}
            type="button"
            onClick={() => onSelect(ratio.id)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium smooth-transition ${
              selected === ratio.id
                ? 'bg-accent border-accent text-accent-foreground'
                : 'bg-card/50 border-border/30 hover:border-accent/50 text-foreground/70 hover:text-foreground'
            }`}
          >
            {ratio.label}
          </button>
        ))}
      </div>
    </div>
  );
}
