import { Router } from 'express';
import mongoose from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';

const FinanceSchema = new mongoose.Schema(
  {
    eventId: { type: String, default: '' },
    type: { type: String, enum: ['revenue', 'cost'], required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ['pending', 'paid', 'received'], default: 'pending' },
    autoEventBudget: { type: Boolean, default: false },
    source: { type: String, default: 'main' },
  },
  { collection: 'finances', toJSON: { virtuals: true, versionKey: false }, id: true },
);

const FranchiseFinanceSchema = new mongoose.Schema(
  {
    eventId: { type: String, default: '' },
    type: { type: String, enum: ['revenue', 'cost'], required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ['pending', 'paid', 'received'], default: 'pending' },
    autoEventBudget: { type: Boolean, default: false },
    source: { type: String, default: 'franchise' },
  },
  { collection: 'franchisefinances', toJSON: { virtuals: true, versionKey: false }, id: true },
);

export const Finance = mongoose.models.Finance || mongoose.model('Finance', FinanceSchema);
export const FranchiseFinance = mongoose.models.FranchiseFinance || mongoose.model('FranchiseFinance', FranchiseFinanceSchema);

function isFromFranchise(req: any): boolean {
  return getTenantUnit(req) === 'franchise';
}

async function findFinanceInBothCollections(id: string) {
  const doc = await Finance.findById(id);
  if (doc) return { doc, model: Finance };
  const fdoc = await FranchiseFinance.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseFinance };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const finances = await FranchiseFinance.find({}).sort({ date: -1 });
    return res.json(finances);
  }
  const [main, franchise] = await Promise.all([
    Finance.find({}).sort({ date: -1 }),
    FranchiseFinance.find({}).sort({ date: -1 }),
  ]);
  const merged = [...main, ...franchise].sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json(merged);
});

router.post('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const finance = await FranchiseFinance.create({ ...req.body, source: 'franchise' });
    return res.status(201).json(finance);
  }
  const finance = await Finance.create({ ...req.body, source: 'main' });
  res.status(201).json(finance);
});

router.put('/:id', async (req, res) => {
  const found = await findFinanceInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const finance = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(finance);
});

router.delete('/:id', async (req, res) => {
  const found = await findFinanceInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  await found.model.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
