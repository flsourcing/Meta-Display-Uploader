# Meta Display Uploader

Pair Meta glasses to a rotating 6-digit code and push photos, videos, direct video URLs, or YouTube links to the live display.

- **Frontend (GitHub Pages):** [https://flsourcing.github.io/Meta-Display-Uploader/](https://flsourcing.github.io/Meta-Display-Uploader/)
- **Backend (Railway):** Express API + PostgreSQL

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

## Railway setup (API + database)

You already have **Uploader Database** on Railway. Deploy the API service next.

### 1. Deploy the API service

1. In Railway, open your project (**Uploader Cloud**).
2. **New → GitHub Repo** → select this repository.
3. Set **Root Directory** to `server`.
4. **Variables → Add Reference** and link `DATABASE_URL` from **Uploader Database**.
5. Add variable: `CORS_ORIGIN=https://flsourcing.github.io`
6. Generate a **public domain** for the API service (e.g. `meta-display-api.up.railway.app`).

The API runs migrations automatically on startup using `server/schema.sql`.

### 2. Connect GitHub Pages to the API

In your GitHub repo: **Settings → Secrets and variables → Actions**

| Secret | Value |
|--------|-------|
| `NEXT_PUBLIC_API_URL` | Your Railway API URL (e.g. `https://meta-display-api.up.railway.app`) |

Push to `main` or re-run **Deploy GitHub Pages** to rebuild the frontend.

## Run locally

**Terminal 1 — API**

```bash
cd server
cp ../.env.example .env
# Add DATABASE_URL from Railway (use DATABASE_PUBLIC_URL for local access)
npm install
npm run dev
```

**Terminal 2 — frontend**

```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8080
# Leave NEXT_PUBLIC_BASE_PATH empty for localhost

npm install
npm run dev
```

- Display: [http://localhost:3000](http://localhost:3000)
- Upload: [http://localhost:3000/upload](http://localhost:3000/upload)
- API health: [http://localhost:8080/health](http://localhost:8080/health)

## Upload options

- Photo or video file (camera roll or capture)
- Direct video URL (`.mp4`, hosted stream, etc.)
- YouTube link (embedded player on the display)

## Architecture

| Layer | Host | Role |
|-------|------|------|
| Frontend | GitHub Pages | Display + upload UI (static) |
| API | Railway | Sessions, codes, file uploads |
| Database | Railway Postgres | Session and media metadata |
| File storage | Railway API disk | Uploaded photos/videos served at `/uploads` |
