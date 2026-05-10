import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../prisma.js";

export async function optionalAuth(req, res, next) {
  const h = req.headers.authorization;
  const token = h?.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.sub;
    req.user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, fullName: true, phone: true },
    });
  } catch {
    req.userId = undefined;
    req.user = undefined;
  }
  next();
}

export function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  const token = h?.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
