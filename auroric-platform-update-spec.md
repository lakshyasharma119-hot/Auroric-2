# Auroric Platform Update — Engineering Specification
**For: Autonomous coding agent (Opus-class model in Antigravity)**
**Stack: Next.js (App Router) + Tailwind CSS + Appwrite (Database, Storage, Functions)**
**Revision: v3 (final) — reconciled against existing repo docs (`DESIGN_SYSTEM.md`, `COMPONENTS_API.md`); supersedes specific stale sections of both, see Section -1.**

---

## -1. Reconciliation With Existing Repo Documentation — READ FIRST

This repo already contains `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `COMPONENTS_API.md`, and other docs from prior work. **This section is the explicit, confirmed resolution of every place this spec conflicts with those docs.** The agent must treat the rulings below as authoritative — do not silently follow the older docs where they're contradicted here, and do not silently follow this spec where it's silent and the older docs already have an answer (e.g. typography, spacing scale, animation classes below are untouched and still govern).

### Confirmed rulings (user-decided, not inferred):

1. **`DESIGN_SYSTEM.md`'s color palette (purple `#7C4A8F` / gold `#D4AF37`) and its "no light mode required" statement are CONFIRMED STALE.** The palette and theme system actually in use is the one shown in the reference screenshots for this spec: Obsidian & Crimson / Fiery Sunset / Quiet Luxury / Modern Editorial, plus the new Standard Dark/Light modes defined in Task 2 of this document. **Do not use `#7C4A8F`, `#D4AF37`, or the `bg-primary`/`bg-accent`-as-gold token meanings from `DESIGN_SYSTEM.md`.** The light-mode toggle requested in Task 2 is a deliberate, confirmed new requirement that overrides the old "dark mode only" decision — this is not an oversight to flag back to the user, it's settled.
   - **Action:** update `DESIGN_SYSTEM.md` itself once this ships, so it stops contradicting the live app. Don't leave it stale for the next person/agent who reads it.
   - Typography (Playfair Display / Inter), spacing scale, breakpoints, animation class names (`animate-fadeIn`, `animate-slideUp`, etc.), and accessibility/WCAG guidance in `DESIGN_SYSTEM.md` are **unaffected by this ruling** and remain in force — only the color palette and the light-mode exclusion are overridden.

2. **`COMPONENTS_API.md`'s existing `PinCard` component (`components/pin-card.tsx`) is CONFIRMED to need modification, not replacement.** Do not build a parallel/duplicate card component for the masonry grid. Extend `PinCard` in place — see Section 1.3.1 below for the exact prop and styling additions required. The existing props (`id, title, description, image, author, likes, comments, board, isLiked`) are preserved; new props are additive.

3. **The `.pin-card` CSS class in `DESIGN_SYSTEM.md`/`COMPONENTS_API.md` (16px radius, transparent surface, border-shifts-to-accent-on-hover) is preserved as the visual base** — the masonry/theme work in this spec changes *what `--accent` and surface colors resolve to* (per ruling 1) and *how the card is sized/positioned* (per ruling 2), but does not redesign the card's existing shape, radius, or hover behavior. Treat this as a constraint, not a rewrite target.

4. **The repo also contains E2EE messaging/blocking scaffolding** (`E2EE_README.md`, `E2EE_IMPLEMENTATION_GUIDE.md`, `QUICK_REFERENCE_E2EE.md`, plus referenced `lib/cryptoUtils.ts`, `components/ChatWindow.tsx`, Supabase migration SQL, etc.) — **CONFIRMED unused/never integrated.** This is leftover scaffolding from an earlier, separate attempt at a direct-messaging feature, built against **Supabase**, not Appwrite. It has no relationship to this spec and no relationship to the live app. **Do not** treat its `messages`/`blocked_users`/`users.public_key` tables as real, do not wire the photo upload or theme work into it, and do not infer that the app runs on Supabase anywhere else just because this scaffolding references it. The live backend for everything in this spec is Appwrite, full stop. This E2EE work may be revisited in a future update, but it is explicitly out of scope here.

### Why this section exists
Without an explicit reconciliation pass, an agent reading both this spec and the pre-existing repo docs in the same context could plausibly do any of: follow the stale purple/gold palette because it's already wired into Tailwind config; build a second, parallel grid card component alongside `PinCard` because this spec's original `renderCard()` callback didn't reference it; or silently skip the light-mode work because `DESIGN_SYSTEM.md` says it's not required. All three would produce a working build that diverges from what was actually decided. The rulings above close each of those paths.

---

---

## 0. Context & Non-Negotiable Constraints

Auroric is a Pinterest-style image board. The current UI (see reference screenshots) has:
- A card-based feed grid (`Sunlight Aesthetic Pic`, `Haircut`, `Microsoft`, etc.) with title, author avatar, like/comment/view counts, and a relative timestamp ("2mo ago", "1d ago").
- A floating bottom dock/toolbar (logo, globe, trending, grid, lightning, people, avatar icons).
- A category filter bar (`All`, `All`, `Photography`, `Beauty`, `Nature`).
- A dark-mode-only "Choose Theme" popover with 4 custom themes, and a fuller "Settings & Appearance" page with the same 4 themes as large swatch cards (Obsidian & Crimson is currently active/selected with a red checkmark).
- A current theme toggle that appears to be a simple icon button (moon icon visible in the top nav), **not** the animated slider shown in the target mockups (orange pill switch with sliding sun/moon/stars graphic).

**Backend: Appwrite.** This has one hard architectural consequence the agent must respect:

> ⚠️ **Appwrite Database does not support SQL-style aggregate queries (no `SUM`, `GROUP BY`, computed `ORDER BY` expressions).** Appwrite queries can only sort on **existing stored attributes** (`Query.orderDesc('fieldName')`, max 100 order attributes, each indexed). Therefore, the "trending score" used in Task 1 **must be a pre-computed, denormalized numeric attribute stored on each Photo document** (e.g. `engagementScore: number`), recalculated by an Appwrite Function whenever likes/comments/views change — **not** computed live in the query. Do not write code that attempts a live aggregate sort across `likes + comments + views` directly in a query call; it will fail or silently degrade to client-side sorting on a partial page, which breaks pagination. Flag this explicitly in code comments wherever the score is calculated.

