'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X } from 'lucide-react';

interface AvatarCropModalProps {
  imageFile: File;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function AvatarCropModal({ imageFile, onCrop, onCancel }: AvatarCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cropSize = 280;
  const previewSize = 120;

  // Load the image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Auto-zoom to fit
      const scale = Math.max(cropSize / img.width, cropSize / img.height);
      setZoom(Math.max(1, scale));
    };
    img.src = URL.createObjectURL(imageFile);
    return () => URL.revokeObjectURL(img.src);
  }, [imageFile]);

  // Draw on canvas whenever state changes
  const draw = useCallback(() => {
    if (!image || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const canvas = canvasRef.current;
    canvas.width = cropSize;
    canvas.height = cropSize;

    ctx.clearRect(0, 0, cropSize, cropSize);

    // Draw circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.clip();

    const scaledW = image.width * zoom;
    const scaledH = image.height * zoom;
    const x = (cropSize - scaledW) / 2 + offset.x;
    const y = (cropSize - scaledH) / 2 + offset.y;

    ctx.drawImage(image, x, y, scaledW, scaledH);
    ctx.restore();

    // Draw circular border
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2 - 1, 0, Math.PI * 2);
    const accentHsl = getComputedStyle(document.documentElement).getPropertyValue('--accent-hsl-raw').trim() || '0 85% 55%';
    ctx.strokeStyle = `hsl(${accentHsl} / 0.5)`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw preview
    if (previewRef.current) {
      const pctx = previewRef.current.getContext('2d');
      if (pctx) {
        previewRef.current.width = previewSize;
        previewRef.current.height = previewSize;
        pctx.clearRect(0, 0, previewSize, previewSize);
        pctx.save();
        pctx.beginPath();
        pctx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, Math.PI * 2);
        pctx.clip();
        const pScale = previewSize / cropSize;
        pctx.drawImage(image, x * pScale, y * pScale, scaledW * pScale, scaledH * pScale);
        pctx.restore();
        pctx.beginPath();
        pctx.arc(previewSize / 2, previewSize / 2, previewSize / 2 - 1, 0, Math.PI * 2);
        const pAccentHsl = getComputedStyle(document.documentElement).getPropertyValue('--accent-hsl-raw').trim() || '0 85% 55%';
        pctx.strokeStyle = `hsl(${pAccentHsl} / 0.4)`;
        pctx.lineWidth = 2;
        pctx.stroke();
      }
    }
  }, [image, zoom, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse/touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const touch = e.touches[0];
    setOffset({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
  };

  const handleCrop = () => {
    if (!canvasRef.current) return;

    // Create a final square canvas at a higher resolution
    const outputSize = 512;
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const octx = outputCanvas.getContext('2d');
    if (!octx || !image) return;

    // Draw the final cropped image
    octx.beginPath();
    octx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    octx.clip();

    const scaledW = image.width * zoom;
    const scaledH = image.height * zoom;
    const scale = outputSize / cropSize;
    const x = ((cropSize - scaledW) / 2 + offset.x) * scale;
    const y = ((cropSize - scaledH) / 2 + offset.y) * scale;
    octx.drawImage(image, x, y, scaledW * scale, scaledH * scale);

    outputCanvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      'image/webp',
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          <h3 className="text-lg font-bold font-syne">Crop Your Photo</h3>
          <button onClick={onCancel} className="p-1.5 hover:bg-background/50 rounded-lg smooth-transition" aria-label="Cancel">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Canvas area */}
        <div className="flex flex-col items-center gap-6 p-6">
          <div className="flex items-start gap-6">
            {/* Main crop canvas */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={cropSize}
                height={cropSize}
                className="cursor-grab active:cursor-grabbing rounded-full"
                style={{ width: cropSize, height: cropSize }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => setDragging(false)}
              />
              <p className="text-xs text-foreground/40 text-center mt-2">Drag to reposition</p>
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">Preview</p>
              <canvas
                ref={previewRef}
                width={previewSize}
                height={previewSize}
                className="rounded-full"
                style={{ width: previewSize, height: previewSize }}
              />
            </div>
          </div>

          {/* Zoom control */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <ZoomOut className="w-4 h-4 text-foreground/50 flex-shrink-0" />
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-accent h-1.5 cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-foreground/50 flex-shrink-0" />
          </div>

          {/* Reset */}
          <button
            onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
            className="text-xs text-foreground/40 hover:text-accent smooth-transition flex items-center gap-1"
          >
            <RotateCw className="w-3 h-3" /> Reset position
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-border/30">
          <button onClick={onCancel} className="luxury-button-outline px-5 py-2 text-sm">
            Cancel
          </button>
          <button onClick={handleCrop} className="luxury-button px-5 py-2 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> Crop & Upload
          </button>
        </div>
      </div>
    </div>
  );
}
