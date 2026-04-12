# Terraform + Azure — 30-Day Learning Platform

A full Node.js web app for learning Terraform with an Azure focus. Beginner to advanced.

## Features
- 30 days of structured content: Theory, Hands-on Lab, Daily Challenge
- AI Deep Dive page for every day (powered by Anthropic API)
- Progress tracking (localStorage)
- Color-coded by phase
- Dark theme, fully responsive

## Local Development

```bash
npm install
node server.js
# App runs at http://localhost:3000
```

## Hosting on Railway (Free — Recommended)

1. Push this folder to a GitHub repo
2. Go to railway.app → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variable: (none needed for basic use)
5. For AI Deep Dive: Railway auto-injects Anthropic API key if you add it in Variables
6. Deploy — Railway gives you a public URL in ~60 seconds

## Hosting on Render (Free)

1. Push to GitHub
2. render.com → New → Web Service → Connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add env var `PORT` = 3000 (Render sets this automatically)
6. Deploy

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `PORT` | Server port (default 3000) | No |

The Anthropic API key is handled by the claude.ai infrastructure when running inside an artifact — no key needed for local dev if you disable the AI route, or set `ANTHROPIC_API_KEY` for standalone deployment.

## Project Structure

```
tf-learn/
├── server.js          # Express app
├── data/
│   └── course.js      # All 30 days content
├── views/
│   ├── index.ejs      # Dashboard
│   ├── day.ejs        # Individual lesson
│   ├── deep-dive.ejs  # AI chat page
│   └── partials/
│       ├── header.ejs
│       └── footer.ejs
├── public/
│   ├── css/style.css
│   └── js/main.js
├── package.json
└── Procfile
```

## Adding Content

Edit `data/course.js`. Days 1–5 have full content. Days 6–30 have stubs — add full theory/lab/challenge objects following the same structure as Day 1.