---

## TASK 1: Dynamic Masonry Grid & Upload Constraints

### 1.1 Data Model

Define a single source of truth for aspect ratios so adding new ones later is a one-line change, not a refactor.

```ts
// lib/constants/aspectRatios.ts

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
  label: string;        // "Square (1:1)"
  shortLabel: string;   // "1:1"
  ratioW: number;        // 1
  ratioH: number;        // 1
  decimal: number;       // ratioW / ratioH — used directly by the masonry engine
}

// SINGLE SOURCE OF TRUTH — add a new entry here and it propagates to:
// upload UI buttons, cropper, masonry sizing engine, and Appwrite enum validation.
export const ASPECT_RATIOS: Record<AspectRatioId, AspectRatioDefinition> = {
  square_1_1:        { id: 'square_1_1',        label: 'Square (1:1)',        shortLabel: '1:1',  ratioW: 1,  ratioH: 1,  decimal: 1 },
  landscape_3_2:     { id: 'landscape_3_2',     label: 'Landscape (3:2)',     shortLabel: '3:2',  ratioW: 3,  ratioH: 2,  decimal: 1.5 },
  portrait_2_3:      { id: 'portrait_2_3',      label: 'Portrait (2:3)',      shortLabel: '2:3',  ratioW: 2,  ratioH: 3,  decimal: 0.667 },
  classic_4_3:       { id: 'classic_4_3',       label: 'Classic (4:3)',       shortLabel: '4:3',  ratioW: 4,  ratioH: 3,  decimal: 1.333 },
  classic_port_3_4:  { id: 'classic_port_3_4',  label: 'Classic Port. (3:4)', shortLabel: '3:4',  ratioW: 3,  ratioH: 4,  decimal: 0.75 },
  vertical_9_16:     { id: 'vertical_9_16',     label: 'Vertical (9:16)',     shortLabel: '9:16', ratioW: 9,  ratioH: 16, decimal: 0.5625 },
  widescreen_16_9:   { id: 'widescreen_16_9',   label: 'Widescreen (16:9)',   shortLabel: '16:9', ratioW: 16, ratioH: 9,  decimal: 1.778 },
};

export const ASPECT_RATIO_LIST: AspectRatioDefinition[] = Object.values(ASPECT_RATIOS);
```

**Appwrite collection field requirement:** add an enum (or string) attribute `aspectRatioId` to the `photos` collection restricted to the keys above. When a new ratio is added to this file, the agent must also note in a `// TODO(appwrite)` comment that the Appwrite collection enum needs the matching value added via the Appwrite console/CLI — **client code cannot auto-migrate the schema**, so this is the one manual step that future-proofing cannot eliminate. Say this explicitly to the user rather than implying full automation.

### 1.2 Upload Flow — Hard Cropping (per decision: crop, don't letterbox)

**Flow:**
1. User selects/drops an image file.
2. **Block all further upload UI** until an aspect ratio is chosen — render the 7 ratio buttons (from `ASPECT_RATIO_LIST`, not hardcoded JSX) as a required form field (see reference mockup: two-row pill button group, `Aspect Ratio *` with helper text "Select an aspect ratio for optimal feed presentation").
3. On ratio selection, mount an interactive cropper locked to `decimal` from the chosen `AspectRatioDefinition` (use `react-easy-crop` or `react-image-crop` — do not hand-roll crop math).
4. User adjusts crop box (pan/zoom), confirms.
5. Client crops the image to a canvas at the target ratio, exports as a single optimized file (WebP preferred, JPEG fallback), and **only the cropped output is uploaded** to Appwrite Storage.
6. On the created Storage file, write a corresponding `photos` document with: `storageFileId`, `aspectRatioId`, `width`, `height` (the *cropped* dimensions, not the original), `title`, `authorId`, `createdAt`, and `engagementScore` initialized to `0`.

**Required component breakdown:**
- `<AspectRatioPicker selected={id} onSelect={(id) => ...} />` — purely driven by `ASPECT_RATIO_LIST`, renders as a wrapping flex/grid of pill buttons identical in style to the reference mockup.
- `<ImageCropper file={file} ratio={decimal} onCropComplete={(blob) => ...} />` — wraps the cropping library, exposes a confirm/cancel action.
- `<UploadFlowModal />` — orchestrates picker → cropper → upload → progress state. Enforce step order with a simple state machine (`'idle' | 'ratio_selection' | 'cropping' | 'uploading' | 'done' | 'error'`) — do not allow skipping `ratio_selection`.

**Validation rule (hard requirement):** the upload mutation function must reject (throw, not silently proceed) if `aspectRatioId` is missing or not a key of `ASPECT_RATIOS`. This is the actual enforcement point — the UI gating is a UX nicety, the mutation guard is the real constraint.

### 1.3 Masonry Grid Component

**Goal:** seamless interlocking layout with no awkward gaps, fully responsive, driven by each photo's known `aspectRatioId` (we know the exact ratio up front because of the hard-crop step — this is what makes "no gaps" tractable instead of guesswork).

