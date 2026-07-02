/**
 * scripts/backfill-aspect-ratios.ts
 *
 * ONE-TIME MIGRATION SCRIPT for existing pins that have no aspectRatioId
 * or engagementScore data.
 *
 * What it does:
 * 1. Iterates all pins in the database
 * 2. If a pin has no accurate aspectRatioId:
 *    - It downloads the image from `imageUrl`
 *    - Measures its true dimensions using `image-size`
 *    - Maps it to the closest supported AspectRatioId
 * 3. Backfills engagementScore if missing
 *
 * Usage:
 *   npx tsx scripts/backfill-aspect-ratios.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { databases, DB_ID, PINS_COL } from '../lib/appwrite';
import { Query } from 'node-appwrite';
import https from 'https';
import http from 'http';
import sizeOf from 'image-size';

// ── Aspect Ratio mapping ──
const ASPECT_RATIOS = [
  { id: 'square_1_1', decimal: 1 },
  { id: 'landscape_3_2', decimal: 1.5 },
  { id: 'portrait_2_3', decimal: 0.667 },
  { id: 'classic_4_3', decimal: 1.333 },
  { id: 'classic_port_3_4', decimal: 0.75 },
  { id: 'vertical_9_16', decimal: 0.5625 },
  { id: 'widescreen_16_9', decimal: 1.778 },
];

function closestAspectRatioId(width: number, height: number): string {
  const actual = width / height;
  let best = ASPECT_RATIOS[0];
  let bestDiff = Math.abs(actual - best.decimal);
  for (const ratio of ASPECT_RATIOS) {
    const diff = Math.abs(actual - ratio.decimal);
    if (diff < bestDiff) { best = ratio; bestDiff = diff; }
  }
  return best.id;
}

// ── Engagement score ──
const ENGAGEMENT_WEIGHTS = { LIKE: 3, COMMENT: 5, VIEW: 0.1 };

function computeScore(likesCount: number, commentsCount: number, viewsCount: number): number {
  return (
    likesCount * ENGAGEMENT_WEIGHTS.LIKE +
    commentsCount * ENGAGEMENT_WEIGHTS.COMMENT +
    viewsCount * ENGAGEMENT_WEIGHTS.VIEW
  );
}

// ── Fetch image buffer ──
async function getImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // handle redirect if any
        return getImageBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const data: Buffer[] = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

// ── Batch processing ──
async function backfillBatch(offset: number): Promise<number> {
  const res = await databases.listDocuments(DB_ID, PINS_COL, [
    Query.limit(100),
    Query.offset(offset),
  ]);

  console.log('\n--- VERIFICATION TABLE ---');
  console.log('ID | Title | Old Ratio | New Ratio | Measured WxH');

  for (const photo of res.documents) {
    const updates: Record<string, any> = {};
    let oldRatio = photo.aspectRatioId || 'none';
    let newRatio = oldRatio;
    let dimensionsStr = 'unknown';

    // 1. Force recalculate aspectRatioId by downloading the image
    // (We do this for all pins to ensure correctness since they were randomized/broken)
    try {
      const buffer = await getImageBuffer(photo.imageUrl);
      const dimensions = sizeOf(buffer);
      if (dimensions.width && dimensions.height) {
        dimensionsStr = `${dimensions.width}x${dimensions.height}`;
        newRatio = closestAspectRatioId(dimensions.width, dimensions.height);
        
        // Update if it's different or missing
        if (photo.aspectRatioId !== newRatio) {
          updates.aspectRatioId = newRatio;
        }
      }
    } catch (err: any) {
      console.log(`[WARN] Could not measure image for ${photo.$id}: ${err.message}`);
    }

    // 2. Backfill engagementScore if missing
    if (photo.engagementScore === undefined || photo.engagementScore === null) {
      let likesCount = 0;
      let commentsCount = 0;
      try {
        const likes = photo.likesJson ? JSON.parse(photo.likesJson) : [];
        const comments = photo.commentsJson ? JSON.parse(photo.commentsJson) : [];
        likesCount = likes.length;
        commentsCount = comments.length;
      } catch { /* use 0 */ }

      const viewsCount = photo.views ?? 0;
      updates.engagementScore = computeScore(likesCount, commentsCount, viewsCount);
    }

    console.log(`${photo.$id} | ${photo.title?.substring(0, 15)} | ${oldRatio} -> ${newRatio} | ${dimensionsStr}`);

    if (Object.keys(updates).length > 0) {
      try {
        await databases.updateDocument(DB_ID, PINS_COL, photo.$id, updates);
      } catch (err: any) {
        console.error(`✗ Failed updating ${photo.$id}:`, err.message);
      }
    }
  }

  return res.total;
}

async function run() {
  console.log('Starting precise backfill using image-size...');
  
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    total = await backfillBatch(offset);
    offset += 100;
  }

  console.log(`\nBackfill complete. Processed ${total} photos.`);
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
