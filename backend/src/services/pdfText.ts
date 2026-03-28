/**
 * Import the parser directly — the package root `index.js` runs a debug block
 * when loaded as ESM (tsx) that tries to read a missing test PDF and crashes startup.
 */
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  const text = (data.text ?? "").trim();
  if (!text) {
    throw new Error("No text could be extracted from this PDF (it may be scanned-only). Try images instead.");
  }
  return text;
}
