'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, ArrowLeft } from 'lucide-react';
import type { AspectRatioId } from '@/lib/constants/aspectRatios';
import CropStep from './CropStep';
import EditStep from './EditStep';
import { renderFinalImage, type CroppedAreaPixels } from './canvasRenderer';

// ── Upload flow state machine ──
// Simplified: idle → cropping → editing → done | error
// The aspect ratio selection is now inline within the crop step (like Instagram).
export type UploadFlowStep =
  | 'idle'
  | 'cropping'
  | 'editing'
  | 'done'
  | 'error';

export interface UploadFlowResult {
  croppedBlob: Blob;
  croppedPreviewUrl: string;
  aspectRatioId: AspectRatioId;
}

interface UploadFlowModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when user closes/cancels the modal */
  onClose: () => void;
  /**
   * Called when the full flow completes — crop + edit confirmed and canvas
   * has rendered the finalized image blob.
   */
  onComplete: (result: UploadFlowResult) => void;
}

/**
 * UploadFlowModal — Instagram-grade image upload flow.
 *
 * State machine transitions:
 *   idle ──[file selected]──► cropping
 *   cropping ──[crop confirmed]──► editing
 *   cropping ──[cancel]──► idle
 *   editing ──[back]──► cropping
 *   editing ──[confirm]──► (canvas render) → done → onComplete
 *   error ──[retry]──► idle
 *
 * Step 1 (Crop): react-easy-crop with inline aspect ratio picker + zoom slider
 * Step 2 (Edit): Instagram-style filters & manual adjustments
 * Step 3 (Render): Off-screen canvas bakes crop + filters into a final blob
 */
