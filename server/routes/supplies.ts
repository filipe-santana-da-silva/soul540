import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';

const SupplySchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, default: '' },
  unit: { type: String, default: 'kg' },
  quantity: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  costPerUnit: { type: Number, default: 0 },
  supplier: { type: String, default: '' },
  expirationDate: String,
  status: { type: String, default: 'em_estoque' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true, versionKey: false } });

const Supply = mongoose.models.Supply || mongoose.model('Supply', SupplySchema);

const router = Router();

router.get('/', async (_req, res) => {
  const supplies = await Supply.find().sort({ name: 1 });
  res.json(supplies);
});

router.post('/', async (req, res) => {
  const supply = await Supply.create(req.body);
  res.status(201).json(supply);
});

router.put('/:id', async (req, res) => {
  const supply = await Supply.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!supply) return res.status(404).json({ error: 'Not found' });
  res.json(supply);
});

router.delete('/:id', async (req, res) => {
  await Supply.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
