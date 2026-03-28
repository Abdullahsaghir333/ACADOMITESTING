import mongoose, { Schema, type InferSchemaType } from "mongoose";

const friendInviteSchema = new Schema(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

/** At most one pending invite per (from → to) direction. */
friendInviteSchema.index(
  { fromUserId: 1, toUserId: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

export type FriendInviteDoc = InferSchemaType<typeof friendInviteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type FriendInviteLean = {
  _id: mongoose.Types.ObjectId;
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  updatedAt: Date;
};

export const FriendInvite =
  mongoose.models.FriendInvite ?? mongoose.model<FriendInviteDoc>("FriendInvite", friendInviteSchema);
