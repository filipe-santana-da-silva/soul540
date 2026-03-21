import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

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
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email e senha obrigatorios' });

  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Email ou senha incorretos' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Email ou senha incorretos' });

  const token = 'token-' + user._id + '-' + Date.now();
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, permissions: user.permissions, unit: (user as any).unit || 'main' } });
});

export default router;
