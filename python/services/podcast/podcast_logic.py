"""
Gemini → two-person script → gTTS + pydub → MP3 bytes.
"""
from __future__ import annotations

import base64
import json
import os
import re
import tempfile
from typing import Any

import google.generativeai as genai
from gtts import gTTS
from pydub import AudioSegment
from pydub.utils import which

# Help pydub find ffmpeg (Windows / PATH)
_ff = which("ffmpeg") or "ffmpeg"
AudioSegment.converter = _ff
AudioSegment.ffmpeg = _ff


def _configure_gemini(
    override_key: str | None = None,
    override_model: str | None = None,
) -> str:
    key = (override_key or "").strip() or os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Either add it to backend/.env (the API forwards it) "
            "or set it in python/services/podcast/.env when running the podcast app alone."
        )
    genai.configure(api_key=key)
    model = (override_model or "").strip() or os.environ.get("GEMINI_MODEL", "").strip()
    return model or "gemini-2.5-flash"


def generate_script_from_gemini(
    source_text: str,
    *,
    gemini_api_key: str | None = None,
    gemini_model: str | None = None,
) -> list[dict[str, str]]:
    model_name = _configure_gemini(gemini_api_key, gemini_model)
    model = genai.GenerativeModel(model_name)

    text = source_text.strip()
    if len(text) > 120_000:
        text = text[:120_000] + "\n\n[truncated for model context]"

    prompt = f"""You are a podcast scriptwriter. Convert the following study material into a natural,
two-person conversational podcast between Alice (female) and Bob (male).

RULES:
- Do NOT invent facts beyond what the material reasonably supports
- Stay faithful to the meaning of the text
- Friendly, clear, suitable for students
- Alternate speakers (Alice, then Bob, then Alice, …)
- About 8–14 short turns total
- Only dialogue, no stage directions
- Output ONLY valid JSON (no markdown fences), exactly this shape:
  [{{"speaker":"Alice","text":"..."}},{{"speaker":"Bob","text":"..."}}, ...]
- speaker must be exactly "Alice" or "Bob"
- text must be plain English suitable for text-to-speech (no emojis, minimal punctuation)

MATERIAL:
---
{text}
---

JSON array only:"""

    response = model.generate_content(prompt)
    raw = (response.text or "").strip()

    # Strip accidental ```json fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\[[\s\S]*\]", raw)
        if not m:
            raise ValueError("Gemini did not return valid JSON dialogue") from None
        data = json.loads(m.group())

    if not isinstance(data, list):
        raise ValueError("Expected JSON array of dialogue turns")

    lines: list[dict[str, str]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        sp = str(item.get("speaker", "")).strip()
        tx = str(item.get("text", "")).strip()
        if sp not in ("Alice", "Bob") or not tx:
            continue
        lines.append({"speaker": sp, "text": tx})

    if len(lines) < 2:
        raise ValueError("Not enough dialogue lines from Gemini; try again or shorten the source.")

    return lines


def create_podcast_mp3_bytes(script: list[dict[str, str]]) -> tuple[bytes, int]:
    """Returns (mp3_bytes, approximate_duration_ms)."""
    segments: list[AudioSegment] = []
    tmpdir = tempfile.mkdtemp(prefix="acadomi_pod_")
    try:
        for i, turn in enumerate(script):
            tts = gTTS(
                text=turn["text"],
                lang="en",
                tld="co.uk" if turn["speaker"] == "Alice" else "co.in",
            )
            path = os.path.join(tmpdir, f"line_{i}.mp3")
            tts.save(path)
            seg = AudioSegment.from_mp3(path)
            segments.append(seg)
            segments.append(AudioSegment.silent(duration=400))
        if not segments:
            raise ValueError("No audio segments")
        # drop trailing silence
        if segments and len(segments) > 1:
            segments = segments[:-1]
        combined = segments[0]
        for s in segments[1:]:
            combined += s
        out = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
        out.close()
        try:
            combined.export(out.name, format="mp3", bitrate="64k")
            with open(out.name, "rb") as f:
                data = f.read()
        finally:
            if os.path.exists(out.name):
                os.remove(out.name)
        duration_ms = int(combined.duration_seconds * 1000)
        return data, duration_ms
    finally:
        for name in os.listdir(tmpdir):
            try:
                os.remove(os.path.join(tmpdir, name))
            except OSError:
                pass
        try:
            os.rmdir(tmpdir)
        except OSError:
            pass


def build_podcast_payload(
    source_text: str,
    *,
    gemini_api_key: str | None = None,
    gemini_model: str | None = None,
) -> dict[str, Any]:
    script = generate_script_from_gemini(
        source_text,
        gemini_api_key=gemini_api_key,
        gemini_model=gemini_model,
    )
    audio_bytes, duration_ms = create_podcast_mp3_bytes(script)
    return {
        "script": script,
        "mimeType": "audio/mpeg",
        "durationMs": duration_ms,
        "audioBase64": base64.b64encode(audio_bytes).decode("ascii"),
    }
