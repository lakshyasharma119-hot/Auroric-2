# Auroric — Luxury Inspiration Platform

A premium, Pinterest-inspired social platform for discovering, creating, and sharing visual inspiration. Built with Next.js 16, Tailwind CSS, and Appwrite.

![Auroric Preview](public/logo.png)

## ✨ Features

### Core Platform
- **Masonry Pin Feed** — Browse, create, and share visual pins with categories
- **Boards** — Organize pins into curated collections
- **Social Features** — Follow users, like/save/comment on pins, direct messaging
- **Search** — Full-text search across pins, boards, and users
- **Trending & Popular** — Discover trending and popular content

### UI / Design
- **Floating Navigation Bar** — Pill-shaped, glassmorphism bottom nav with glow halos and expand-on-hover behavior
- **Auroric Logo** — Custom flame-gradient logo mark with "Auroric" branding
- **Dark Theme** — Fiery Sunset editorial palette with custom CSS tokens
- **Smooth Animations** — Micro-animations, glow pulses, slide transitions

### Profile Picture Upload
- **Drag & Drop** — Drag files or click to select
- **Client-Side Validation** — File type (PNG, JPEG, WebP), size (≤10MB)
- **Interactive Crop Tool** — Canvas-based 1:1 circular crop with zoom & drag
- **Upload Progress** — Real-time progress bar via XMLHttpRequest
- **Server Validation** — Double validation on the API side
- **Auto Cleanup** — Old avatar files are automatically deleted from storage

### Authentication
- **Email/Password** signup & login with JWT sessions
- **Google OAuth** via NextAuth
- **Email Verification** via Appwrite
- **Password Reset** flow
- **Rate-Limited Password Changes** (3 per 3-day window)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5.7 |
| **Styling** | Tailwind CSS 3.4 + custom CSS |
| **Auth** | NextAuth 5 (beta) + custom JWT |
| **Database** | Appwrite Database |
| **Storage** | Appwrite Storage |
| **Icons** | Lucide React |
| **Fonts** | Syne, DM Sans, JetBrains Mono |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes (auth, pins, boards, upload, etc.)
│   ├── profile/            # User profile page
│   ├── settings/           # Settings & preferences
│   ├── explore/            # Pin exploration
│   ├── trending/           # Trending pins
│   ├── popular/            # Popular pins
│   ├── messages/           # Direct messaging
│   ├── globals.css         # Global styles + floating nav CSS
│   ├── layout.tsx          # Root layout with FloatingNav
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── floating-nav.tsx    # Bottom floating navigation bar
│   ├── auroric-logo.tsx    # Logo component
│   ├── profile-picture-upload.tsx  # Avatar upload modal
│   ├── avatar-crop-modal.tsx       # Image crop tool
│   ├── user-avatar.tsx     # Avatar display (image or initials)
│   ├── header.tsx          # Top header (search + logo)
│   ├── footer.tsx          # Footer
│   └── ...                 # Other components
├── lib/                    # Shared utilities
│   ├── app-context.tsx     # Global app state (React Context)
│   ├── api-client.ts       # Frontend API client
│   ├── db.ts               # Appwrite database operations
│   ├── auth.ts             # Auth utilities
│   └── types.ts            # TypeScript types
├── public/
│   └── logo.png            # Auroric logo
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 20.0.0
- **npm** (included with Node)
- An **Appwrite** project with database and storage bucket configured

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd auroric
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
# ── Appwrite ──
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_BUCKET_ID=your_bucket_id

# ── Appwrite Collection IDs ──
APPWRITE_USERS_COLLECTION_ID=users
APPWRITE_PINS_COLLECTION_ID=pins
APPWRITE_BOARDS_COLLECTION_ID=boards
APPWRITE_NOTIFICATIONS_COLLECTION_ID=notifications
APPWRITE_MESSAGES_COLLECTION_ID=messages
APPWRITE_CONVERSATIONS_COLLECTION_ID=conversations
APPWRITE_DELETION_REQUESTS_COLLECTION_ID=deletion_requests

# ── Auth ──
JWT_SECRET=your_jwt_secret_min_32_chars
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# ── Google OAuth (optional) ──
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ── Appwrite Client-Side (for email verification) ──
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Seed the database (optional)
Navigate to the app and trigger the seed endpoint to populate sample data.

---

## 🌐 Deploying to Vercel

### Step 1: Push to Git
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Import project on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will auto-detect it as a Next.js project

### Step 3: Set environment variables
In Vercel's project settings → **Environment Variables**, add all the variables from `.env.local` above.

### Step 4: Configure build settings
The project includes a `vercel.json` with `"installCommand": "npm install --legacy-peer-deps"`. No additional build configuration is needed.

### Step 5: Deploy
Click **Deploy**. Vercel will build and deploy the application automatically.

### Step 6: Update URLs
After deployment, update these environment variables with your production URL:
- `NEXTAUTH_URL` → `https://your-domain.vercel.app`

### Step 7: Configure Appwrite
In your Appwrite console:
- Add your Vercel domain to **Platforms** (Web App)
- Update **OAuth2 redirect URLs** if using Google OAuth
- Ensure the storage bucket has proper **file permissions** (read access for all, create for authenticated users)

---

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `APPWRITE_ENDPOINT` | ✅ | Appwrite API endpoint |
| `APPWRITE_PROJECT_ID` | ✅ | Appwrite project ID |
| `APPWRITE_API_KEY` | ✅ | Server-side Appwrite API key |
| `APPWRITE_DATABASE_ID` | ✅ | Database ID |
| `APPWRITE_BUCKET_ID` | ✅ | Storage bucket for uploads |
| `JWT_SECRET` | ✅ | Secret for JWT token signing |
| `NEXTAUTH_SECRET` | ✅ | NextAuth session secret |
| `NEXTAUTH_URL` | ✅ | App URL (localhost or production) |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |

---

## 📄 License

This project is private and not licensed for redistribution.

---

Made with ❤️ by Lucky