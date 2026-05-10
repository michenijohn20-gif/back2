import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { isValidKenyaPhone } from "../utils/phone.js";
import { optionalAuth } from "../middleware/auth.js";
import { sendMailSafe } from "../services/email.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, password, fullName, phone } = req.body || {};
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: "Full name, email, and password are required" });
  }
  if (phone && !isValidKenyaPhone(phone)) {
    return res.status(400).json({ error: "Enter a valid Kenyan phone number" });
  }
  const exists = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (exists) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await prisma.user.create({
    data: {
      email: String(email).toLowerCase(),
      passwordHash,
      fullName: String(fullName),
      phone: phone || null,
    },
    select: { id: true, email: true, fullName: true, phone: true },
  });
  const access = signAccessToken({ sub: user.id });
  const refresh = signRefreshToken({ sub: user.id });
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: await bcrypt.hash(refresh, 10) },
  });
  res.json({ user, accessToken: access, refreshToken: refresh });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user?.passwordHash) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const access = signAccessToken({ sub: user.id });
  const refresh = signRefreshToken({ sub: user.id });
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: await bcrypt.hash(refresh, 10) },
  });
  res.json({
    user: { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone },
    accessToken: access,
    refreshToken: refresh,
  });
});

router.post("/google", async (req, res) => {
  const { credential, googleId, email, fullName } = req.body || {};
  const clientId = process.env.GOOGLE_CLIENT_ID;
  let emailNorm;
  let sub;
  let name = fullName;

  if (credential && clientId) {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    sub = payload?.sub;
    emailNorm = payload?.email?.toLowerCase();
    name = payload?.name || name;
  } else if (googleId && email) {
    // Dev fallback when Google client id not configured (not for production)
    sub = String(googleId);
    emailNorm = String(email).toLowerCase();
  } else {
    return res.status(400).json({ error: "Google sign-in not configured or invalid payload" });
  }

  if (!emailNorm || !sub) return res.status(400).json({ error: "Invalid Google account" });

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: sub }, { email: emailNorm }] },
  });
  if (!user) {
    const randomPass = crypto.randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(randomPass, 10);
    user = await prisma.user.create({
      data: {
        email: emailNorm,
        googleId: sub,
        fullName: name || "Customer",
        passwordHash,
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: sub },
    });
  }

  const access = signAccessToken({ sub: user.id });
  const refresh = signRefreshToken({ sub: user.id });
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: await bcrypt.hash(refresh, 10) },
  });
  res.json({
    user: { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone },
    accessToken: access,
    refreshToken: refresh,
  });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: "Missing refresh token" });
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user?.refreshTokenHash) return res.status(401).json({ error: "Invalid session" });
    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) return res.status(401).json({ error: "Invalid session" });
    const access = signAccessToken({ sub: user.id });
    res.json({ accessToken: access });
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email required" });
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  // Always respond OK to avoid email enumeration
  if (user) {
    const token = crypto.randomBytes(24).toString("hex");
    const expiry = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });
    const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    await sendMailSafe({
      to: user.email,
      subject: "Reset your RefurbKE password",
      html: `<p>Hi ${user.fullName},</p><p><a href="${link}">Click here to reset your password</a>. This link expires in one hour.</p>`,
    });
  }
  res.json({ ok: true, message: "If that email exists, a reset link has been sent." });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: "Token and password required" });
  const user = await prisma.user.findFirst({
    where: { resetToken: String(token), resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });
  const passwordHash = await bcrypt.hash(String(password), 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null, refreshTokenHash: null },
  });
  res.json({ ok: true });
});

router.get("/me", optionalAuth, async (req, res) => {
  if (!req.userId) return res.json({ user: null });
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, fullName: true, phone: true, avatarUrl: true },
  });
  res.json({ user });
});

export default router;
