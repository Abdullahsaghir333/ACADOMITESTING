import { getLlmBackend } from "./config.js";

/** True when the configured text LLM backend can run (Gemini key, or Ollama mode). */
export function isLlmConfigured(): boolean {
  if (getLlmBackend() === "ollama") {
    return true;
  }
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/** Audio transcription in `router.ts` still uses Gemini multimodal unless extended. */
export function hasGeminiForTranscription(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}
