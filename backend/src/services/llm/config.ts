/** Read env on each call — `dotenv` may load after imports. */

export type LlmBackend = "gemini" | "ollama";

export function getLlmBackend(): LlmBackend {
  const raw = process.env.LLM_BACKEND?.trim().toLowerCase();
  if (raw === "ollama") return "ollama";
  if (raw === "gemini") return "gemini";
  if (raw === "auto") {
    return process.env.OLLAMA_HOST?.trim() ? "ollama" : "gemini";
  }
  return "gemini";
}

export function ollamaBaseUrl(): string {
  return (process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434").replace(/\/$/, "");
}

export function ollamaModelTutor(): string {
  return process.env.OLLAMA_MODEL_TUTOR?.trim() || "llama2";
}

/** Notes, bookmarks, recap — small / fast local model. */
export function ollamaModelLight(): string {
  return process.env.OLLAMA_MODEL_LIGHT?.trim() || "phi3:mini";
}

/** JSON evaluation, cheat sheets — slightly stronger local model. */
export function ollamaModelStructured(): string {
  return process.env.OLLAMA_MODEL_STRUCTURED?.trim() || "phi3";
}

export function ollamaModelVision(): string {
  return process.env.OLLAMA_MODEL_VISION?.trim() || "llava";
}

export type ImageTextBackend = "gemini" | "tesseract" | "ollama";

export function getImageTextBackend(): ImageTextBackend {
  const raw = process.env.IMAGE_TEXT_BACKEND?.trim().toLowerCase();
  if (raw === "tesseract" || raw === "ollama" || raw === "gemini") return raw;
  return getLlmBackend() === "ollama" ? "tesseract" : "gemini";
}
