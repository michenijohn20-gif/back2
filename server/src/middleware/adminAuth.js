import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "dev-admin-secret";

export function adminAuth(req, res, next) {
  const h = req.headers.authorization;
  const token = h?.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Admin authentication required" });
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (decoded.role !== "admin") throw new Error("not admin");
    req.adminId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid admin session" });
  }
}

export function signAdminToken(adminId, email) {
  return jwt.sign({ sub: adminId, email, role: "admin" }, ADMIN_JWT_SECRET, { expiresIn: "12h" });
}
