import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';

const UtensilSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unitValue: Number,
  location: { type: String, default: '' },
  status: { type: String, default: 'disponivel' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true, versionKey: false } });

const Utensil = mongoose.models.Utensil || mongoose.model('Utensil', UtensilSchema);

const router = Router();

router.get('/', async (_req, res) => {
  const utensils = await Utensil.find().sort({ name: 1 });
  res.json(utensils);
});

router.post('/', async (req, res) => {
  const utensil = await Utensil.create(req.body);
  res.status(201).json(utensil);
});

router.put('/:id', async (req, res) => {
  const utensil = await Utensil.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!utensil) return res.status(404).json({ error: 'Not found' });
  res.json(utensil);
});

router.delete('/:id', async (req, res) => {
  await Utensil.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
