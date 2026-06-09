# Meta Display Uploader

Pair Meta glasses to a rotating 6-digit code and push photos, videos, direct video URLs, or YouTube links to the live display.

Deployed as a **static site on GitHub Pages**: [https://flsourcing.github.io/Meta-Display-Uploader/](https://flsourcing.github.io/Meta-Display-Uploader/)

## How it works

1. Open the display page on the Meta glasses browser.
2. A 6-digit code rotates every 30 seconds.
3. Open the upload page on a phone or computer and enter the current code.
4. Upload media — it appears live on the paired glasses display.

### Code timer behavior

- **Green** — fresh code (30–21 seconds remaining)
- **Yellow + 3 quick flashes** — warning at 20 seconds
- **Red + 3 quick flashes** — critical at 10 seconds
- **Green reset** — new code every 30 seconds

## GitHub Pages setup

GitHub Pages only serves static files, so pairing and uploads run in the browser through **Supabase** (free tier).

### 1. Enable GitHub Pages

In the repo on GitHub:

1. **Settings → Pages**
2. **Build and deployment → Source**: GitHub Actions

### 2. Create Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the script in [`supabase/schema.sql`](supabase/schema.sql)
3. Copy your project URL and anon public key from **Project Settings → API**

### 3. Add GitHub secrets

In the repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |

Push to `main` (or re-run the **Deploy GitHub Pages** workflow). The live site will be at:

`https://flsourcing.github.io/Meta-Display-Uploader/`

## Run locally

```bash
cp .env.example .env.local
# Fill in Supabase values. Leave NEXT_PUBLIC_BASE_PATH empty for localhost.

npm install
npm run dev
```

- Display: [http://localhost:3000](http://localhost:3000)
- Upload: [http://localhost:3000/upload](http://localhost:3000/upload)

To test the GitHub Pages base path locally:

```bash
NEXT_PUBLIC_BASE_PATH=/Meta-Display-Uploader npm run dev
```

## Upload options

- Photo or video file (camera roll or capture)
- Direct video URL (`.mp4`, hosted stream, etc.)
- YouTube link (embedded player on the display)

## Architecture

- **Frontend**: Next.js static export → GitHub Pages
- **Sync**: Supabase Postgres (`display_sessions` table)
- **File storage**: Supabase Storage (`media` bucket)

The old server API routes were removed because GitHub Pages cannot run Node.js backends.
