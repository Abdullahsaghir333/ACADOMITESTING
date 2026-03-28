import { Readable } from "stream";

import mongoose from "mongoose";

import { PODCAST_GRIDFS_BUCKET } from "../models/Podcast.js";

function bucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  return new mongoose.mongo.GridFSBucket(db, { bucketName: PODCAST_GRIDFS_BUCKET });
}

export async function uploadPodcastAudio(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<mongoose.Types.ObjectId> {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket().openUploadStream(filename, {
      contentType: mimeType,
    });
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => {
      resolve(uploadStream.id as mongoose.Types.ObjectId);
    });
    Readable.from(buffer).pipe(uploadStream);
  });
}

export function downloadPodcastAudioStream(fileId: mongoose.Types.ObjectId) {
  return bucket().openDownloadStream(fileId);
}

export async function deletePodcastAudio(fileId: mongoose.Types.ObjectId): Promise<void> {
  try {
    await bucket().delete(fileId);
  } catch (e) {
    console.warn("GridFS delete (may already be gone):", e);
  }
}
