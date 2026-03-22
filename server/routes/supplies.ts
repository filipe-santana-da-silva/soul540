import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';

const SupplySchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, default: '' },
  measureUnit: { type: String, default: 'kg' },
  quantity: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  costPerUnit: { type: Number, default: 0 },
  supplier: { type: String, default: '' },
  expirationDate: String,
  status: { type: String, default: 'em_estoque' },
  source: { type: String, default: 'main' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'supplies', toJSON: { virtuals: true, versionKey: false } });

const FranchiseSupplySchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, default: '' },
  measureUnit: { type: String, default: 'kg' },
  quantity: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  costPerUnit: { type: Number, default: 0 },
  supplier: { type: String, default: '' },
  expirationDate: String,
  status: { type: String, default: 'em_estoque' },
  source: { type: String, default: 'franchise' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'franchisesupplies', toJSON: { virtuals: true, versionKey: false } });

const Supply = mongoose.models.Supply || mongoose.model('Supply', SupplySchema);
const FranchiseSupply = mongoose.models.FranchiseSupply || mongoose.model('FranchiseSupply', FranchiseSupplySchema);

function isFromFranchise(req: any): boolean {
  return getTenantUnit(req) === 'franchise';
}

async function findInBothCollections(id: string) {
  const doc = await Supply.findById(id);
  if (doc) return { doc, model: Supply };
  const fdoc = await FranchiseSupply.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseSupply };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const supplies = await FranchiseSupply.find({}).sort({ name: 1 });
    return res.json(supplies);
  }
  const [main, franchise] = await Promise.all([
    Supply.find({}).sort({ name: 1 }),
    FranchiseSupply.find({}).sort({ name: 1 }),
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
    const supply = await FranchiseSupply.create({ ...req.body, source: 'franchise' });
    return res.status(201).json(supply);
  }
  const supply = await Supply.create({ ...req.body, source: 'main' });
  res.status(201).json(supply);
});

router.put('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const supply = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(supply);
});

router.delete('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  await found.model.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
