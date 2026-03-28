import { Router, type Response } from "express";
import mongoose from "mongoose";

import { Podcast, type PodcastLean } from "../models/Podcast.js";
import { Upload } from "../models/Upload.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import {
  deletePodcastAudio,
  downloadPodcastAudioStream,
  uploadPodcastAudio,
} from "../services/gridfsPodcast.js";

const router = Router();
const MAX_PODCASTS_PER_USER = 20;

type PyPayload = {
  script?: { speaker: string; text: string }[];
  mimeType?: string;
  durationMs?: number;
  audioBase64?: string;
  error?: string;
};

router.get("/", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const list = await Podcast.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean<PodcastLean[]>();
    return res.json({
      podcasts: list.map((p) => ({
        id: p._id.toString(),
        sourceUploadId: p.sourceUploadId.toString(),
        title: p.title,
        script: p.script,
        mimeType: p.mimeType,
        durationMs: p.durationMs,
        byteLength: p.byteLength,
        createdAt: p.createdAt,
      })),
      maxPodcasts: MAX_PODCASTS_PER_USER,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not list podcasts." });
  }
});

router.post("/generate", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const pyBase = process.env.PODCAST_SERVICE_URL?.trim() || "http://127.0.0.1:5001";

  try {
    const uploadId = (req.body as { uploadId?: string })?.uploadId;
    if (!uploadId || !mongoose.Types.ObjectId.isValid(uploadId)) {
      return res.status(400).json({ error: "Valid uploadId is required." });
    }

    const upload = await Upload.findOne({
      _id: uploadId,
      userId: req.userId,
    });
    if (!upload) {
      return res.status(404).json({ error: "Upload not found." });
    }
    if (upload.status !== "completed") {
      return res.status(400).json({ error: "Only completed uploads can be turned into a podcast." });
    }

    const material =
      [upload.processedContent, upload.extractedText].filter(Boolean).join("\n\n").trim();
    if (!material) {
      return res.status(400).json({ error: "This upload has no text to narrate." });
    }

    const existingCount = await Podcast.countDocuments({ userId: req.userId });
    if (existingCount >= MAX_PODCASTS_PER_USER) {
      return res.status(400).json({
        error: `You can keep at most ${MAX_PODCASTS_PER_USER} podcasts. Delete one to generate another.`,
      });
    }

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5 * 60 * 1000);
    let pyRes: globalThis.Response;
    try {
      pyRes = await fetch(`${pyBase.replace(/\/$/, "")}/generate-podcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: material }),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(t);
    }

    const rawText = await pyRes.text();
    let data: PyPayload;
    try {
      data = JSON.parse(rawText) as PyPayload;
    } catch {
      return res.status(502).json({ error: "Podcast service returned invalid JSON." });
    }

    if (!pyRes.ok) {
      return res.status(502).json({ error: data.error ?? "Podcast generation failed." });
    }

    if (!data.audioBase64 || !data.mimeType) {
      return res.status(502).json({ error: "Podcast service response missing audio." });
    }

    const audioBuffer = Buffer.from(data.audioBase64, "base64");
    if (audioBuffer.length === 0) {
      return res.status(502).json({ error: "Empty audio from podcast service." });
    }

    const filename = `podcast-${req.userId}-${Date.now()}.mp3`;
    const fileId = await uploadPodcastAudio(audioBuffer, filename, data.mimeType);

    const doc = await Podcast.create({
      userId: req.userId,
      sourceUploadId: upload._id,
      title: `Podcast — ${upload.title}`,
      script: Array.isArray(data.script) ? data.script : [],
      audioFileId: fileId,
      mimeType: data.mimeType,
      durationMs: typeof data.durationMs === "number" ? data.durationMs : 0,
      byteLength: audioBuffer.length,
    });

    return res.status(201).json({
      podcast: {
        id: doc._id.toString(),
        sourceUploadId: doc.sourceUploadId.toString(),
        title: doc.title,
        script: doc.script,
        mimeType: doc.mimeType,
        durationMs: doc.durationMs,
        byteLength: doc.byteLength,
        createdAt: doc.createdAt,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return res.status(504).json({ error: "Podcast generation timed out." });
    }
    console.error(e);
    return res.status(500).json({
      error:
        e instanceof Error && e.message.includes("fetch")
          ? "Cannot reach podcast service. Start the Python service and check PODCAST_SERVICE_URL."
          : "Podcast generation failed.",
    });
  }
});

router.get("/:id/audio", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const p = await Podcast.findOne({ _id: id, userId: req.userId }).lean<PodcastLean | null>();
    if (!p) {
      return res.status(404).json({ error: "Podcast not found." });
    }
    res.setHeader("Content-Type", p.mimeType);
    res.setHeader("Content-Length", String(p.byteLength));
    res.setHeader("Cache-Control", "private, max-age=3600");
    const stream = downloadPodcastAudioStream(p.audioFileId);
    stream.on("error", () => {
      if (!res.headersSent) res.status(500).end();
    });
    stream.pipe(res);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not stream audio." });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const p = await Podcast.findOne({ _id: id, userId: req.userId });
    if (!p) {
      return res.status(404).json({ error: "Podcast not found." });
    }
    await deletePodcastAudio(p.audioFileId);
    await p.deleteOne();
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not delete podcast." });
  }
});

export default router;
