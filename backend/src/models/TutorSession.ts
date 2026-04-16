import mongoose, { Schema } from "mongoose";

const pointTimingSchema = new Schema(
  {
    startMs: { type: Number, required: true, min: 0 },
    endMs: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const tutorSlideSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    points: [{ type: String, trim: true, maxlength: 500 }],
    script: { type: String, required: true, trim: true, maxlength: 8000 },
    /**
     * Estimated ms timeline for each bullet over the spoken script (same order as points).
     * Values are on an arbitrary scale; the client scales to real audio duration.
     */
    pointTimings: { type: [pointTimingSchema], default: [] },
    /** Cached "explain like I'm five" script; Gemini runs only on first request per slide. */
    eli5Script: { type: String, default: "", trim: true, maxlength: 8000 },
  },
  { _id: false },
);

const tutorSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sourceUploadId: { type: Schema.Types.ObjectId, ref: "Upload", required: true },
    topicFocus: { type: String, default: "", trim: true, maxlength: 400 },
    displayTitle: { type: String, required: true, trim: true, maxlength: 220 },
    slides: { type: [tutorSlideSchema], default: [] },
    status: {
      type: String,
      enum: ["ready", "failed"],
      default: "ready",
    },
    errorMessage: { type: String },
  },
  { timestamps: true },
);

export type TutorPointTiming = { startMs: number; endMs: number };

export type TutorSlideLean = {
  title: string;
  points: string[];
  script: string;
  pointTimings?: TutorPointTiming[];
  eli5Script?: string;
};

export type TutorSessionLean = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sourceUploadId: mongoose.Types.ObjectId;
  topicFocus: string;
  displayTitle: string;
  slides: TutorSlideLean[];
  status: "ready" | "failed";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const TutorSession =
  mongoose.models.TutorSession ?? mongoose.model("TutorSession", tutorSessionSchema);
