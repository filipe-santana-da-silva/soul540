import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from './auth';

const router = Router();

// GET /api/users
router.get('/', async (_req, res) => {
  const users = await UserModel.find().select('-passwordHash');
  res.json(users);
});

// POST /api/users
router.post('/', async (req, res) => {
  const { name, email, password, isAdmin, permissions } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'name, email e password obrigatorios' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash, isAdmin: !!isAdmin, permissions: permissions || [] });
  const { passwordHash: _, ...safe } = user.toJSON();
  res.status(201).json(safe);
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { name, isAdmin, permissions, password } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (isAdmin !== undefined) update.isAdmin = isAdmin;
  if (permissions !== undefined) update.permissions = permissions;
  if (password) update.passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  await UserModel.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
