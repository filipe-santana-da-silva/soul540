import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';

const UtensilSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unitValue: Number,
  location: { type: String, default: '' },
  status: { type: String, default: 'disponivel' },
  source: { type: String, default: 'main' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'utensils', toJSON: { virtuals: true, versionKey: false } });

const FranchiseUtensilSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unitValue: Number,
  location: { type: String, default: '' },
  status: { type: String, default: 'disponivel' },
  source: { type: String, default: 'franchise' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'franchiseutensils', toJSON: { virtuals: true, versionKey: false } });

const Utensil = mongoose.models.Utensil || mongoose.model('Utensil', UtensilSchema);
const FranchiseUtensil = mongoose.models.FranchiseUtensil || mongoose.model('FranchiseUtensil', FranchiseUtensilSchema);

function isFromFranchise(req: any): boolean {
  return getTenantUnit(req) === 'franchise';
}

async function findInBothCollections(id: string) {
  const doc = await Utensil.findById(id);
  if (doc) return { doc, model: Utensil };
  const fdoc = await FranchiseUtensil.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseUtensil };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const utensils = await FranchiseUtensil.find({}).sort({ name: 1 });
    return res.json(utensils);
  }
  const [main, franchise] = await Promise.all([
    Utensil.find({}).sort({ name: 1 }),
    FranchiseUtensil.find({}).sort({ name: 1 }),
  ]);
  const merged = [...main, ...franchise].sort((a, b) => {
    const na = a.name ?? '';
    const nb = b.name ?? '';
    return na < nb ? -1 : na > nb ? 1 : 0;
  });
  res.json(merged);
});

router.post('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const utensil = await FranchiseUtensil.create({ ...req.body, source: 'franchise' });
    return res.status(201).json(utensil);
  }
  const utensil = await Utensil.create({ ...req.body, source: 'main' });
  res.status(201).json(utensil);
});

router.put('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const utensil = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(utensil);
});

router.delete('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  await found.model.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
