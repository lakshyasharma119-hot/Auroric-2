'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Sun,
  Contrast,
  Droplets,
  CloudFog,
  Thermometer,
  RotateCcw,
  ArrowLeft,
  Check,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import {
  FILTER_PRESETS,
  buildFilterString,
  type FilterPreset,
} from './canvasRenderer';
import type { CroppedAreaPixels } from './canvasRenderer';

interface EditStepProps {
  /** Object URL of the original image */
  imageUrl: string;
  /** Cropped area pixels from the crop step */
  croppedAreaPixels: CroppedAreaPixels;
  /** Called when user goes back to crop step */
  onBack: () => void;
  /** Called with the final combined CSS filter string when user confirms */
  onConfirm: (filterCSS: string) => void;
}

interface AdjustmentValues {
  brightness: number;
  contrast: number;
  saturation: number;
  fade: number;
  temperature: number;
}

const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  fade: 0,
  temperature: 0,
};

type TabId = 'filters' | 'adjustments';

interface SliderDef {
  key: keyof AdjustmentValues;
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
}

const SLIDERS: SliderDef[] = [
  { key: 'brightness', label: 'Brightness', icon: <Sun className="w-4 h-4" />, min: -100, max: 100 },
  { key: 'contrast', label: 'Contrast', icon: <Contrast className="w-4 h-4" />, min: -100, max: 100 },
  { key: 'saturation', label: 'Saturation', icon: <Droplets className="w-4 h-4" />, min: -100, max: 100 },
  { key: 'fade', label: 'Fade', icon: <CloudFog className="w-4 h-4" />, min: 0, max: 100 },
  { key: 'temperature', label: 'Temperature', icon: <Thermometer className="w-4 h-4" />, min: -100, max: 100 },
];

/**
 * EditStep — Instagram-style image editor with Filters and Adjustments tabs.
 *
 * Renders a cropped preview of the image with live filter/adjustment updates.
 * All effects are applied via CSS filter on the preview, then baked into the
 * final canvas render on confirmation.
 */
