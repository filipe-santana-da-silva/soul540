import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';

const ContractSchema = new Schema({
  clientName: String,
  clientDocument: { type: String, default: '' },
  clientEmail: { type: String, default: '' },
  clientPhone: { type: String, default: '' },
  eventId: { type: String, default: '' },
  value: { type: Number, default: 0 },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  description: { type: String, default: '' },
  paymentConditions: { type: String, default: '' },
  terms: { type: String, default: '' },
  status: { type: String, default: 'rascunho' },
  source: { type: String, default: 'main' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'contracts', toJSON: { virtuals: true, versionKey: false } });

const FranchiseContractSchema = new Schema({
  clientName: String,
  clientDocument: { type: String, default: '' },
  clientEmail: { type: String, default: '' },
  clientPhone: { type: String, default: '' },
  eventId: { type: String, default: '' },
  value: { type: Number, default: 0 },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  description: { type: String, default: '' },
  paymentConditions: { type: String, default: '' },
  terms: { type: String, default: '' },
  status: { type: String, default: 'rascunho' },
  source: { type: String, default: 'franchise' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'franchisecontracts', toJSON: { virtuals: true, versionKey: false } });

const Contract = mongoose.models.Contract || mongoose.model('Contract', ContractSchema);
const FranchiseContract = mongoose.models.FranchiseContract || mongoose.model('FranchiseContract', FranchiseContractSchema);

function isFromFranchise(req: any): boolean {
  return getTenantUnit(req) === 'franchise';
}

async function findInBothCollections(id: string) {
  const doc = await Contract.findById(id);
  if (doc) return { doc, model: Contract };
  const fdoc = await FranchiseContract.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseContract };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const contracts = await FranchiseContract.find({}).sort({ createdAt: -1 });
    return res.json(contracts);
  }
  const [main, franchise] = await Promise.all([
    Contract.find({}).sort({ createdAt: -1 }),
    FranchiseContract.find({}).sort({ createdAt: -1 }),
  ]);
  const merged = [...main, ...franchise].sort((a, b) =>
    (a.createdAt ?? '') < (b.createdAt ?? '') ? 1 : -1,
  );
  res.json(merged);
});

router.post('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const contract = await FranchiseContract.create({ ...req.body, source: 'franchise' });
    return res.status(201).json(contract);
  }
  const contract = await Contract.create({ ...req.body, source: 'main' });
  res.status(201).json(contract);
});

router.put('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const contract = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(contract);
});

router.delete('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  await found.model.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
