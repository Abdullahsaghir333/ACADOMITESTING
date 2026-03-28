import mongoose, { Schema, type InferSchemaType } from "mongoose";

const cheatSheetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sourceUploadId: { type: Schema.Types.ObjectId, ref: "Upload", required: true },
    /** Learner's focus topic for this sheet */
    topic: { type: String, required: true, trim: true, maxlength: 500 },
    /** Display line in lists */
    title: { type: String, required: true, trim: true, maxlength: 240 },
    /** Full markdown body (tables, headers, etc.) */
    markdown: { type: String, required: true, trim: true, maxlength: 120_000 },
  },
  { timestamps: true },
);

export type CheatSheetDoc = InferSchemaType<typeof cheatSheetSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type CheatSheetLean = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sourceUploadId: mongoose.Types.ObjectId;
  topic: string;
  title: string;
  markdown: string;
  createdAt: Date;
  updatedAt: Date;
};

export const CheatSheet =
  mongoose.models.CheatSheet ?? mongoose.model<CheatSheetDoc>("CheatSheet", cheatSheetSchema);
