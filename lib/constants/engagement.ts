// lib/constants/engagement.ts
// Named, exported constants for engagement score weights.
// Keep this the ONLY place the formula is implemented so that
// client-side estimates and server-side truth never drift.

export const ENGAGEMENT_WEIGHTS = {
  LIKE: 3,
  COMMENT: 5,    // comments signal higher intent than likes
  VIEW: 0.1,     // views are high-volume/low-intent, weighted down accordingly
} as const;

/**
 * Compute the engagement score from raw counts.
 *
 * This is the canonical formula used both at write-time (inline in db.ts
 * mutation functions) and in the backfill script. Do not duplicate this
 * logic elsewhere.
 */
export function computeEngagementScore(
  likesCount: number,
  commentsCount: number,
  viewsCount: number,
): number {
  return (
    likesCount * ENGAGEMENT_WEIGHTS.LIKE +
    commentsCount * ENGAGEMENT_WEIGHTS.COMMENT +
    viewsCount * ENGAGEMENT_WEIGHTS.VIEW
  );
}
