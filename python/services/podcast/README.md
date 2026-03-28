# Acadomi — Podcast generator (Python)

Generates a two-speaker script with **Google Gemini** and audio with **gTTS** + **pydub**.

## Prerequisites

- **Python 3.12.x** (see `.python-version`; use [pyenv](https://github.com/pyenv/pyenv) / [pyenv-win](https://github.com/pyenv-win/pyenv-win))
- **ffmpeg** on your `PATH` (required by pydub).  
  - Windows: `choco install ffmpeg` or download from [ffmpeg.org](https://ffmpeg.org/) and add `bin` to PATH.
- **GEMINI_API_KEY** in `.env` (same key as the Node backend is fine for local dev)

## Setup

```bash
cd python/services/podcast
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.

## Run

```bash
python app.py
```

Default URL: **http://127.0.0.1:5001**

The Node **Express** API calls this service (`PODCAST_SERVICE_URL` in `backend/.env`). You normally do **not** expose this port publicly in production without authentication.
