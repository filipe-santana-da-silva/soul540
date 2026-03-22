import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';

const ContractorSchema = new Schema({
  name: String,
  type: { type: String, default: 'pessoa_fisica' },
  document: { type: String, default: '' },
  documentType: String,
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: String,
  maritalStatus: String,
  profession: String,
  category: String,
  status: { type: String, default: 'ativo' },
  totalRevenue: { type: Number, default: 0 },
  source: { type: String, default: 'main' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'contractors', toJSON: { virtuals: true, versionKey: false } });

const FranchiseContractorSchema = new Schema({
  name: String,
  type: { type: String, default: 'pessoa_fisica' },
  document: { type: String, default: '' },
  documentType: String,
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: String,
  maritalStatus: String,
  profession: String,
  category: String,
  status: { type: String, default: 'ativo' },
  totalRevenue: { type: Number, default: 0 },
  source: { type: String, default: 'franchise' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'franchisecontractors', toJSON: { virtuals: true, versionKey: false } });

const Contractor = mongoose.models.Contractor || mongoose.model('Contractor', ContractorSchema);
const FranchiseContractor = mongoose.models.FranchiseContractor || mongoose.model('FranchiseContractor', FranchiseContractorSchema);

function isFromFranchise(req: any): boolean {
  return getTenantUnit(req) === 'franchise';
}

async function findInBothCollections(id: string) {
  const doc = await Contractor.findById(id);
  if (doc) return { doc, model: Contractor };
  const fdoc = await FranchiseContractor.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseContractor };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  const Model = isFromFranchise(req) ? FranchiseContractor : Contractor;
  const items = await Model.find({});
  res.json(items);
});

router.post('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const contractor = await FranchiseContractor.create({ ...req.body, source: 'franchise' });
    return res.status(201).json(contractor);
  }
  const contractor = await Contractor.create({ ...req.body, source: 'main' });
  res.status(201).json(contractor);
});

router.put('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const contractor = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(contractor);
});

router.delete('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  await found.model.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
