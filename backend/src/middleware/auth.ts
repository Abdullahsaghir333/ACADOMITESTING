import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/** Read at request time — `.env` is loaded in `index.ts` after imports, so module-level `process.env` would be stale. */
function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET not set");
  return s;
}

export type AuthedRequest = Request & {
  userId?: string;
};

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  let secret: string;
  try {
    secret = jwtSecret();
  } catch {
    return res.status(500).json({ error: "Server missing JWT_SECRET" });
  }
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, secret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, jwtSecret(), { expiresIn: "14d" });
}
