// lib/analytics/viewBuffer.ts
// Batches view events client-side and flushes periodically, so a single
// popular photo scrolling past many feed impressions does NOT translate
// into individual writes or function invocations per view — see Section 0
// constraint in the spec.

const pending = new Map<string, number>(); // photoId -> increment count
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 15_000;

export function recordView(photoId: string) {
  pending.set(photoId, (pending.get(photoId) ?? 0) + 1);
  if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  }
}

async function flush() {
  flushTimer = null;
  if (pending.size === 0) return;
  const batch = Array.from(pending.entries());
  pending.clear();

  // Single batched call — NOT one write per photo per view.
  try {
    await fetch('/api/views/flush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ increments: batch }), // [[photoId, count], ...]
    });
  } catch (err) {
    // On failure, put the increments back so they're retried on next flush.
    for (const [id, count] of batch) {
      pending.set(id, (pending.get(id) ?? 0) + count);
    }
    console.warn('[viewBuffer] flush failed, will retry:', err);
  }
}

// Flush on page unload so trailing views aren't lost.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pending.size) flush();
  });
}
