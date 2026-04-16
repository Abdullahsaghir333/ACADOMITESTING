import { Router, type Response } from "express";
import mongoose from "mongoose";

import { CheatSheet, type CheatSheetLean } from "../models/CheatSheet.js";
import { Upload } from "../models/Upload.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import { generateSmartCheatSheetMarkdown } from "../services/gemini.js";
import { isLlmConfigured } from "../services/llm/llmReady.js";

const router = Router();
const MAX_CHEAT_SHEETS_PER_USER = 30;

function previewFromMarkdown(md: string, max = 220): string {
  const flat = md.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}

function serializeListItem(s: CheatSheetLean) {
  return {
    id: s._id.toString(),
    sourceUploadId: s.sourceUploadId.toString(),
    topic: s.topic,
    title: s.title,
    preview: previewFromMarkdown(s.markdown),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

router.get("/", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const list = await CheatSheet.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .lean<CheatSheetLean[]>();
    return res.json({
      sheets: list.map(serializeListItem),
      maxSheets: MAX_CHEAT_SHEETS_PER_USER,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not list cheat sheets." });
  }
});

router.post("/generate", authMiddleware, async (req: AuthedRequest, res: Response) => {
  if (!isLlmConfigured()) {
    return res.status(500).json({
      error:
        "LLM is not configured. Set LLM_BACKEND=ollama with Ollama running, or set GEMINI_API_KEY.",
    });
  }

  const uploadId = typeof req.body?.uploadId === "string" ? req.body.uploadId.trim() : "";
  const topic = typeof req.body?.topic === "string" ? req.body.topic.trim().slice(0, 500) : "";

  if (!uploadId || !mongoose.Types.ObjectId.isValid(uploadId)) {
    return res.status(400).json({ error: "Valid uploadId is required." });
  }
  if (!topic) {
    return res.status(400).json({ error: "Topic is required (what to focus the cheat sheet on)." });
  }

  try {
    const upload = await Upload.findOne({
      _id: uploadId,
      userId: req.userId,
      status: "completed",
    });
    if (!upload) {
      return res.status(404).json({ error: "Upload not found or not completed." });
    }

    const material =
      [upload.processedContent, upload.extractedText].filter(Boolean).join("\n\n").trim();
    if (!material) {
      return res.status(400).json({ error: "This upload has no text to build from." });
    }

    const count = await CheatSheet.countDocuments({ userId: req.userId });
    if (count >= MAX_CHEAT_SHEETS_PER_USER) {
      return res.status(400).json({
        error: `You can keep at most ${MAX_CHEAT_SHEETS_PER_USER} cheat sheets. Delete one to create another.`,
      });
    }

    const markdown = await generateSmartCheatSheetMarkdown(material, topic);
    if (!markdown.trim()) {
      return res.status(500).json({ error: "Model returned an empty cheat sheet." });
    }

    const baseTitle = `${upload.title || "Notes"}`.trim().slice(0, 140);
    const title = `${baseTitle} — ${topic}`.slice(0, 240);

    const created = await CheatSheet.create({
      userId: req.userId,
      sourceUploadId: upload._id,
      topic,
      title,
      markdown: markdown.trim(),
    });

    const lean = created.toObject() as CheatSheetLean;
    return res.status(201).json({
      sheet: {
        ...serializeListItem(lean),
        markdown: lean.markdown,
      },
    });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Could not generate cheat sheet.";
    return res.status(500).json({ error: msg });
  }
});

router.get("/:id", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const s = await CheatSheet.findOne({ _id: id, userId: req.userId }).lean<CheatSheetLean | null>();
    if (!s) {
      return res.status(404).json({ error: "Cheat sheet not found." });
    }
    return res.json({
      sheet: {
        id: s._id.toString(),
        sourceUploadId: s.sourceUploadId.toString(),
        topic: s.topic,
        title: s.title,
        markdown: s.markdown,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not load cheat sheet." });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const r = await CheatSheet.findOneAndDelete({ _id: id, userId: req.userId });
    if (!r) {
      return res.status(404).json({ error: "Cheat sheet not found." });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not delete cheat sheet." });
  }
});

export default router;
