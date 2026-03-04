<p align="center">
  <img src="https://img.shields.io/badge/SIGNAL_STUDIO-ENTERPRISE-e81c3c?style=for-the-badge&labelColor=000000" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel" />
  <img src="https://img.shields.io/badge/Render-Deploy-46E3B7?style=for-the-badge&logo=render" />
</p>

<h1 align="center">🔴 SIGNAL STUDIO ENTERPRISE</h1>
<p align="center"><b>AI-powered YouTube Shorts automation platform for news channels</b><br>
Fetch live news → Design broadcast-quality Shorts → Export HD video → Auto-post to YouTube</p>

---

## ✨ Features

| Feature | Details |
|---|---|
| 📡 **Live News** | GNews API + Claude AI rewriter — real breaking headlines every fetch |
| 🎬 **Studio Preview** | 9:16 broadcast frame with ticker, lower-thirds, breaking label |
| 🎵 **Music Engine** | 6 AI-synthesized tracks (Urgent, Finance, Cinematic, Tech, Drama) — baked into video |
| ⬇ **HD Export** | 720p / 1080p / 4K · 2–25 Mbps · 24/30/60fps · WEBM/MP4 |
| 📤 **YouTube Upload** | OAuth 2.0 — auto-upload with title template, tags, description |
| ⏱ **Automation** | Schedule posts every 1h / 2h / 3h / 6h / 12h / 24h |
| 📊 **Analytics** | KPI dashboard, category chart, publication history |
| ⌨ **Shortcuts** | `F` fetch · `Space` play · `←/→` stories · `E` export |

---

## 🚀 Deploy in 5 Minutes

### Option A — Render (Free tier, recommended)

1. Push this folder to a **GitHub repo** (can be private)
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your repo
4. Set **Environment Variables** in the Render dashboard:

   | Key | Value |
   |-----|-------|
   | `ANTHROPIC_API_KEY` | From [console.anthropic.com](https://console.anthropic.com) |
   | `GNEWS_API_KEY` | From [gnews.io](https://gnews.io) |

5. Click **Deploy** — live in ~2 minutes at `https://signal-studio-xxxx.onrender.com`

---

### Option B — Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd signal-studio
vercel

# Add env vars in Vercel dashboard:
# ANTHROPIC_API_KEY + GNEWS_API_KEY
```

---

### Option C — Local Development

```bash
# 1. Clone / download the project
cd signal-studio

# 2. Copy env template
cp .env.example .env

# 3. Fill in your API keys in .env
nano .env   # or open in your editor

# 4. Install dependencies
npm install

# 5. Start the server
npm start

# 6. Open in browser
open http://localhost:3000
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Required — Anthropic Claude API key
# Get from: https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Required — GNews API key for live headlines
# Get from: https://gnews.io (free tier: 100 req/day)
GNEWS_API_KEY=your_gnews_key_here

# Optional — defaults to 3000
PORT=3000
```

> ⚠️ **Never commit your `.env` file to GitHub.**
> It is already listed in `.gitignore`.
> Always set environment variables via your hosting provider's dashboard.

---

## 🏗 Architecture

```
signal-studio/
├── server.js          ← Express backend (API keys live here only)
│   ├── GET  /api/health             health check
│   ├── POST /api/news               GNews + Claude rewriter (proxied)
│   └── POST /api/youtube/init-upload  YouTube upload proxy
│
├── public/
│   └── index.html     ← Full enterprise frontend (4 views)
│
├── .env               ← Your secrets (git-ignored ✅)
├── .env.example       ← Template (safe to commit)
├── vercel.json        ← Vercel deployment config
├── render.yaml        ← Render deployment config
├── package.json
└── README.md
```

### How the API flow works

```
Browser → POST /api/news
            └→ server.js reads GNEWS_API_KEY (hidden)
                  └→ GNews API (raw headlines)
                  └→ ANTHROPIC_API_KEY (hidden)
                        └→ Claude rewrites to broadcast style
            └→ returns JSON stories to browser

Browser never sees your API keys.
```

---

## 🎬 YouTube Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **YouTube Data API v3**
3. Create **OAuth 2.0 credentials** (Web Application)
4. Add your deployed URL as an **Authorized redirect URI**
5. In Signal Studio: Settings → YouTube API → paste Client ID → click Authorize
6. Complete the Google sign-in popup

The OAuth flow runs in the user's browser. YouTube access token is never stored on your server.

---

## 🔑 Getting API Keys

| Service | Where to get it | Free tier |
|---------|----------------|-----------|
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com) | Pay per use (~$0.003/fetch) |
| **GNews** | [gnews.io](https://gnews.io) | 100 requests/day free |
| **YouTube** | [console.cloud.google.com](https://console.cloud.google.com) | Free (quota limits apply) |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F` | Fetch live news |
| `Space` | Play preview animation |
| `← / →` | Previous / next story |
| `E` | Export video |
| `P` | Export PNG frame |
| `1` | Go to Newsroom |
| `2` | Go to Studio |
| `3` | Go to Analytics |
| `4` | Go to Settings |
| `Esc` | Close modal |

---

## 📦 Tech Stack

- **Backend:** Node.js + Express
- **AI:** Anthropic Claude (web search + rewriting)
- **News:** GNews.io API
- **Video:** MediaRecorder API + html2canvas
- **Audio:** Web Audio API (synthesized music)
- **Upload:** YouTube Data API v3
- **Deploy:** Render / Vercel

---

<p align="center">Built with ❤️ — SIGNAL STUDIO ENTERPRISE v2.0</p>
