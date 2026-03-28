import { Router } from "express";
import bcrypt from "bcrypt";
import type { Response } from "express";
import { User } from "../models/User.js";
import { authMiddleware, type AuthedRequest, signToken } from "../middleware/auth.js";

const router = Router();
const SALT_ROUNDS = 10;

router.post("/register", async (req, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
    };
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "Email, password, first name, and last name are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    const token = signToken(user._id.toString());
    return res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Registration failed." });
  }
});

router.post("/login", async (req, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const hash = user.passwordHash;
    if (!hash || typeof hash !== "string") {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const token = signToken(user._id.toString());
    return res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Login failed." });
  }
});

router.get("/me", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    return res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not load profile." });
  }
});

router.patch("/profile", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const { firstName, lastName, currentPassword, newPassword } = req.body as {
      firstName?: string;
      lastName?: string;
      currentPassword?: string;
      newPassword?: string;
    };
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required to set a new password." });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters." });
      }
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: "Current password is incorrect." });
      }
      user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }

    await user.save();
    return res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not update profile." });
  }
});

export default router;
