# Acadomi

AI-powered personalized learning platform (Final Year Project). Monorepo layout for GitHub and deployment.

## Repository layout

| Path | Role |
|------|------|
| `frontend/` | Next.js (App Router, Tailwind v4) — UI |
| `backend/` | Express + MongoDB API |
| `python/` | Python services (OCR, Whisper, CV, ML). Per-service `.python-version` + venv |

## Prerequisites

- **Node.js** 20+ (see `.nvmrc`)
- **Python** 3.10+ (optional until you add ML services)
- **MongoDB Atlas** or local Mongo via Docker Compose

## Install

From the repository root:

```bash
npm install
```

## Run (development)

**Frontend** (Next.js — http://localhost:3000):

```bash
npm run dev
```

or:

```bash
npm run dev:frontend
```

**Backend** (Express — http://localhost:4000):

```bash
npm run dev:backend
```

Create `backend/.env` from `backend/.env.example` and set `MONGODB_URI`. **Never commit `.env`** — it is gitignored.

**Health check:** [http://localhost:4000/health](http://localhost:4000/health) — JSON includes `database: connected` when MongoDB is reachable.

## Production build

```bash
npm run build:frontend
npm run build:backend
```

## Python services

See `python/README.md`. Each service folder keeps its own virtual environment and dependencies.

## Local MongoDB (optional)

```bash
docker compose up -d
```

## GitHub

First push (if the repo is new):

```bash
git add .
git commit -m "Initial Acadomi UI and API scaffold"
git branch -M main
git remote add origin https://github.com/salmansaleem08/Acadomi.git
git push -u origin main
```

If `origin` already exists, use `git remote set-url origin https://github.com/salmansaleem08/Acadomi.git` then `git push -u origin main`.

## Security

- Rotate any database password that was shared in plain text or chat, and update `MONGODB_URI` in `backend/.env` only.
- Do not commit secrets; use environment variables and `.env.example` templates.

## License

Private / academic use — adjust as required by your institution.
