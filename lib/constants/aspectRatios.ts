// lib/constants/aspectRatios.ts
// SINGLE SOURCE OF TRUTH for all supported aspect ratios.
// Adding a new entry here propagates to: upload UI buttons, cropper,
// masonry sizing engine, and Appwrite enum validation.
//
// TODO(appwrite): When a new ratio is added here, the Appwrite collection
// enum for `aspectRatioId` on the `pins` collection must also be updated
// manually via the Appwrite Console/CLI — client code cannot auto-migrate
// the schema.

export type AspectRatioId =
  | 'square_1_1'
  | 'landscape_3_2'
  | 'portrait_2_3'
  | 'classic_4_3'
  | 'classic_port_3_4'
  | 'vertical_9_16'
  | 'widescreen_16_9';

export interface AspectRatioDefinition {
  id: AspectRatioId;
  label: string;       // "Square (1:1)"
  shortLabel: string;  // "1:1"
  ratioW: number;      // 1
  ratioH: number;      // 1
  decimal: number;     // ratioW / ratioH — used directly by the masonry engine
}

export const ASPECT_RATIOS: Record<AspectRatioId, AspectRatioDefinition> = {
  square_1_1:       { id: 'square_1_1',       label: 'Square (1:1)',        shortLabel: '1:1',  ratioW: 1,  ratioH: 1,  decimal: 1 },
  landscape_3_2:    { id: 'landscape_3_2',    label: 'Landscape (3:2)',     shortLabel: '3:2',  ratioW: 3,  ratioH: 2,  decimal: 1.5 },
  portrait_2_3:     { id: 'portrait_2_3',     label: 'Portrait (2:3)',      shortLabel: '2:3',  ratioW: 2,  ratioH: 3,  decimal: 0.667 },
  classic_4_3:      { id: 'classic_4_3',      label: 'Classic (4:3)',       shortLabel: '4:3',  ratioW: 4,  ratioH: 3,  decimal: 1.333 },
  classic_port_3_4: { id: 'classic_port_3_4', label: 'Classic Port. (3:4)', shortLabel: '3:4',  ratioW: 3,  ratioH: 4,  decimal: 0.75 },
  vertical_9_16:    { id: 'vertical_9_16',    label: 'Vertical (9:16)',     shortLabel: '9:16', ratioW: 9,  ratioH: 16, decimal: 0.5625 },
  widescreen_16_9:  { id: 'widescreen_16_9',  label: 'Widescreen (16:9)',   shortLabel: '16:9', ratioW: 16, ratioH: 9,  decimal: 1.778 },
};

export const ASPECT_RATIO_LIST: AspectRatioDefinition[] = Object.values(ASPECT_RATIOS);

/** Default aspect ratio for pins with no stored ratio — explicit fallback to square. */
export const DEFAULT_ASPECT_RATIO_ID: AspectRatioId = 'square_1_1';
