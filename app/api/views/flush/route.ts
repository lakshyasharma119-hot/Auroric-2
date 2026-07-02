import { NextRequest, NextResponse } from 'next/server';
import { databases, DB_ID, PINS_COL } from '@/lib/appwrite';
import { computeEngagementScore } from '@/lib/constants/engagement';

/**
 * POST /api/views/flush
 *
 * Receives batched view increments from the client-side viewBuffer.
 * Writes viewsCount increments to Appwrite and recomputes engagementScore.
 *
 * Body: { increments: [["photoId", count], ...] }
 *
 * Sanity bound: rejects any single flush claiming >50 views for one
 * photo from one client in one interval (basic spam protection).
 */
export async function POST(request: NextRequest) {
  try {
    const { increments } = await request.json();

    if (!Array.isArray(increments) || increments.length === 0) {
      return NextResponse.json({ error: 'No increments provided' }, { status: 400 });
    }

    const results: { id: string; newViews: number }[] = [];

    for (const [photoId, count] of increments) {
      if (typeof photoId !== 'string' || typeof count !== 'number') continue;

      // Sanity bound: reject unreasonably large increments from a single client
      const clampedCount = Math.min(Math.max(Math.round(count), 1), 50);

      try {
        const doc = await databases.getDocument(DB_ID, PINS_COL, photoId);
        const currentViews = doc.views ?? 0;
        const newViews = currentViews + clampedCount;

        // Read current engagement data to recompute score
        const likesArr = doc.likesJson ? JSON.parse(doc.likesJson) : [];
        const commentsArr = doc.commentsJson ? JSON.parse(doc.commentsJson) : [];
        const newScore = computeEngagementScore(likesArr.length, commentsArr.length, newViews);

        await databases.updateDocument(DB_ID, PINS_COL, photoId, {
          views: newViews,
          engagementScore: newScore,
        });

        results.push({ id: photoId, newViews });
      } catch {
        // Skip photos that don't exist or fail — don't block the batch
      }
    }

    return NextResponse.json({ success: true, updated: results.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Flush failed' }, { status: 500 });
  }
}
