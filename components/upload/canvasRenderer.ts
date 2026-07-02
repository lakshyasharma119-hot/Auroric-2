'use client';

/**
 * canvasRenderer.ts — Off-screen HTML5 Canvas render utility.
 *
 * Takes the original image, exact cropped pixel coordinates from react-easy-crop,
 * and a CSS filter string, then renders a finalized image blob with everything
 * baked in. This is the crucial piece that eliminates the need to send the raw
 * original — the user gets a fully processed image.
 */

export interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Load an image from a URL and return an HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${err}`));
    img.src = src;
  });
}

/**
 * Render the final cropped + filtered image to a Blob.
 *
 * @param imageSrc       - Object URL or data URL of the source image
 * @param croppedArea    - Pixel coordinates from react-easy-crop's onCropComplete
 * @param filterCSS      - CSS filter string (e.g. "contrast(1.2) saturate(1.3)")
 * @param outputMaxSize  - Max dimension on the longest side (default: 2048)
 * @param quality        - WebP quality 0-1 (default: 0.92)
 * @returns              - A Promise<Blob> of the finalized image
 */
export async function renderFinalImage(
  imageSrc: string,
  croppedArea: CroppedAreaPixels,
  filterCSS: string = 'none',
  outputMaxSize: number = 2048,
  quality: number = 0.92,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  // Calculate output dimensions — scale to fit within outputMaxSize
  const longestSide = Math.max(croppedArea.width, croppedArea.height);
  const scale = longestSide > outputMaxSize ? outputMaxSize / longestSide : 1;
  const outW = Math.round(croppedArea.width * scale);
  const outH = Math.round(croppedArea.height * scale);

  // Create the off-screen canvas
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Apply the CSS filter string to the canvas context
  // This bakes filters (brightness, contrast, saturation, etc.) into the pixels
  if (filterCSS && filterCSS !== 'none') {
    ctx.filter = filterCSS;
  }

  // Draw the cropped region of the source image onto the canvas
  ctx.drawImage(
    image,
    // Source rectangle (from the original image)
    croppedArea.x,
    croppedArea.y,
    croppedArea.width,
    croppedArea.height,
    // Destination rectangle (the full output canvas)
    0,
    0,
    outW,
    outH,
  );

  // Convert to blob — prefer WebP for quality/size balance
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob returned null'));
        }
      },
      'image/webp',
      quality,
    );
  });
}

/**
 * Build a combined CSS filter string from individual adjustment values.
 * Values are expected in the range [-100, 100] where 0 is neutral.
 */
export function buildFilterString(adjustments: {
  brightness: number;
  contrast: number;
  saturation: number;
  fade: number;
  temperature: number;
}): string {
  const parts: string[] = [];

  // Brightness: 0 → 1.0 (neutral), -100 → 0.0, +100 → 2.0
  const brightness = 1 + adjustments.brightness / 100;
  parts.push(`brightness(${brightness.toFixed(3)})`);

  // Contrast: 0 → 1.0 (neutral), -100 → 0.0, +100 → 2.0
  const contrast = 1 + adjustments.contrast / 100;
  parts.push(`contrast(${contrast.toFixed(3)})`);

  // Saturation: 0 → 1.0 (neutral), -100 → 0.0, +100 → 2.0
  const saturation = 1 + adjustments.saturation / 100;
  parts.push(`saturate(${saturation.toFixed(3)})`);

  // Fade: applies as reduced contrast + raised brightness
  // 0 → no fade, +100 → heavy fade (washed out look)
  if (adjustments.fade > 0) {
    const fadeAmount = adjustments.fade / 100;
    const fadeContrast = 1 - fadeAmount * 0.4;
    const fadeBrightness = 1 + fadeAmount * 0.15;
    parts.push(`contrast(${fadeContrast.toFixed(3)})`);
    parts.push(`brightness(${fadeBrightness.toFixed(3)})`);
  }

  // Temperature: warm/cool shift via sepia + hue-rotate
  // Positive = warm (sepia-ish), Negative = cool (blue shift via hue-rotate)
  if (adjustments.temperature > 0) {
    const warmth = adjustments.temperature / 100;
    parts.push(`sepia(${(warmth * 0.3).toFixed(3)})`);
  } else if (adjustments.temperature < 0) {
    const coolness = Math.abs(adjustments.temperature) / 100;
    parts.push(`hue-rotate(${Math.round(coolness * 30)}deg)`);
    parts.push(`saturate(${(1 + coolness * 0.2).toFixed(3)})`);
  }

  return parts.join(' ');
}

/**
 * Predefined Instagram-style filter presets.
 * Each is a CSS filter string that can be applied directly.
 */
export interface FilterPreset {
  id: string;
  name: string;
  filter: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'original',
    name: 'Original',
    filter: 'none',
  },
  {
    id: 'clarendon',
    name: 'Clarendon',
    filter: 'contrast(1.2) saturate(1.35)',
  },
  {
    id: 'gingham',
    name: 'Gingham',
    filter: 'brightness(1.05) hue-rotate(-10deg) saturate(0.7)',
  },
  {
    id: 'moon',
    name: 'Moon',
    filter: 'grayscale(1) contrast(1.1) brightness(1.1)',
  },
  {
    id: 'lark',
    name: 'Lark',
    filter: 'contrast(0.9) brightness(1.15) saturate(1.2)',
  },
  {
    id: 'reyes',
    name: 'Reyes',
    filter: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)',
  },
  {
    id: 'juno',
    name: 'Juno',
    filter: 'contrast(1.15) saturate(1.8) sepia(0.08) brightness(1.05)',
  },
  {
    id: 'aden',
    name: 'Aden',
    filter: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)',
  },
  {
    id: 'crema',
    name: 'Crema',
    filter: 'sepia(0.15) contrast(0.9) brightness(1.05) saturate(0.9)',
  },
  {
    id: 'ludwig',
    name: 'Ludwig',
    filter: 'contrast(1.05) saturate(0.9) brightness(1.05) sepia(0.08)',
  },
  {
    id: 'perpetua',
    name: 'Perpetua',
    filter: 'brightness(1.1) saturate(1.1) contrast(1.05)',
  },
  {
    id: 'slumber',
    name: 'Slumber',
    filter: 'saturate(0.66) brightness(1.05) sepia(0.15) contrast(0.9)',
  },
];
