import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validate } from '../middleware/validate';
import { loginSchema } from '../schemas/auth';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  permissions: { type: [String], default: [] },
  unit: { type: String, enum: ['main', 'franchise', 'factory'], default: 'main' },
}, { toJSON: { virtuals: true, versionKey: false } });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email e senha obrigatorios' });

  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Email ou senha incorretos' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Email ou senha incorretos' });

  const userUnit = (user as any).unit || 'main';
  const xSystem = (req.headers['x-system'] as string) || 'main';

  // Admins can log in to any system; other users only to their own system
  if (!user.isAdmin && userUnit !== xSystem) {
    return res.status(403).json({ error: 'Acesso não permitido neste sistema' });
  }

  const token = jwt.sign(
    { userId: user._id.toString(), unit: userUnit, role: (user as any).role },
    process.env.JWT_SECRET || 'soul540-secret',
    { expiresIn: '7d' }
  );
  res.cookie('soul540_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, permissions: user.permissions, unit: userUnit } });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const token = (req as any).cookies?.soul540_token;
  if (!token) return res.status(401).json({ error: 'not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'soul540-secret') as any;
    const user = await UserModel.findById(payload.userId).select('-passwordHash').lean() as any;
    if (!user) return res.status(401).json({ error: 'user not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, permissions: user.permissions, unit: user.unit } });
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('soul540_token', { httpOnly: true, sameSite: 'strict' });
  res.json({ ok: true });
});

export default router;