export default function UploadFlowModal({
  open,
  onClose,
  onComplete,
}: UploadFlowModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<UploadFlowStep>('idle');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRendering, setIsRendering] = useState(false);

  // Persisted across crop → edit flow
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioId | null>(null);

  const resetAll = useCallback(() => {
    setStep('idle');
    setImageFile(null);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl('');
    setCroppedAreaPixels(null);
    setSelectedRatio(null);
    setErrorMessage('');
    setIsRendering(false);
  }, [imageUrl]);

  const handleClose = useCallback(() => {
    resetAll();
    onClose();
  }, [resetAll, onClose]);

  // ── idle → cropping: user selects a file ──
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file.');
        setStep('error');
        return;
      }

      // Revoke any previous URL
      if (imageUrl) URL.revokeObjectURL(imageUrl);

      const url = URL.createObjectURL(file);
      setImageFile(file);
      setImageUrl(url);
      setStep('cropping');

      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [imageUrl],
  );

  // ── cropping → editing: user confirms crop ──
  const handleCropNext = useCallback(
    (cropPixels: CroppedAreaPixels, ratioId: AspectRatioId) => {
      setCroppedAreaPixels(cropPixels);
      setSelectedRatio(ratioId);
      setStep('editing');
    },
    [],
  );

  // ── cropping cancel → idle ──
  const handleCropCancel = useCallback(() => {
    resetAll();
  }, [resetAll]);

  // ── editing → back to cropping ──
  const handleEditBack = useCallback(() => {
    setStep('cropping');
  }, []);

  // ── editing → done: render final image on canvas and complete ──
  const handleEditConfirm = useCallback(
    async (filterCSS: string) => {
      if (!croppedAreaPixels || !selectedRatio || !imageUrl) {
        setErrorMessage('Missing crop data. Please start over.');
        setStep('error');
        return;
      }

      setIsRendering(true);

      try {
        const blob = await renderFinalImage(
          imageUrl,
          croppedAreaPixels,
          filterCSS,
        );

        const previewUrl = URL.createObjectURL(blob);

        onComplete({
          croppedBlob: blob,
          croppedPreviewUrl: previewUrl,
          aspectRatioId: selectedRatio,
        });

        // Reset internal state for potential reuse
        resetAll();
      } catch (err: any) {
        console.error('Canvas render failed:', err);
        setErrorMessage(err.message || 'Failed to process image. Please try again.');
        setStep('error');
        setIsRendering(false);
      }
    },
    [croppedAreaPixels, selectedRatio, imageUrl, onComplete, resetAll],
  );

  if (!open) return null;

  // Step titles for the header
  const stepTitle =
    step === 'idle'
      ? 'Upload Image'
      : step === 'cropping'
        ? 'Crop'
        : step === 'editing'
          ? 'Edit'
          : step === 'error'
            ? 'Error'
            : 'Processing…';

  const stepSubtitle =
    step === 'cropping'
      ? 'Pan, zoom, and pick an aspect ratio'
      : step === 'editing'
        ? 'Apply filters & adjustments'
        : undefined;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-slideUp max-h-[90vh] flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 border-b border-border/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Back button in edit step */}
            {step === 'editing' && (
              <button
                type="button"
                onClick={handleEditBack}
                className="p-1.5 hover:bg-background/50 rounded-lg smooth-transition"
                aria-label="Go back to crop"
              >
                <ArrowLeft className="w-4 h-4 text-foreground/60" />
              </button>
            )}

            <div>
              <h3 className="text-lg font-bold font-syne">{stepTitle}</h3>
              {stepSubtitle && (
                <p className="text-xs text-foreground/45 mt-0.5">{stepSubtitle}</p>
              )}
            </div>
          </div>

          {/* Step indicator pills */}
          {(step === 'cropping' || step === 'editing') && (
            <div className="flex items-center gap-1.5 mr-4">
              <div
                className={`h-1.5 rounded-full smooth-transition ${
                  step === 'cropping' ? 'w-6 bg-accent' : 'w-3 bg-accent/30'
                }`}
              />
              <div
                className={`h-1.5 rounded-full smooth-transition ${
                  step === 'editing' ? 'w-6 bg-accent' : 'w-3 bg-accent/30'
                }`}
              />
            </div>
          )}

          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-background/50 rounded-lg smooth-transition"
            aria-label="Close upload modal"
          >
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Step: Idle — file selection */}
          {step === 'idle' && (
            <div className="p-8 flex flex-col items-center justify-center min-h-[320px]">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                aria-label="Upload image file"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border/40 hover:border-accent/50 rounded-2xl p-12 cursor-pointer group smooth-transition flex flex-col items-center justify-center"
              >
                <div className="mb-4 p-4 rounded-full bg-accent/10 group-hover:bg-accent/20 smooth-transition">
                  <Upload className="w-10 h-10 text-accent" />
                </div>
                <p className="text-lg font-semibold text-foreground mb-1">
                  Click or drag to upload
                </p>
                <p className="text-sm text-foreground/50">
                  Supports JPG, PNG, WebP, GIF
                </p>
              </div>
            </div>
          )}

          {/* Step: Cropping — react-easy-crop */}
          {step === 'cropping' && imageUrl && (
            <CropStep
              imageUrl={imageUrl}
              onNext={handleCropNext}
              onCancel={handleCropCancel}
            />
          )}

          {/* Step: Editing — filters & adjustments */}
          {step === 'editing' && imageUrl && croppedAreaPixels && (
            <EditStep
              imageUrl={imageUrl}
              croppedAreaPixels={croppedAreaPixels}
              onBack={handleEditBack}
              onConfirm={handleEditConfirm}
            />
          )}

          {/* Step: Rendering overlay */}
          {isRendering && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
                <p className="text-sm text-foreground/70 font-medium">
                  Rendering final image…
                </p>
              </div>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="p-8 flex flex-col items-center justify-center min-h-[240px] text-center animate-slideUp">
              <div className="mb-4 p-3 rounded-full bg-destructive/20">
                <X className="w-8 h-8 text-destructive" />
              </div>
              <h4 className="text-xl font-bold mb-2">Something went wrong</h4>
              <p className="text-foreground/60 mb-6 max-w-sm">
                {errorMessage || 'Please try again.'}
              </p>
              <button onClick={resetAll} className="luxury-button-outline px-5 py-2 text-sm">
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