**Recommended approach:** CSS columns or a packed-column JS layout (e.g. a lightweight custom column-balancer, or `react-masonry-css` as a starting point) — **not** CSS Grid `grid-template-rows: masonry` (not supported across browsers as of this writing; verify current support before relying on it) and **not** a naive `flex-wrap` row layout (that's what causes the gaps the spec calls out).

**Algorithm (column-balanced masonry):**
1. Determine column count responsively: 2 cols mobile (`<640px`), 3 cols tablet (`<1024px`), 4–5 cols desktop (configurable breakpoints via Tailwind `sm/md/lg/xl`).
2. For each incoming photo (in trending order, see 1.4), compute its rendered height at the current column width using its known `decimal` ratio: `renderedHeight = columnWidth / decimal`.
3. Assign each photo to the column with the current **shortest accumulated height** (greedy bin-packing — this is the standard masonry algorithm and is what actually prevents gaps, since it accounts for real heights rather than just round-robin index assignment).
4. Re-balance on viewport resize (debounced) and when new photos are appended (infinite scroll / "load more").

```tsx
// components/masonry/MasonryGrid.tsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AspectRatioId } from '@/lib/constants/aspectRatios';
import { ASPECT_RATIOS } from '@/lib/constants/aspectRatios';

interface MasonryItem {
  id: string;
  aspectRatioId: AspectRatioId;
  // ...other photo fields used by the card renderer
}

interface MasonryGridProps<T extends MasonryItem> {
  items: T[];
  renderCard: (item: T, columnWidth: number) => React.ReactNode;
  columns?: { base: number; sm: number; md: number; lg: number; xl: number };
}

export function MasonryGrid<T extends MasonryItem>({
  items,
  renderCard,
  columns = { base: 1, sm: 2, md: 3, lg: 4, xl: 5 },
}: MasonryGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(columns.lg);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setContainerWidth(w);
      if (w < 480) setColumnCount(columns.base);
      else if (w < 768) setColumnCount(columns.sm);
      else if (w < 1024) setColumnCount(columns.md);
      else if (w < 1280) setColumnCount(columns.lg);
      else setColumnCount(columns.xl);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [columns]);

  const gap = 16; // px — keep in sync with Tailwind gap-4 used below
  const columnWidth = columnCount > 0
    ? (containerWidth - gap * (columnCount - 1)) / columnCount
    : 0;

  // Greedy shortest-column packing — prevents the gap problem the spec calls out.
  const columnBuckets = useMemo(() => {
    const heights = new Array(columnCount).fill(0);
    const buckets: T[][] = Array.from({ length: columnCount }, () => []);
    for (const item of items) {
      const ratio = ASPECT_RATIOS[item.aspectRatioId]?.decimal ?? 1;
      const itemHeight = columnWidth / ratio;
      let shortest = 0;
      for (let i = 1; i < columnCount; i++) {
        if (heights[i] < heights[shortest]) shortest = i;
      }
      buckets[shortest].push(item);
      heights[shortest] += itemHeight + gap;
    }
    return buckets;
  }, [items, columnCount, columnWidth]);

  return (
    <div ref={containerRef} className="flex w-full gap-4">
      {columnBuckets.map((bucket, colIdx) => (
        <div key={colIdx} className="flex flex-1 flex-col gap-4">
          {bucket.map((item) => renderCard(item, columnWidth))}
        </div>
      ))}
    </div>
  );
}
```

> **Note for the agent:** this greedy algorithm is "good enough" masonry (used by Pinterest-style sites in practice) — it is not a true optimal bin-packing solution, and that's fine. Do not over-engineer this into a constraint solver. Flag in a comment that re-running the full bucket assignment on every new batch of items (rather than only appending to the shortest column) is intentional — recomputing from scratch keeps columns balanced as new items of varying ratios arrive, at an acceptable cost for feed-sized item counts (≤50 per the landing page constraint below; for larger paginated views consider appending-only for performance).

#### 1.3.1 `PinCard` modifications required (per ruling #2 in Section -1)

`PinCard` (`components/pin-card.tsx`) currently assumes it controls its own dimensions via whatever its internal image styling does — that's incompatible with masonry, which needs to assign each card an exact rendered height *before* layout so the greedy packer can place it without reflow. Extend the existing prop interface; **do not remove or rename existing props.**

```typescript
// components/pin-card.tsx — additive changes to the existing PinCardProps
interface PinCardProps {
  // ...existing props unchanged: id, title, description, image, author, likes, comments, board, isLiked

  // NEW — required for masonry integration:
  aspectRatioId: AspectRatioId;   // drives the card's image aspect-ratio CSS, see below
  columnWidth?: number;           // px width assigned by MasonryGrid; card sizes its image to this
}
```

Inside the component, the existing `<img>`/`<Image>` wrapper needs a CSS `aspect-ratio` set from `ASPECT_RATIOS[aspectRatioId].ratioW / ratioH` (or the precomputed `decimal`) instead of whatever fixed/auto sizing it currently uses — this is the one rendering change required, everything else about `PinCard`'s markup, hover behavior, like/share buttons, and the `.pin-card` class itself stays as documented in `COMPONENTS_API.md`.

```tsx
// Inside PinCard, replace the image container's sizing with:
<div
  className="relative w-full overflow-hidden rounded-2xl"
  style={{ aspectRatio: `${ASPECT_RATIOS[aspectRatioId].ratioW} / ${ASPECT_RATIOS[aspectRatioId].ratioH}` }}
>
  <Image src={image} alt={title} fill className="object-cover" />
</div>
```

**`MasonryGrid` usage with the real component** (replaces any generic/placeholder `renderCard` example elsewhere in this doc — `PinCard` is the only card renderer used in production, there is no second card component):

```tsx
<MasonryGrid
  items={trendingPhotos}
  renderCard={(photo, columnWidth) => (
    <PinCard
      key={photo.id}
      id={photo.id}
      title={photo.title}
      image={photo.imageUrl}
      author={photo.author}
      likes={photo.likesCount}
      comments={photo.commentsCount}
      board={photo.board}
      aspectRatioId={photo.aspectRatioId}
      columnWidth={columnWidth}
    />
  )}
/>
```

`MasonryGrid` itself stays generic (the `renderCard` callback pattern in 1.3 is correct and doesn't need to change) — the fix here is entirely in *what gets passed to it*, not in the grid component's own implementation.

### 1.4 Landing Page Query — Top 50 Trending

**Per the constraint in Section 0:** the engagement score is **not computed at query time**. It is a stored attribute, kept fresh by a write-time trigger.

**Appwrite schema addition (`photos` collection):**
- `engagementScore: number` (indexed, required, default `0`)

**Score formula (weighted, as decided):**
```
engagementScore = (likesCount * W_LIKE) + (commentsCount * W_COMMENT) + (viewsCount * W_VIEW)
```
Recommended starting weights — tune later, but the agent should make these named, exported constants, not magic numbers inline:
```ts
// lib/constants/engagement.ts
export const ENGAGEMENT_WEIGHTS = {
  LIKE: 3,
  COMMENT: 5,   // comments signal higher intent than likes
  VIEW: 0.1,    // views are high-volume/low-intent, weighted down accordingly
} as const;
```

**Recalculation trigger:** an Appwrite Function (event-triggered on `databases.*.collections.likes.documents.*.create/delete`, `...comments...create/delete`, and a throttled/batched handler for view increments — views should NOT trigger a function invocation per view, that's a cost and rate-limit problem) that recomputes and writes `engagementScore` back onto the parent `photos` document.

- For likes/comments: trigger on create/delete is fine, volumes are naturally low.
- For views: **do not** fire a function per view event. Instead, increment a `viewsCount` counter client-side via a debounced/batched endpoint (or buffer view events and flush every N seconds/views), and only recompute `engagementScore` on a scheduled Appwrite Function (e.g. every 5–15 minutes) or opportunistically alongside the next like/comment trigger. Say this tradeoff explicitly in code comments — recomputing the score on every single view at scale will exhaust Appwrite Function invocation limits and add unnecessary write load.

**Landing page query:**
```ts
// lib/appwrite/queries/getTrendingPhotos.ts
import { Query } from 'appwrite';
import { databases } from '@/lib/appwrite/client';

export async function getTrendingPhotos() {
  return databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    process.env.NEXT_PUBLIC_APPWRITE_PHOTOS_COLLECTION_ID!,
    [
      Query.orderDesc('engagementScore'),
      Query.limit(50), // HARD CAP per spec — landing page never fetches more than this
    ]
  );
}
```

Require a composite/single-field index on `engagementScore` in the Appwrite collection settings (sorting on an unindexed attribute degrades badly at scale — call this out as a setup step, not just code).

#### 1.4.1 Appwrite Function — `recalcEngagementScore` (concrete implementation)

This is the actual function body referenced above. Deploy as a Node.js Appwrite Function with **two separate trigger configurations**, because likes/comments and views have different volume profiles (see rationale above) — do not merge these into one trigger path.

**`functions/recalc-engagement-score/src/main.js`**
```js
import { Client, Databases, Query } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const PHOTOS_COLLECTION_ID = process.env.APPWRITE_PHOTOS_COLLECTION_ID;
const LIKES_COLLECTION_ID = process.env.APPWRITE_LIKES_COLLECTION_ID;
const COMMENTS_COLLECTION_ID = process.env.APPWRITE_COMMENTS_COLLECTION_ID;

const ENGAGEMENT_WEIGHTS = { LIKE: 3, COMMENT: 5, VIEW: 0.1 };

// Shared scoring logic — keep this the ONLY place the formula is implemented,
// so client-side estimates (if any, e.g. optimistic UI) and server truth never drift.
function computeScore({ likesCount, commentsCount, viewsCount }) {
  return (
    likesCount * ENGAGEMENT_WEIGHTS.LIKE +
    commentsCount * ENGAGEMENT_WEIGHTS.COMMENT +
    viewsCount * ENGAGEMENT_WEIGHTS.VIEW
  );
}

async function recalcOnePhoto(databases, photoId, log) {
  const photo = await databases.getDocument(DATABASE_ID, PHOTOS_COLLECTION_ID, photoId);

  // Counts are read fresh rather than trusted from the event payload, since the
  // event only tells us "a like/comment changed" — not the current total.
  const [likesRes, commentsRes] = await Promise.all([
    databases.listDocuments(DATABASE_ID, LIKES_COLLECTION_ID, [
      Query.equal('photoId', photoId),
      Query.limit(1), // we only need the total count, see Query.total below
    ]),
    databases.listDocuments(DATABASE_ID, COMMENTS_COLLECTION_ID, [
      Query.equal('photoId', photoId),
      Query.limit(1),
    ]),
  ]);

  const likesCount = likesRes.total;
  const commentsCount = commentsRes.total;
  const viewsCount = photo.viewsCount ?? 0; // views are buffered separately, see 1.4.2

  const engagementScore = computeScore({ likesCount, commentsCount, viewsCount });

  await databases.updateDocument(DATABASE_ID, PHOTOS_COLLECTION_ID, photoId, {
    likesCount,
    commentsCount,
    engagementScore,
  });

  log(`Recalculated photo ${photoId}: score=${engagementScore} (likes=${likesCount}, comments=${commentsCount}, views=${viewsCount})`);
}

// Single entry point handles BOTH trigger types below — branch on the event name
// present in the Appwrite-injected environment context, not on payload shape.
export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const databases = new Databases(client);

  try {
    // --- Path A: event-triggered (like or comment create/delete) ---
    // Configure this function's Settings > Events with:
    //   databases.[DATABASE_ID].collections.[LIKES_COLLECTION_ID].documents.*.create
    //   databases.[DATABASE_ID].collections.[LIKES_COLLECTION_ID].documents.*.delete
    //   databases.[DATABASE_ID].collections.[COMMENTS_COLLECTION_ID].documents.*.create
    //   databases.[DATABASE_ID].collections.[COMMENTS_COLLECTION_ID].documents.*.delete
    if (req.bodyJson && req.bodyJson.photoId) {
      await recalcOnePhoto(databases, req.bodyJson.photoId, log);
      return res.json({ success: true, mode: 'event', photoId: req.bodyJson.photoId });
    }

    // --- Path B: scheduled run (views batch, every 5-15 min via cron) ---
    // Configure this function's Settings > Schedule with e.g. "*/10 * * * *".
    // Recomputes every photo whose buffered viewsCount changed since the last run,
    // rather than every photo in the database, to keep execution time bounded.
    const dirtyPhotos = await databases.listDocuments(DATABASE_ID, PHOTOS_COLLECTION_ID, [
      Query.equal('viewsDirty', true),
      Query.limit(100), // page through in batches if this regularly exceeds 100
    ]);

    for (const photo of dirtyPhotos.documents) {
      await recalcOnePhoto(databases, photo.$id, log);
      await databases.updateDocument(DATABASE_ID, PHOTOS_COLLECTION_ID, photo.$id, {
        viewsDirty: false,
      });
    }

    return res.json({ success: true, mode: 'scheduled', recalculated: dirtyPhotos.documents.length });
  } catch (err) {
    error(`recalcEngagementScore failed: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

**Required `photos` collection attributes this function depends on** (in addition to `engagementScore` from 1.4):
- `likesCount: integer` (denormalized cache, default `0`)
- `commentsCount: integer` (denormalized cache, default `0`)
- `viewsCount: integer` (default `0`)
- `viewsDirty: boolean` (default `false`) — flips `true` when a buffered view flush lands, tells the scheduled run which photos actually need recalculating instead of scanning the whole collection every cycle.

**Appwrite Console setup steps (manual, cannot be scripted from client code):**
1. Create the function, runtime `node-18.0` or later.
2. Add environment variables: `APPWRITE_DATABASE_ID`, `APPWRITE_PHOTOS_COLLECTION_ID`, `APPWRITE_LIKES_COLLECTION_ID`, `APPWRITE_COMMENTS_COLLECTION_ID`.
3. Under **Settings → Events**, add the four like/comment create/delete events listed in the code comment above.
4. Under **Settings → Schedule**, add a cron expression for the view-batch path, e.g. `*/10 * * * *` for every 10 minutes.
5. Grant the function's API key `databases.read` and `databases.write` scope on the relevant collections.

#### 1.4.2 View buffering (client-side, feeds `viewsDirty`)

```ts
// lib/analytics/viewBuffer.ts
// Batches view events client-side and flushes periodically, so a single popular
// photo scrolling past 10,000 feed impressions does NOT translate into 10,000
// individual writes or function invocations — see Section 0 constraint.

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

  // Single batched call to a server endpoint/Appwrite Function — NOT one
  // databases.updateDocument call per photo per view.
  await fetch('/api/views/flush', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ increments: batch }), // [[photoId, count], ...]
  });
}

// Also flush on page unload so trailing views aren't lost.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => { if (pending.size) flush(); });
}
```

The `/api/views/flush` route (a Next.js Route Handler, server-side) is what actually writes `viewsCount` increments and sets `viewsDirty: true` on each affected photo — it uses an Appwrite server SDK key, not the client SDK, since this is a trusted-write path that should not be callable with arbitrary increments from a tampered client without basic sanity bounds (e.g. reject a single flush batch claiming >50 views for one photo from one client in one interval).

**Important scope boundary:** the 50-item cap applies **only** to this specific landing/front-page query. Any other feed (profile pages, category filters, search results) must use normal paginated `Query.limit/Query.offset` (or cursor pagination) and must **not** inherit this cap — make this a distinct, named query function (`getTrendingPhotos`) rather than a shared default limit, so it can't accidentally bleed into other views.

---

## TASK 2: Theme Engine & Navigation Refactor

### 2.1 Conceptual Model — Two Independent Axes

This is the part most likely to get tangled if not made explicit: there are **two separate concepts** that the current UI conflates, and the fix is to formally split them.

| Axis | Values | Controlled by | Persisted where |
|---|---|---|---|
| **Mode** (base light/dark) | `'light' \| 'dark'` | Navbar slider toggle | User preference (cookie/localStorage + Appwrite user prefs if logged in) |
| **Theme** (aesthetic skin) | `'obsidian_crimson' \| 'fiery_sunset' \| 'quiet_luxury' \| 'modern_editorial' \| 'standard_dark' \| 'standard_light'` | Settings → Appearance grid | Same as above |

**Reconciling the two axes (critical logic the agent must implement correctly):**
- The navbar toggle is Mode-only. It does **not** know about the 4 aesthetic themes.
- When the user flips the navbar toggle, it sets Theme to whichever of `standard_dark` / `standard_light` corresponds — **unless** the user has an aesthetic theme (Obsidian & Crimson, etc.) actively selected, in which case toggling Mode should switch to that theme's nearest equivalent if one exists, or simply fall back to `standard_dark`/`standard_light` and surface a brief toast: *"Switched to [Standard Dark/Light] — your custom theme has its own dark styling, choose it again from Appearance settings."* Do not silently strand the user on a half-applied custom theme. The simplest correct behavior, and what's recommended here: **the navbar toggle always sets Theme to standard_dark or standard_light, full stop** — it is explicitly scoped per the requirement to "only switch between base Dark and base Light," so switching it away from a custom theme is expected behavior, not a bug. Make sure the Appearance page reflects this (selection highlight moves to Standard Dark/Light when the user does this).
- The Appearance settings grid is the only place all 6 options live side by side and can be chosen directly, including re-selecting an aesthetic theme after the navbar toggle bumped the user off it.

### 2.2 State Management

```ts
// lib/theme/types.ts
export type ThemeMode = 'light' | 'dark';

export type ThemeId =
  | 'standard_dark'
  | 'standard_light'
  | 'obsidian_crimson'
  | 'fiery_sunset'
  | 'quiet_luxury'
  | 'modern_editorial';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  mode: ThemeMode; // which base mode this theme is "rooted" in — drives navbar toggle sync
  swatch: string[]; // hex values for the settings grid preview dots
  isCustom: boolean; // false for standard_dark/standard_light, true for the 4 aesthetic themes
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  standard_dark:     { id: 'standard_dark',     label: 'Dark',               description: 'Standard dark mode',          mode: 'dark',  swatch: ['#0a0a0a', '#1a1a1a', '#ffffff'], isCustom: false },
  standard_light:    { id: 'standard_light',    label: 'Light',              description: 'Standard light mode',         mode: 'light', swatch: ['#ffffff', '#f4f4f4', '#0a0a0a'], isCustom: false },
  obsidian_crimson:  { id: 'obsidian_crimson',  label: 'Obsidian & Crimson', description: 'Dark obsidian with bright red accents', mode: 'dark',  swatch: ['#000000', '#e0263a', '#2b2b33', '#e7e2dd', '#54545c'], isCustom: true },
  fiery_sunset:      { id: 'fiery_sunset',      label: 'Fiery Sunset',       description: 'Deep burgundy with crimson and peach warmth', mode: 'dark', swatch: ['#3a0d10', '#9c1c2e', '#c4243a', '#ffffff', '#e08a63'], isCustom: true },
  quiet_luxury:      { id: 'quiet_luxury',      label: 'Quiet Luxury',       description: 'Earthy light theme with alabaster and cognac', mode: 'light', swatch: ['#ffffff', '#ffffff', '#5a4632', '#9c6b3f', '#e7e2dd'], isCustom: true },
  modern_editorial:  { id: 'modern_editorial',  label: 'Modern Editorial',   description: 'Slate and sage with cool modern tones', mode: 'dark', swatch: ['#11151c', '#1c2230', '#e7edf2', '#3f7a5f', '#454c58'], isCustom: true },
};
```

> Swatch hex values above are estimated from the reference screenshots — the agent (or the user) should confirm exact brand hex codes against the design system / Figma source before finalizing; do not treat these as pixel-accurate without verification.

```tsx
// lib/theme/ThemeProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { THEMES, type ThemeId, type ThemeMode } from './types';

interface ThemeContextValue {
  themeId: ThemeId;
  mode: ThemeMode;
  setTheme: (id: ThemeId) => void;
  toggleMode: () => void; // navbar slider calls ONLY this
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'auroric-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('standard_dark'); // overwritten on mount, see below

  // 1. AUTO-DETECTION on first visit (no stored preference at all)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES[stored]) {
      setThemeId(stored);
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setThemeId(prefersDark ? 'standard_dark' : 'standard_light');
  }, []);

  // 2. Keep OS-level changes in sync ONLY if the user has never explicitly chosen —
  //    once they've made an explicit choice (stored in localStorage), stop following the OS.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const hasExplicitChoice = localStorage.getItem(STORAGE_KEY);
      if (!hasExplicitChoice) {
        setThemeId(e.matches ? 'standard_dark' : 'standard_light');
      }
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.setAttribute('data-mode', THEMES[themeId].mode);
  }, [themeId]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    localStorage.setItem(STORAGE_KEY, id);
    // TODO: if user is authenticated, also persist to Appwrite user prefs
    // via account.updatePrefs({ themeId: id }) so it syncs across devices.
  }, []);

  // Navbar toggle: ONLY moves between standard_dark <-> standard_light, per spec 2.1.
  const toggleMode = useCallback(() => {
    const nextMode: ThemeMode = THEMES[themeId].mode === 'dark' ? 'light' : 'dark';
    setTheme(nextMode === 'dark' ? 'standard_dark' : 'standard_light');
  }, [themeId, setTheme]);

  return (
    <ThemeContext.Provider value={{ themeId, mode: THEMES[themeId].mode, setTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

**Flash-of-wrong-theme prevention:** the `useEffect`-based detection above runs after first paint, which causes a flash. Add a small **inline, render-blocking script** in the root layout `<head>` (before hydration) that reads `localStorage` / `matchMedia` synchronously and sets `data-theme`/`data-mode` on `<html>` before React mounts:

```tsx
// app/layout.tsx — inside <head>, as a literal inline script tag
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        try {
          var stored = localStorage.getItem('auroric-theme');
          var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'standard_dark' : 'standard_light');
          document.documentElement.setAttribute('data-theme', theme);
        } catch (e) {}
      })();
    `,
  }}
/>
```
This is the standard, necessary pattern for flicker-free theme init in SSR frameworks — flag to the user that omitting this causes a visible flash on every load, it's not optional polish.

