/**
 * Model dispatch (actual API call sites in this file):
 * | Lines   | Model / SDK        | What calls it |
 * |---------|--------------------|---------------|
 * | 17–25   | Gemini SDK         | `getGeminiModel()` — `GEMINI_MODEL` env |
 * | 30–32   | Llama 2 (Ollama)   | `completeTutorPrompt` → `ollamaChat(ollamaModelTutor(), …)` |
 * | 37–38   | Phi-3 Mini         | `completeLightPrompt` → `ollamaChat(ollamaModelLight(), …)` |
 * | 44–45   | Phi-3              | `completeStructuredPrompt` → `ollamaChat(ollamaModelStructured(), …)` |
 * | 51–65   | Gemini multimodal  | `extractTextFromImage` |
 * | 70–89   | Gemini multimodal  | `transcribeAudioBuffer` |
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

import { ollamaModelLight, ollamaModelStructured, ollamaModelTutor } from "./config.js";
import { ollamaChat } from "./ollama.js";

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Tutor slides, live Q&A, ELI5 — **Llama 2** via Ollama only (never Gemini).
 */
export async function completeTutorPrompt(prompt: string): Promise<string> {
  return ollamaChat(ollamaModelTutor(), prompt);
}

/**
 * Study notes, bookmark recap, bookmark chat — **Phi-3 Mini** via Ollama only.
 */
export async function completeLightPrompt(prompt: string): Promise<string> {
  return ollamaChat(ollamaModelLight(), prompt);
}

/**
 * Role-reversal evaluation, cheat sheets — **Phi-3** via Ollama only.
 */
export async function completeStructuredPrompt(prompt: string): Promise<string> {
  return ollamaChat(ollamaModelStructured(), prompt);
}

/**
 * Image → text: **Gemini** multimodal only (upload extraction). Not Ollama.
 */
export async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent([
    {
      text: "Extract all readable text from this image with maximum accuracy. If text is small, rotated, or low contrast, still try to read it. Return only plain text in English.",
    },
    {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: buffer.toString("base64"),
      },
    },
  ]);
  return result.response.text().trim();
}

/**
 * Audio → text: **Gemini** multimodal only (uploads + mic transcription).
 */
export async function transcribeAudioBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Audio transcription requires GEMINI_API_KEY (Gemini multimodal). Set it in backend/.env.",
    );
  }
  const model = getGeminiModel();
  const result = await model.generateContent([
    {
      text: "Transcribe this audio with high accuracy. Handle background noise and accents. Return only the clean transcription in English.",
    },
    {
      inlineData: {
        mimeType: mimeType || "audio/webm",
        data: buffer.toString("base64"),
      },
    },
  ]);
  return result.response.text().trim();
}