export default function EditStep({
  imageUrl,
  croppedAreaPixels,
  onBack,
  onConfirm,
}: EditStepProps) {
  const [activeTab, setActiveTab] = useState<TabId>('filters');
  const [selectedFilter, setSelectedFilter] = useState<string>('original');
  const [adjustments, setAdjustments] = useState<AdjustmentValues>(DEFAULT_ADJUSTMENTS);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const filterStripRef = useRef<HTMLDivElement>(null);

  // Build the combined filter CSS string
  const combinedFilterCSS = useMemo(() => {
    const preset = FILTER_PRESETS.find((f) => f.id === selectedFilter);
    const presetFilter = preset?.filter || 'none';

    // Check if any adjustments are non-zero
    const hasAdjustments = Object.values(adjustments).some((v) => v !== 0);

    if (!hasAdjustments) {
      return presetFilter;
    }

    const adjustmentFilter = buildFilterString(adjustments);

    if (presetFilter === 'none') {
      return adjustmentFilter;
    }

    // Combine: preset first, then adjustments layered on top
    return `${presetFilter} ${adjustmentFilter}`;
  }, [selectedFilter, adjustments]);

  // Draw the cropped preview onto the canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match the cropped area (scaled down for preview)
      const maxPreviewSize = 400;
      const scale = Math.min(
        maxPreviewSize / croppedAreaPixels.width,
        maxPreviewSize / croppedAreaPixels.height,
        1,
      );
      const displayW = Math.round(croppedAreaPixels.width * scale);
      const displayH = Math.round(croppedAreaPixels.height * scale);

      canvas.width = displayW;
      canvas.height = displayH;

      // Apply the combined filter
      if (combinedFilterCSS && combinedFilterCSS !== 'none') {
        ctx.filter = combinedFilterCSS;
      } else {
        ctx.filter = 'none';
      }

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        displayW,
        displayH,
      );
    };
    img.src = imageUrl;
  }, [imageUrl, croppedAreaPixels, combinedFilterCSS]);

  const handleAdjustmentChange = useCallback(
    (key: keyof AdjustmentValues, value: number) => {
      setAdjustments((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetAdjustment = useCallback((key: keyof AdjustmentValues) => {
    setAdjustments((prev) => ({ ...prev, [key]: 0 }));
  }, []);

  const resetAllAdjustments = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(combinedFilterCSS);
  }, [combinedFilterCSS, onConfirm]);

  return (
    <div className="flex flex-col w-full animate-fadeIn">
      {/* ── Image Preview ── */}
      <div className="flex items-center justify-center bg-black/90 p-4" style={{ minHeight: 300 }}>
        <canvas
          ref={previewCanvasRef}
          className="rounded-lg shadow-xl max-w-full"
          style={{
            maxHeight: 300,
            objectFit: 'contain',
          }}
        />
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex border-b border-border/20">
        <button
          type="button"
          onClick={() => setActiveTab('filters')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium smooth-transition ${
            activeTab === 'filters'
              ? 'text-accent border-b-2 border-accent'
              : 'text-foreground/50 hover:text-foreground/70'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Filters
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('adjustments')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium smooth-transition ${
            activeTab === 'adjustments'
              ? 'text-accent border-b-2 border-accent'
              : 'text-foreground/50 hover:text-foreground/70'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Adjustments
        </button>
      </div>

      {/* ── Filters Tab ── */}
      {activeTab === 'filters' && (
        <div className="p-4 animate-fadeIn">
          <div
            ref={filterStripRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
          >
            {FILTER_PRESETS.map((preset) => (
              <FilterThumbnail
                key={preset.id}
                preset={preset}
                imageUrl={imageUrl}
                croppedAreaPixels={croppedAreaPixels}
                isSelected={selectedFilter === preset.id}
                onSelect={() => setSelectedFilter(preset.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Adjustments Tab ── */}
      {activeTab === 'adjustments' && (
        <div className="p-4 space-y-4 animate-fadeIn max-h-[240px] overflow-y-auto">
          {/* Reset all button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetAllAdjustments}
              className="text-xs text-foreground/40 hover:text-accent smooth-transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>

          {SLIDERS.map((slider) => (
            <div key={slider.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground/70">
                  {slider.icon}
                  <span className="text-xs font-medium">{slider.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-foreground/40 min-w-[2rem] text-right">
                    {adjustments[slider.key] > 0 ? '+' : ''}
                    {adjustments[slider.key]}
                  </span>
                  {adjustments[slider.key] !== 0 && (
                    <button
                      type="button"
                      onClick={() => resetAdjustment(slider.key)}
                      className="p-0.5 text-foreground/30 hover:text-accent smooth-transition"
                      title={`Reset ${slider.label}`}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={1}
                value={adjustments[slider.key]}
                onChange={(e) => handleAdjustmentChange(slider.key, Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                           bg-border/30 accent-accent
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-3.5
                           [&::-webkit-slider-thumb]:h-3.5
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-accent
                           [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(var(--accent-rgb,180,80,80),0.3)]
                           [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:border-2
                           [&::-webkit-slider-thumb]:border-white/20"
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border/20 mt-auto">
        <button
          type="button"
          onClick={onBack}
          className="luxury-button-outline px-5 py-2 text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="luxury-button px-5 py-2 text-sm flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Confirm
        </button>
      </div>
    </div>
  );
}

// ── Filter Thumbnail Component ──

interface FilterThumbnailProps {
  preset: FilterPreset;
  imageUrl: string;
  croppedAreaPixels: CroppedAreaPixels;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * A small thumbnail preview showing the image with a filter applied.
 * Renders via a mini canvas to give an accurate live preview.
 */
function FilterThumbnail({
  preset,
  imageUrl,
  croppedAreaPixels,
  isSelected,
  onSelect,
}: FilterThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbSize = 64;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = thumbSize;
      canvas.height = thumbSize;

      if (preset.filter && preset.filter !== 'none') {
        ctx.filter = preset.filter;
      }

      // Draw center-cropped thumbnail
      const srcSize = Math.min(croppedAreaPixels.width, croppedAreaPixels.height);
      const srcX = croppedAreaPixels.x + (croppedAreaPixels.width - srcSize) / 2;
      const srcY = croppedAreaPixels.y + (croppedAreaPixels.height - srcSize) / 2;

      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, thumbSize, thumbSize);
    };
    img.src = imageUrl;
  }, [imageUrl, preset.filter, croppedAreaPixels]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-shrink-0 flex flex-col items-center gap-1.5 smooth-transition group ${
        isSelected ? 'scale-105' : 'opacity-70 hover:opacity-100'
      }`}
    >
      <div
        className={`rounded-lg overflow-hidden smooth-transition ${
          isSelected
            ? 'ring-2 ring-accent ring-offset-2 ring-offset-card shadow-lg'
            : 'ring-1 ring-border/20 group-hover:ring-border/40'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={thumbSize}
          height={thumbSize}
          className="block"
          style={{ width: thumbSize, height: thumbSize }}
        />
      </div>
      <span
        className={`text-[10px] font-medium smooth-transition ${
          isSelected ? 'text-accent' : 'text-foreground/50 group-hover:text-foreground/70'
        }`}
      >
        {preset.name}
      </span>
    </button>
  );
}
