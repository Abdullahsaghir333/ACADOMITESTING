import { GoogleGenerativeAI } from "@google/generative-ai";
import Tesseract from "tesseract.js";

import {
  getImageTextBackend,
  getLlmBackend,
  ollamaModelLight,
  ollamaModelStructured,
  ollamaModelTutor,
  ollamaModelVision,
} from "./config.js";
import { ollamaChat, ollamaVisionChat } from "./ollama.js";

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

/** AI tutor: slides, live Q&A, ELI5 — Llama 2 via Ollama when LLM_BACKEND=ollama. */
export async function completeTutorPrompt(prompt: string): Promise<string> {
  if (getLlmBackend() === "ollama") {
    return ollamaChat(ollamaModelTutor(), prompt);
  }
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/** Study notes, bookmark recap/chat — lightweight local model. */
export async function completeLightPrompt(prompt: string): Promise<string> {
  if (getLlmBackend() === "ollama") {
    return ollamaChat(ollamaModelLight(), prompt);
  }
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/** Role-reversal JSON, cheat sheets — model that follows instructions / structure. */
export async function completeStructuredPrompt(prompt: string): Promise<string> {
  if (getLlmBackend() === "ollama") {
    return ollamaChat(ollamaModelStructured(), prompt);
  }
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  const mode = getImageTextBackend();

  if (mode === "tesseract") {
    const {
      data: { text },
    } = await Tesseract.recognize(buffer, "eng", {
      logger: () => {},
    });
    return text.trim();
  }

  if (mode === "ollama") {
    const prompt =
      "Extract all readable text from this image with maximum accuracy. If text is small, rotated, or low contrast, still try to read it. Return only plain text in English.";
    return ollamaVisionChat(ollamaModelVision(), prompt, buffer.toString("base64"));
  }

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
 * Speech → text. Ollama has no built-in general audio path; use Gemini when key is set, else error with a clear message.
 */
export async function transcribeAudioBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Audio transcription needs GEMINI_API_KEY (multimodal), or transcribe client-side / use a local Whisper server.",
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
