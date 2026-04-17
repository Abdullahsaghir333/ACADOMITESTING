# Acadomi

AI-powered personalized learning platform (Final Year Project). Monorepo layout for GitHub and deployment.

## Repository layout

| Path | Role |
|------|------|
| `frontend/` | Next.js (App Router, Tailwind v4) — UI |
| `backend/` | Express + MongoDB — **Ollama** (Llama 2 / Phi-3) for text; **Gemini** only for extraction/transcription |
| `python/services/podcast/` | Flask microservice: Gemini dialogue script + gTTS audio (port 5001) |
| `python/services/tutor/` | FastAPI: Edge TTS narration + MediaPipe webcam focus (port 5002) |

## Prerequisites

- **Node.js** 20+ (see `.nvmrc`)
- **MongoDB Atlas** (or local Mongo via Docker Compose)
- **Google AI Studio** API key — for **image/audio extraction** (uploads), **mic transcription**, and **podcasts**; set `GEMINI_API_KEY` in `backend/.env`
- **[Ollama](https://ollama.com/)** — **required** for all generated text: pull `llama2`, `phi3`, `phi3:mini` (**Llama 2** tutor, **Phi-3 Mini** notes/bookmarks, **Phi-3** cheat sheets / role reversal)

## Environment (backend)

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string for signing login tokens |
| `GEMINI_API_KEY` | Upload image/audio extraction, mic transcription, podcasts (not for tutor/notes text) |
| `FRONTEND_URL` | Next.js origin for CORS (e.g. `http://localhost:3000`) |
| `OLLAMA_HOST`, `OLLAMA_MODEL_*` | Ollama URL and models — see `backend/.env.example` |
| `GEMINI_MODEL` | Optional; defaults to `gemini-2.5-flash` (extraction / transcription only) |
| `PODCAST_SERVICE_URL` | Base URL of the Python podcast API (default `http://127.0.0.1:5001`) |
| `TUTOR_SERVICE_URL` | Base URL of the Python tutor API (default `http://127.0.0.1:5002`) |

Never commit `.env`.

## Environment (frontend)

Copy `frontend/.env.example` to `frontend/.env.local` if your API is not on `http://localhost:4000`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Install

From the repository root:

```bash
npm install
```

## Run (development)

**Backend** (http://localhost:4000):

```bash
npm run dev:backend
```

**Frontend** (http://localhost:3000):

```bash
npm run dev
```

Health check: [http://localhost:4000/health](http://localhost:4000/health) — should show `database: connected` and `gemini: configured` when env is set.

### Podcast service (optional)

Podcast generation calls a small Python app (separate process). The **Express API forwards** `GEMINI_API_KEY` (and optional `GEMINI_MODEL`) from `backend/.env`, so you usually do **not** need a second key in `python/services/podcast/.env`. Install **ffmpeg** so `pydub` can merge audio. If your interpreter is **Python 3.13+**, `requirements.txt` installs **`audioop-lts`** (stdlib `audioop` was removed; without it pydub errors on `audioop` / `pyaudioop`).

```bash
cd python/services/podcast
py -3.12 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

From the repo root (after the venv exists): `npm run dev:podcast`. The Node API must reach it (`PODCAST_SERVICE_URL` in `backend/.env`).

### Tutor service (optional — AI Meet + focus)

The tutor page uses **MediaPipe FaceMesh** via the legacy **Solutions** API (`mediapipe.solutions`). That stack only works on **Python 3.10–3.12** and only with **`mediapipe` before 0.10.30** — newer PyPI wheels (0.10.30+) dropped `mediapipe.solutions` in favor of Tasks, so this project pins **`mediapipe>=0.10.21,<0.10.30`** in `python/services/tutor/requirements.txt`.

```bash
cd python/services/tutor
py -3.12 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 5002
```

From the repo root (after `.venv` exists): `npm run dev:tutor`. Set `TUTOR_SERVICE_URL` in `backend/.env` (see `.env.example`). Check [http://127.0.0.1:5002/health](http://127.0.0.1:5002/health) — `mediapipe.ok` should be `true` when the interpreter and pinned package versions match.

## Current features (this milestone)

- **Auth:** Register, login (JWT in `localStorage`), profile & password on **Settings**.
- **Uploads (max 7 per user):** PDF (text via `pdf-parse`), images & audio via **Gemini**; optional prompt; stored extracted text + Gemini “processed notes” in MongoDB.
- **Podcast mode:** Pick a **completed** upload; backend calls the Python service (Gemini script + gTTS), stores **MP3 in MongoDB GridFS**, lists **Your podcasts** with replay and delete.
- **AI tutor (Meet-style):** Completed upload → slides + spoken narration + optional webcam focus; live Q&A via Gemini on the Node API; Python service handles Edge TTS (Microsoft neural voice via `edge-tts`, default `en-US-ChristopherNeural`) and focus frames (`TUTOR_SERVICE_URL`). Optional env: `EDGE_TTS_VOICE` in the tutor service.
- **Role reversal teaching:** Pick a topic + **completed** upload, **record** your explanation; Gemini transcribes, compares to your material, returns **scores + radar/bar charts + feedback**; saved in MongoDB; **Improve** re-records and updates the same session.
- **Navigation:** Dashboard, Uploads, Podcast mode, Settings, and platform roadmap links.

## Production build

```bash
npm run build:frontend
npm run build:backend
```

## Local MongoDB (optional)

```bash
docker compose up -d
```

## Troubleshooting

- **Backend exits on startup with `ENOENT` … `05-versions-space.pdf`:** the `pdf-parse` package root `index.js` runs a debug block under ESM. This project imports `pdf-parse/lib/pdf-parse.js` instead (see `backend/src/services/pdfText.ts`).
- **Browser console `chrome-extension://invalid`:** comes from a browser extension, not Acadomi — safe to ignore.
- **`ERR_CONNECTION_REFUSED` to port 4000:** the API is not running; start the backend with `npm run dev:backend`.
- **`JWT_SECRET not set` or auth returns 500:** add `JWT_SECRET=...` to `backend/.env`. The API reads it **on each request** (not at import time) so it stays in sync after `dotenv` loads. Check `/health` — `jwt` should be `"configured"`.
- **Podcast service `WinError 2` / ffprobe not found:** install a full **FFmpeg** build (includes **ffprobe**), add its `bin` folder to PATH, and restart the terminal. Or set **`ACADOMI_FFMPEG`** in `python/services/podcast/.env` to **`ffmpeg.exe`** or to that **`bin`** folder (see `python/services/podcast/README.md`).
- **Tutor focus returns 503 / `No module named 'mediapipe.solutions'`:** use **Python 3.10–3.12** and install from `python/services/tutor/requirements.txt`, which pins **`mediapipe<0.10.30`** (0.10.30+ wheels removed the Solutions API). If you already upgraded with `pip install -U mediapipe`, run `pip install 'mediapipe>=0.10.21,<0.10.30'` inside the tutor venv, restart `uvicorn`, and recheck `/health`.

## Security

- Rotate credentials if they were ever exposed.
- Do not commit secrets; use `.env` locally and platform env vars in deployment.

## License

Private / academic use — adjust as required by your institution.
