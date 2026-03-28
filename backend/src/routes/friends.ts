import { Router, type Response } from "express";
import mongoose from "mongoose";

import { FriendInvite, type FriendInviteLean } from "../models/FriendInvite.js";
import { User } from "../models/User.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";

const router = Router();

type UserPublic = { id: string; email: string; firstName: string; lastName: string };

type UserLean = {
  _id: mongoose.Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
};

function serializeUser(u: UserLean): UserPublic {
  return {
    id: u._id.toString(),
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
  };
}

/** Escape regex special chars for safe email search. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** GET /search?email= — find registered users by email substring (min 2 chars). */
router.get("/search", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const q = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
  if (q.length < 2) {
    return res.status(400).json({ error: "Query \"email\" must be at least 2 characters." });
  }

  try {
    const me = new mongoose.Types.ObjectId(req.userId);
    const re = new RegExp(escapeRegex(q), "i");
    const users = await User.find({
      _id: { $ne: me },
      email: re,
    })
      .select("_id email firstName lastName")
      .limit(12)
      .lean<UserLean[]>();

    return res.json({ users: users.map((u) => serializeUser(u)) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Search failed." });
  }
});

async function findAcceptedPair(
  a: mongoose.Types.ObjectId,
  b: mongoose.Types.ObjectId,
): Promise<FriendInviteLean | null> {
  return FriendInvite.findOne({
    status: "accepted",
    $or: [
      { fromUserId: a, toUserId: b },
      { fromUserId: b, toUserId: a },
    ],
  }).lean<FriendInviteLean | null>();
}

/** POST /invites — body: { toUserId } or { toEmail } */
router.post("/invites", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const toUserIdRaw = typeof req.body?.toUserId === "string" ? req.body.toUserId.trim() : "";
  const toEmailRaw = typeof req.body?.toEmail === "string" ? req.body.toEmail.trim().toLowerCase() : "";

  let toUser: UserLean | null = null;
  if (toUserIdRaw && mongoose.Types.ObjectId.isValid(toUserIdRaw)) {
    toUser = await User.findById(toUserIdRaw).select("_id email firstName lastName").lean<UserLean | null>();
  } else if (toEmailRaw) {
    toUser = await User.findOne({ email: toEmailRaw }).select("_id email firstName lastName").lean<UserLean | null>();
  } else {
    return res.status(400).json({ error: "Provide toUserId or toEmail." });
  }

  if (!toUser) {
    return res.status(404).json({ error: "No user found with that email or id." });
  }

  const fromId = new mongoose.Types.ObjectId(req.userId);
  const toId = toUser._id as mongoose.Types.ObjectId;

  if (toId.equals(fromId)) {
    return res.status(400).json({ error: "You cannot invite yourself." });
  }

  try {
    const already = await findAcceptedPair(fromId, toId);
    if (already) {
      return res.status(409).json({ error: "You are already friends with this person." });
    }

    const pendingOut = await FriendInvite.findOne({
      fromUserId: fromId,
      toUserId: toId,
      status: "pending",
    }).lean<FriendInviteLean | null>();
    if (pendingOut) {
      return res.status(409).json({ error: "You already sent an invite to this person." });
    }

    const pendingIn = await FriendInvite.findOne({
      fromUserId: toId,
      toUserId: fromId,
      status: "pending",
    }).lean<FriendInviteLean | null>();
    if (pendingIn) {
      return res.status(409).json({
        error: "This person already invited you. Accept their invite from Incoming instead.",
        inverseInviteId: pendingIn._id.toString(),
      });
    }

    const created = await FriendInvite.create({
      fromUserId: fromId,
      toUserId: toId,
      status: "pending",
    });

    const lean = created.toObject() as FriendInviteLean;
    return res.status(201).json({
      invite: {
        id: lean._id.toString(),
        status: lean.status,
        to: serializeUser(toUser),
        createdAt: lean.createdAt,
      },
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: number }).code === 11000) {
      return res.status(409).json({ error: "An invite already exists for this pair." });
    }
    console.error(e);
    return res.status(500).json({ error: "Could not send invite." });
  }
});