### 2.3 CSS Architecture

**Per Section -1, ruling #1:** this extends the *existing* token naming convention already wired into the project's Tailwind config (`bg-background`, `bg-card`, `text-foreground`, `border-border`, `text-accent` — as documented in `COMPONENTS_API.md`'s "Tailwind Color Classes" section) rather than introducing a parallel set of names. **Do not rename existing tokens** (`background`, `card`, `foreground`, `border`, `accent`, `primary`, `destructive` all stay as-is in `tailwind.config.ts`) — only their *values* change per `[data-theme]`, and one new token (`navbar`) is added because no existing token currently serves that purpose distinctly from `background`/`card`.

```css
/* globals.css */
:root {
  /* fallback / SSR default before hydration script runs */
}

[data-theme='standard_dark'] {
  --background: #0a0a0a;
  --card: #16161a;
  --navbar: #1c1c21;           /* NEW token — intentionally distinct from --background, see 2.4 */
  --foreground: #f5f5f5;
  --foreground-secondary: #a0a0a8;
  --accent: #e0263a;
  --border: #2a2a30;
}

[data-theme='standard_light'] {
  --background: #ffffff;
  --card: #f7f7f8;
  --navbar: #eeeeef;           /* NEW token — intentionally distinct from --background, see 2.4 */
  --foreground: #0a0a0a;
  --foreground-secondary: #5b5b63;
  --accent: #d6213a;
  --border: #e2e2e5;
}

[data-theme='obsidian_crimson'] {
  --background: #000000;
  --card: #19191d;
  --navbar: #1f1216;
  --foreground: #e7e2dd;
  --foreground-secondary: #54545c;
  --accent: #e0263a;
  --border: #2b2b33;
}

/* ...fiery_sunset, quiet_luxury, modern_editorial follow the same shape... */
```

