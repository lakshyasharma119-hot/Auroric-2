# Auroric

**A luxury, Pinterest-inspired platform for discovering, creating, and sharing visual inspiration.**

Auroric combines a high-performance masonry feed, end-to-end encrypted messaging, and a tiered creator economy into a single polished experience — built with Next.js, Tailwind CSS, and Appwrite.

![Auroric Preview](public/logo.png)

---

## Features

### Core Visual Engine
- **Masonry pin feed** — responsive, aspect-ratio-aware grid layout with no gaps, driven by a mandatory ratio selection at upload time
- **Boards & collections** — organize, categorize, and curate saved pins
- **Interactive avatar studio** — canvas-based circular cropping with zoom, drag, and client + server-side validation
- **Trending feed** — landing page surfaces the top 50 pins by a weighted engagement score (likes, comments, views)

### Social & Messaging
- **End-to-end encrypted direct messaging** — RSA-OAEP key pairs generated client-side via the Web Crypto API; private keys never leave the browser
- **24-hour persistent ledger** — messages sync across sessions via delta polling and expire automatically after 24 hours (extended retention for paid tiers)
- **In-chat pin sharing** — share inspiration directly into private conversations
- **Instagram-style blocking & message requests** — safely manage unwanted interactions
- **Social graph** — follow creators, like pins, build a personalized feed

### Creator Economy & Monetization
- **Auroric Plus & Prime** — tiered subscriptions (monthly / yearly) with distinct perks
- **Verification badges** — blue badge for Plus, glowing gold badge for Prime, surfaced on profiles, search results, and in chat
- **Tier-gated downloads** — dynamic resolution delivery (Standard / HD / Full HD), enforced server-side, not just in the UI
- **Priority search ranking** — Prime members rank above Plus, who rank above free users
- **Exclusive UI themes** — premium aesthetic themes unlockable only on paid tiers

### Creator Analytics
- **30-day interaction graph** — visualize views, likes, downloads, and shares over time
- **Growth trend indicators** — rolling 15-day comparisons with percentage change
- **Gated dashboard access** — unlocks after a creator publishes 20+ pins

### Design System
- **Two-axis theming** — a light/dark mode toggle independent from four (or six, on paid tiers) curated aesthetic themes
- **Floating glassmorphism navigation** — pill-shaped bottom nav with hover expansion
- **Consistent motion language** — smooth transitions and toast-driven feedback throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom-property theming |
| UI Components | Radix UI / shadcn, Lucide React icons |
| Database | Appwrite Database |
| Storage | Appwrite Storage |
| Auth | Appwrite Auth + custom JWT session handling |
| Encryption | Web Crypto API (RSA-OAEP), client-side only |
| Charts | Recharts |
| Deployment | Vercel |

---

## Project Structure

```text
├── app/
│   ├── api/                  # Serverless API routes (auth, pins, messages, downloads)
│   ├── create/                # Upload flow: ratio selection, cropping, publish
│   ├── messages/               # E2EE chat interface
│   ├── pin/[id]/                # Pin detail + tier-gated downloads
│   ├── pricing/                   # Subscription plans
│   ├── profile/                    # Profile + creator analytics dashboard
│   ├── settings/                     # Account, appearance, and theme settings
│   └── globals.css                    # Design tokens and theme variables
├── components/
│   ├── masonry-grid.tsx        # Aspect-ratio-aware masonry layout engine
│   ├── pin-card.tsx             # Core feed card component
│   ├── nav/                      # Header, mode toggle, floating dock
│   └── upload/                    # Aspect ratio picker, image cropper
├── functions/
│   └── e2ee-message-reaper/    # Appwrite scheduled function: 24h message expiry
├── hooks/
│   └── useE2EERelay.ts          # Encryption, delta sync, and message relay logic
├── lib/
│   ├── db.ts                     # Appwrite data layer
│   ├── cryptoUtils.ts             # Client-side E2EE key generation and crypto
│   ├── theme-context.tsx           # Two-axis (mode + theme) state management
│   └── types.ts                     # Shared TypeScript interfaces
└── scripts/
    └── backfill-aspect-ratios.ts # One-time legacy data migration
```

---

## Architecture Notes

- **Aggregate-free scoring.** Appwrite's query layer has no `SUM`/`GROUP BY` support, so trending scores are pre-computed and denormalized at write time rather than calculated live at query time.
- **Zero-knowledge messaging.** The server only ever stores ciphertext. Encryption and decryption happen exclusively in the browser; a scheduled Appwrite function prunes expired messages hourly.
- **Two-axis theming.** Light/dark mode and aesthetic theme selection are modeled as independent state, so toggling base mode never silently strands a user mid-theme.

---

## Getting Started

```bash
git clone https://github.com/your-username/auroric.git
cd auroric
pnpm install
```

Create a `.env` file with your Appwrite project credentials:

```env
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_KEY=
APPWRITE_DATABASE_ID=
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_APPWRITE_ENDPOINT=
```

```bash
pnpm dev
```

Visit `v0-auroric.vercel.app`.  

---

## License

This project is currently unlicensed for public use. All rights reserved.