function serializeInvitePending(inv: FriendInviteLean, other: UserLean) {
  return {
    id: inv._id.toString(),
    status: inv.status,
    user: serializeUser(other),
    createdAt: inv.createdAt,
  };
}

router.get("/invites/incoming", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId);
    const list = await FriendInvite.find({ toUserId: uid, status: "pending" })
      .sort({ createdAt: -1 })
      .lean<FriendInviteLean[]>();

    const fromIds = list.map((i) => i.fromUserId);
    const fromUsers = await User.find({ _id: { $in: fromIds } })
      .select("_id email firstName lastName")
      .lean<UserLean[]>();
    const byId = new Map(fromUsers.map((u) => [u._id.toString(), u]));

    const invites = list
      .map((inv) => {
        const u = byId.get(inv.fromUserId.toString());
        if (!u) return null;
        return serializeInvitePending(inv, u);
      })
      .filter(Boolean);

    return res.json({ invites });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not list incoming invites." });
  }
});

router.get("/invites/outgoing", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId);
    const list = await FriendInvite.find({ fromUserId: uid, status: "pending" })
      .sort({ createdAt: -1 })
      .lean<FriendInviteLean[]>();

    const toIds = list.map((i) => i.toUserId);
    const toUsers = await User.find({ _id: { $in: toIds } })
      .select("_id email firstName lastName")
      .lean<UserLean[]>();
    const byId = new Map(toUsers.map((u) => [u._id.toString(), u]));

    const invites = list
      .map((inv) => {
        const u = byId.get(inv.toUserId.toString());
        if (!u) return null;
        return serializeInvitePending(inv, u);
      })
      .filter(Boolean);

    return res.json({ invites });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not list outgoing invites." });
  }
});

router.post("/invites/:id/accept", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid invite id." });
  }

  try {
    const uid = new mongoose.Types.ObjectId(req.userId);
    const inv = await FriendInvite.findOne({
      _id: id,
      toUserId: uid,
      status: "pending",
    });

    if (!inv) {
      return res.status(404).json({ error: "Invite not found or already handled." });
    }

    inv.status = "accepted";
    await inv.save();

    const other = await User.findById(inv.fromUserId).select("_id email firstName lastName").lean<UserLean | null>();
    if (!other) {
      return res.status(500).json({ error: "Inviter account missing." });
    }

    return res.json({
      invite: {
        id: inv._id.toString(),
        status: "accepted",
        friend: serializeUser(other),
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not accept invite." });
  }
});

router.post("/invites/:id/decline", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid invite id." });
  }

  try {
    const uid = new mongoose.Types.ObjectId(req.userId);
    const r = await FriendInvite.findOneAndDelete({
      _id: id,
      toUserId: uid,
      status: "pending",
    });
    if (!r) {
      return res.status(404).json({ error: "Invite not found or already handled." });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not decline invite." });
  }
});

router.delete("/invites/:id", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid invite id." });
  }

  try {
    const uid = new mongoose.Types.ObjectId(req.userId);
    const r = await FriendInvite.findOneAndDelete({
      _id: id,
      fromUserId: uid,
      status: "pending",
    });
    if (!r) {
      return res.status(404).json({ error: "Outgoing invite not found or not pending." });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not cancel invite." });
  }
});

router.get("/", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId);
    const list = await FriendInvite.find({
      status: "accepted",
      $or: [{ fromUserId: uid }, { toUserId: uid }],
    })
      .sort({ updatedAt: -1 })
      .lean<FriendInviteLean[]>();

    const otherIds = list.map((inv) =>
      inv.fromUserId.equals(uid) ? inv.toUserId : inv.fromUserId,
    );
    const others = await User.find({ _id: { $in: otherIds } })
      .select("_id email firstName lastName")
      .lean<UserLean[]>();
    const byId = new Map(others.map((u) => [u._id.toString(), u]));

    const friends = list
      .map((inv) => {
        const oid = inv.fromUserId.equals(uid) ? inv.toUserId : inv.fromUserId;
        const u = byId.get(oid.toString());
        if (!u) return null;
        return {
          inviteId: inv._id.toString(),
          since: inv.updatedAt,
          user: serializeUser(u),
        };
      })
      .filter(Boolean);

    return res.json({ friends });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not list friends." });
  }
});

export default router;
