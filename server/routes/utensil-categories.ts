import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
}, { toJSON: { virtuals: true, versionKey: false } });

const Category = mongoose.models.UtensilCategory || mongoose.model('UtensilCategory', CategorySchema);

const router = Router();

router.get('/', async (_req, res) => {
  const cats = await Category.find().sort({ name: 1 });
  res.json(cats.map((c: { name: string }) => c.name));
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const cat = await Category.findOneAndUpdate(
    { name: name.trim() },
    { name: name.trim() },
    { upsert: true, new: true },
  );
  res.status(201).json(cat.name);
});

router.delete('/', async (req, res) => {
  const { name } = req.body;
  await Category.deleteOne({ name });
  res.status(204).end();
});

export default router;