```ts
// tailwind.config.ts — extend EXISTING color tokens to read from CSS vars,
// add ONLY the new `navbar` token. Existing token names (background, card,
// foreground, accent, border, primary, destructive) are unchanged — this is
// an additive edit to the existing config file, not a replacement of it.
export default {
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        card: 'var(--card)',
        navbar: 'var(--navbar)',           // NEW
        foreground: 'var(--foreground)',
        'foreground-secondary': 'var(--foreground-secondary)', // NEW, optional
        accent: 'var(--accent)',
        border: 'var(--border)',
        // primary, destructive, etc. — leave exactly as currently defined,
        // unless the user separately confirms those should also become
        // theme-variable rather than fixed purple/red.
      },
    },
  },
};
```
Components continue using `bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-accent` — the same class names already used throughout the existing codebase per `COMPONENTS_API.md` — so this migration requires **zero find-and-replace across existing components**. Only the values these classes resolve to become theme-dependent; the one new class introduced is `bg-navbar`.

### 2.4 Navbar Contrast Requirement

Per spec: the navbar must be **visually distinct from the main background** in both base modes (this directly addresses the toggle being hard to see against a flat background). Concretely:
- `--navbar` must differ from `--background` by a minimum contrast/lightness delta in **every** theme — not just the two standard ones. Recommend: navbar background is `--background` shifted ~6–10% toward the opposite end of the lightness scale (slightly lighter than background in dark mode, slightly darker/more saturated than background in light mode), plus a 1px `--border` bottom edge as a secondary separator (don't rely on color contrast alone — add the border so it still reads correctly for users with reduced color perception).
- Apply this rule to all 6 themes when defining their CSS variable blocks, not just `standard_dark`/`standard_light` — the spec only explicitly mentions the two base modes, but leaving the 4 aesthetic themes with a navbar that blends into the background would be an inconsistent regression. Call this out to the user as a recommended scope extension rather than silently doing it.

### 2.5 Animated Toggle Component

Replace the current moon-icon-only button with a sliding pill toggle (per reference mockups: orange/amber pill background, white circular thumb with sun rays that slides to a dark thumb with stars/moon).

```tsx
// components/nav/ModeToggle.tsx
'use client';
import { useTheme } from '@/lib/theme/ThemeProvider';

export function ModeToggle() {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      onClick={toggleMode}
      className="relative h-8 w-16 rounded-full transition-colors duration-300 ease-in-out"
      style={{ backgroundColor: isDark ? '#1c2030' : '#f5b942' }}
    >
      <span
        className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out"
        style={{ transform: isDark ? 'translateX(32px)' : 'translateX(0)' }}
      >
        {isDark ? <MoonIcon className="h-4 w-4 text-slate-700" /> : <SunIcon className="h-4 w-4 text-amber-500" />}
      </span>
      {/* optional decorative stars (dark) / clouds (light) absolutely positioned behind the thumb,
          opacity-faded with the same transition-duration for a cohesive slide-and-fade effect */}
    </button>
  );
}
```
Use `lucide-react`'s `Sun`/`Moon` icons (already available per project conventions) rather than custom SVGs unless brand-specific iconography is required — confirm with the user if the exact mockup graphic (stars + cloud detail) needs custom SVG work beyond a standard icon-based toggle.

### 2.6 Appearance Settings Page — Consolidated Grid

Update `Settings → Appearance` to render all 6 `THEMES` entries (not just the 4 custom ones) as the existing swatch-card grid pattern already in use (5-dot color preview, label, description, red border + checkmark on the active selection — matches current UI exactly, just extend the data source):

```tsx
// app/settings/appearance/page.tsx (relevant excerpt)
import { THEMES } from '@/lib/theme/types';
import { useTheme } from '@/lib/theme/ThemeProvider';

export default function AppearancePage() {
  const { themeId, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Object.values(THEMES).map((theme) => (
        <button
          key={theme.id}
          onClick={() => setTheme(theme.id)}
          className={`relative rounded-xl border p-5 text-left transition-colors
            ${themeId === theme.id ? 'border-accent bg-accent/5' : 'border-border bg-card'}`}
        >
          {themeId === theme.id && (
            <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">✓</span>
          )}
          <div className="mb-3 flex gap-1.5">
            {theme.swatch.map((hex, i) => (
              <span key={i} className="h-7 w-7 rounded-full border border-white/10" style={{ backgroundColor: hex }} />
            ))}
          </div>
          <p className="font-semibold text-foreground">{theme.label}</p>
          <p className="text-sm text-foreground-secondary">{theme.description}</p>
        </button>
      ))}
    </div>
  );
}
```
No layout restructuring needed beyond extending the data source from 4 to 6 entries — the existing card pattern already scales (confirm grid wraps cleanly at 6 items: 2-col layout gives 3 rows, which matches the existing visual rhythm in the reference screenshot).

---

## 3. Cross-Cutting Requirements & Acceptance Criteria

**Do not break existing UI** — explicit checklist the agent should self-verify against before considering either task complete:

- [ ] `PinCard`'s existing props, hover behavior, like/share buttons, and `.pin-card` base class/radius are unchanged — only the image container gains `aspect-ratio` sizing and the two new props (`aspectRatioId`, `columnWidth`) per Section 1.3.1. No second/parallel card component was created.
- [ ] Category filter bar (`All / Photography / Beauty / Nature`) still filters the underlying photo list *before* it's handed to `MasonryGrid` — filtering logic is unrelated to and unaffected by the masonry/trending changes.
- [ ] The bottom floating dock/toolbar (logo, globe, trending, grid, lightning, people, avatar) is untouched by this work — out of scope unless the user says otherwise.
- [ ] Existing Obsidian & Crimson / Fiery Sunset / Quiet Luxury / Modern Editorial visual appearance is pixel-identical after the refactor — this is a state-management and data-source change, not a redesign of the 4 existing themes.
- [ ] Switching themes/modes does not cause a full page reload or loss of scroll position in the feed.
- [ ] No `localStorage` access during SSR (guard all theme code with `typeof window !== 'undefined'` or keep it inside `useEffect`/client components only) — this stack is Next.js App Router, so server/client boundaries matter and a naive port will crash on the server.
- [ ] `DESIGN_SYSTEM.md` is updated after this ships to remove the stale purple/gold palette and "no light mode required" statement, per Section -1, ruling #1 — so the next person/agent reading repo docs doesn't hit the same contradiction this reconciliation pass had to resolve.

**Explicitly out of scope unless requested** (call this out to the user rather than silently expanding scope):
- Appwrite collection schema migration tooling/scripts beyond the one-time backfill below (the spec assumes the new attributes themselves — `engagementScore`, `likesCount`, `commentsCount`, `viewsCount`, `viewsDirty`, `aspectRatioId` — are added manually via Appwrite console/CLI first; this script only *populates* them, it does not create them).
- Cross-device theme sync via Appwrite user prefs (stubbed as a `TODO` in `setTheme` — implement only if the user confirms they want it now).
- Image moderation/validation on upload beyond aspect-ratio enforcement.
- Updating `primary`/`destructive` Tailwind tokens to be theme-variable (Section 2.3 leaves these as fixed values unless separately confirmed) — only `background`, `card`, `navbar`, `foreground`, `accent`, `border` become theme-dependent in this pass.

### 3.1 Required one-time backfill (run before ship, not optional)

Without this, every photo that exists before this change ships will have `engagementScore: undefined` (sorts unpredictably or excludes the photo from the trending query depending on Appwrite's null-handling) and no `aspectRatioId` (the masonry engine in 1.3 falls back to `decimal: 1`/square for any photo missing this — acceptable as a safety default, but it means **every pre-existing photo will render as a square in the new grid regardless of its real shape** until backfilled). This is a one-time script, run once via Node/CLI against the Appwrite server SDK — not a recurring Appwrite Function.

```js
// scripts/backfill-engagement-and-ratio.mjs
// Run once, manually, before this feature ships: `node scripts/backfill-engagement-and-ratio.mjs`
import { Client, Databases, Query } from 'node-appwrite';
import sharp from 'sharp'; // to inspect existing image dimensions and infer closest aspect ratio

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // server API key, run locally/in CI, never in client code

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const PHOTOS_COLLECTION_ID = process.env.APPWRITE_PHOTOS_COLLECTION_ID;

const ASPECT_RATIOS = [
  { id: 'square_1_1', decimal: 1 },
  { id: 'landscape_3_2', decimal: 1.5 },
  { id: 'portrait_2_3', decimal: 0.667 },
  { id: 'classic_4_3', decimal: 1.333 },
  { id: 'classic_port_3_4', decimal: 0.75 },
  { id: 'vertical_9_16', decimal: 0.5625 },
  { id: 'widescreen_16_9', decimal: 1.778 },
];

function closestAspectRatioId(width, height) {
  const actual = width / height;
  let best = ASPECT_RATIOS[0];
  let bestDiff = Math.abs(actual - best.decimal);
  for (const ratio of ASPECT_RATIOS) {
    const diff = Math.abs(actual - ratio.decimal);
    if (diff < bestDiff) { best = ratio; bestDiff = diff; }
  }
  return best.id;
}

async function backfillBatch(offset) {
  const res = await databases.listDocuments(DATABASE_ID, PHOTOS_COLLECTION_ID, [
    Query.limit(100),
    Query.offset(offset),
  ]);

  for (const photo of res.documents) {
    const updates = {};

    // Only set aspectRatioId if missing — never overwrite a value the new
    // hard-crop upload flow already wrote for photos uploaded after ship.
    if (!photo.aspectRatioId) {
      // NOTE: this assumes the original image is still reachable via photo.storageFileId
      // to read real pixel dimensions. If dimensions are already stored on the document
      // (width/height fields), prefer those over re-fetching the file — much cheaper.
      const ratioId = photo.width && photo.height
        ? closestAspectRatioId(photo.width, photo.height)
        : 'square_1_1'; // last-resort default if no dimension data exists at all
      updates.aspectRatioId = ratioId;
    }

    if (photo.engagementScore === undefined || photo.engagementScore === null) {
      const likesCount = photo.likesCount ?? 0;
      const commentsCount = photo.commentsCount ?? 0;
      const viewsCount = photo.viewsCount ?? 0;
      updates.likesCount = likesCount;
      updates.commentsCount = commentsCount;
      updates.viewsCount = viewsCount;
      updates.viewsDirty = false;
      updates.engagementScore = likesCount * 3 + commentsCount * 5 + viewsCount * 0.1; // keep in sync with ENGAGEMENT_WEIGHTS
    }

    if (Object.keys(updates).length > 0) {
      await databases.updateDocument(DATABASE_ID, PHOTOS_COLLECTION_ID, photo.$id, updates);
      console.log(`Backfilled ${photo.$id}:`, updates);
    }
  }

  return res.total;
}

async function run() {
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    total = await backfillBatch(offset);
    offset += 100;
  }
  console.log(`Backfill complete. Processed ${total} photos.`);
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
```

**Before running:** confirm whether existing `photos` documents already store `width`/`height` (most upload flows capture this at upload time even without the new ratio-picker). If they don't, the script needs a preceding step that fetches each file from Storage and reads dimensions via `sharp` — flag this to the user as a likely-needed addition rather than assuming the fallback-to-square default is acceptable for a large existing photo library.

---

## 4. Open Questions for the Agent to Surface (not assume)

1. Exact hex values for the 4 custom themes (estimated from screenshots above, not confirmed against design source).
2. Whether `viewsCount` increments should be authenticated-user-only or anonymous-allowed (affects whether view-spam/rate-limiting logic is needed before the engagement score can be trusted).
3. Whether the cropper should preserve the original uncropped file in Storage as a separate "source" asset for potential future re-cropping, or discard it entirely after crop (current spec assumes discard, per "only the cropped version is uploaded").
