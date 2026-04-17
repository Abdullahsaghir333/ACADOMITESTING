/** Google Gemini API key — required for image/audio extraction and transcription only (not for Llama/Phi text). */
export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Text features (tutor, notes, bookmarks, cheat sheets, role reversal) always use Ollama.
 * This is always true; failures surface when Ollama is unreachable.
 */
export function isLlmConfigured(): boolean {
  return true;
}

/** Same as hasGeminiApiKey — used for mic/upload audio→text and image extraction. */
export function hasGeminiForTranscription(): boolean {
  return hasGeminiApiKey();
}
