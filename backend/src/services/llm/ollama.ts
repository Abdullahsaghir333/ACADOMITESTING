import { ollamaBaseUrl } from "./config.js";

type ChatResponse = {
  message?: { content?: string };
  error?: string;
};

/**
 * Single-turn chat against Ollama (Llama 2, Phi, etc.). No streaming.
 */
export async function ollamaChat(model: string, userPrompt: string, system?: string): Promise<string> {
  const base = ollamaBaseUrl();
  const messages: { role: string; content: string }[] = [];
  if (system?.trim()) {
    messages.push({ role: "system", content: system.trim() });
  }
  messages.push({ role: "user", content: userPrompt });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 600_000);
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
      signal: ctrl.signal,
    });
    const data = (await res.json()) as ChatResponse & { message?: { content: string } };
    if (!res.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : `Ollama HTTP ${res.status}`,
      );
    }
    const text = data.message?.content?.trim() ?? "";
    if (!text) {
      throw new Error("Ollama returned empty content");
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Vision: image as base64 in the chat payload (llava, etc.).
 */
export async function ollamaVisionChat(
  model: string,
  prompt: string,
  imageBase64: string,
): Promise<string> {
  const base = ollamaBaseUrl();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 600_000);
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
            images: [imageBase64],
          },
        ],
        stream: false,
      }),
      signal: ctrl.signal,
    });
    const data = (await res.json()) as ChatResponse & { error?: string };
    if (!res.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : `Ollama vision HTTP ${res.status}`,
      );
    }
    const text = data.message?.content?.trim() ?? "";
    if (!text) {
      throw new Error("Ollama vision returned empty content");
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}
