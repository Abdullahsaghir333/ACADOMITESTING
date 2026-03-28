import { GoogleGenerativeAI } from "@google/generative-ai";

/** Read env on each call — `.env` is applied in `index.ts` after imports, so module-level `process.env` would be stale. */
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

export async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  const model = getModel();
  const prompt =
    "Extract all readable text from this image with maximum accuracy. If text is small, rotated, or low contrast, still try to read it. Return only plain text in English.";
  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: buffer.toString("base64"),
      },
    },
  ]);
  const text = result.response.text();
  return text.trim();
}

export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
  const model = getModel();
  const prompt =
    "Transcribe this audio with high accuracy. Handle background noise and accents. Return only the clean transcription in English.";
  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType: mimeType || "audio/webm",
        data: buffer.toString("base64"),
      },
    },
  ]);
  return result.response.text().trim();
}

/**
 * Combine extracted material with the learner's instructions into structured study notes (markdown).
 */
export async function synthesizeLearningNotes(
  extractedText: string,
  userPrompt: string,
): Promise<string> {
  const model = getModel();
  const instructions = userPrompt.trim() || "No extra instructions.";
  const body = `You are Acadomi, an assistant for higher-education learners.

User instructions (prioritize these if they ask for something specific):
${instructions}

Source material (extracted from PDF, images, and/or audio):
---
${extractedText.slice(0, 120000)}
---

Produce a clear, professional response in markdown with:
1. **Summary** — short overview
2. **Key concepts** — bullet list
3. **Study tips** — 2–4 practical next steps

Keep tone academic but approachable. If the source is empty or unusable, say so briefly.`;

  const result = await model.generateContent(body);
  return result.response.text().trim();
}
