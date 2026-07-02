'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { ZoomIn, ZoomOut, ArrowRight } from 'lucide-react';
import { ASPECT_RATIO_LIST } from '@/lib/constants/aspectRatios';
import type { AspectRatioId } from '@/lib/constants/aspectRatios';
import type { CroppedAreaPixels } from './canvasRenderer';

interface CropStepProps {
  /** Object URL of the image to crop */
  imageUrl: string;
  /** Called when user confirms crop and advances to editing */
  onNext: (croppedAreaPixels: CroppedAreaPixels, aspectRatioId: AspectRatioId) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * CropStep — wraps react-easy-crop in an Instagram-style cropping UI.
 *
 * Features:
 * - Interactive pan (drag) and zoom (slider + scroll wheel)
 * - Inline aspect ratio picker (compact pill strip)
 * - Grid overlay for precise alignment
 * - Outputs exact pixel coordinates for the canvas renderer
 */
export default function CropStep({ imageUrl, onNext, onCancel }: CropStepProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioId>('square_1_1');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

  // Compute the aspect ratio decimal from the selected ratio
  const aspectRatio = useMemo(() => {
    const found = ASPECT_RATIO_LIST.find((r) => r.id === selectedRatio);
    return found ? found.decimal : 1;
  }, [selectedRatio]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleRatioChange = useCallback((id: AspectRatioId) => {
    setSelectedRatio(id);
    // Reset crop position when changing aspect ratio for a clean start
    setCrop({ x: 0, y: 0 });
  }, []);

  const handleNext = useCallback(() => {
    if (!croppedAreaPixels) return;
    onNext(croppedAreaPixels, selectedRatio);
  }, [croppedAreaPixels, selectedRatio, onNext]);

  return (
    <div className="flex flex-col w-full animate-fadeIn">
      {/* ── Cropper Area ── */}
      <div className="relative w-full bg-black/90" style={{ height: 400 }}>
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          cropShape="rect"
          showGrid={true}
          style={{
            containerStyle: {
              width: '100%',
              height: '100%',
              background: '#0a0a0a',
            },
            cropAreaStyle: {
              border: '2px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '8px',
            },
            mediaStyle: {},
          }}
          classes={{
            containerClassName: 'crop-container-dark',
          }}
        />
      </div>

      {/* ── Aspect Ratio Strip ── */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2.5">
          Aspect Ratio
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {ASPECT_RATIO_LIST.map((ratio) => (
            <button
              key={ratio.id}
              type="button"
              onClick={() => handleRatioChange(ratio.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium smooth-transition whitespace-nowrap ${
                selectedRatio === ratio.id
                  ? 'bg-accent text-accent-foreground shadow-md'
                  : 'bg-card/60 border border-border/30 text-foreground/60 hover:text-foreground hover:border-accent/40'
              }`}
            >
              {ratio.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* ── Zoom Slider ── */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-3 w-full">
          <ZoomOut className="w-4 h-4 text-foreground/40 flex-shrink-0" />
          <div className="flex-1 relative">
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                         bg-border/30 accent-accent
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-accent
                         [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(var(--accent-rgb,180,80,80),0.4)]
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:border-2
                         [&::-webkit-slider-thumb]:border-white/20"
            />
          </div>
          <ZoomIn className="w-4 h-4 text-foreground/40 flex-shrink-0" />
          <span className="text-xs text-foreground/40 ml-1 min-w-[2.5rem] text-right font-mono">
            {zoom.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border/20 mt-auto">
        <button
          type="button"
          onClick={onCancel}
          className="luxury-button-outline px-5 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!croppedAreaPixels}
          className="luxury-button px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
