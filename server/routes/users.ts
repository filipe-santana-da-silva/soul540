import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from './auth';
import { getTenantUnit } from '../middleware/tenant';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../schemas/users';

const router = Router();

// GET /api/users
router.get('/', async (req, res) => {
  const unit = getTenantUnit(req);
  const query = (unit && unit !== 'main') ? { unit } : {};
  const users = await UserModel.find(query).select('-passwordHash');
  res.json(users);
});

// POST /api/users
router.post('/', validate(createUserSchema), async (req, res) => {
  const { name, email, password, isAdmin, permissions, unit: bodyUnit } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ name, email: email.toLowerCase().trim(), passwordHash, isAdmin, permissions, unit: bodyUnit || getTenantUnit(req) });
  const { passwordHash: _, ...safe } = user.toJSON();
  res.status(201).json(safe);
});

// PUT /api/users/:id
router.put('/:id', validate(updateUserSchema), async (req, res) => {
  const user = await UserModel.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'not found' });
  if ((req as any).user?.role !== 'admin' && user.unit !== getTenantUnit(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const { name, isAdmin, permissions, password } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (isAdmin !== undefined) update.isAdmin = isAdmin;
  if (permissions !== undefined) update.permissions = permissions;
  if (password) {
    update.passwordHash = await bcrypt.hash(password, 10);
  }
  const updated = await UserModel.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
  res.json(updated);
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const user = await UserModel.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'not found' });
  if ((req as any).user?.role !== 'admin' && user.unit !== getTenantUnit(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  await UserModel.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
