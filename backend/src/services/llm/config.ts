/** Read env on each call — `dotenv` may load after imports. */

/**
 * Default Ollama tag names (consumed by `router.ts` `completeTutorPrompt` / `completeLightPrompt` / `completeStructuredPrompt`):
 * | Lines   | Export                 | Default model id |
 * |---------|------------------------|------------------|
 * | 22–24   | ollamaModelTutor()     | llama2           |
 * | 27–29   | ollamaModelLight()     | phi3:mini        |
 * | 32–34   | ollamaModelStructured()| phi3             |
 */

/** Text generation always uses Ollama (Llama 2 / Phi-3 / Phi-3 Mini). Gemini is only for extraction in `router.ts`. */
export function getLlmBackend(): "ollama" {
  return "ollama";
}

export function ollamaBaseUrl(): string {
  return (process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434").replace(/\/$/, "");
}

/** Tutor slides, Q&A, ELI5 — default Llama 2. */
export function ollamaModelTutor(): string {
  return process.env.OLLAMA_MODEL_TUTOR?.trim() || "llama2";
}

/** Study notes, bookmark recap, bookmark chat — default Phi-3 Mini. */
export function ollamaModelLight(): string {
  return process.env.OLLAMA_MODEL_LIGHT?.trim() || "phi3:mini";
}

/** Role-reversal evaluation, cheat sheets — default Phi-3. */
export function ollamaModelStructured(): string {
  return process.env.OLLAMA_MODEL_STRUCTURED?.trim() || "phi3";
}
