import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';

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
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true, versionKey: false } });

const Contractor = mongoose.models.Contractor || mongoose.model('Contractor', ContractorSchema);

const router = Router();

router.get('/', async (_req, res) => {
  const contractors = await Contractor.find().sort({ name: 1 });
  res.json(contractors);
});

router.post('/', async (req, res) => {
  const contractor = await Contractor.create(req.body);
  res.status(201).json(contractor);
});

router.put('/:id', async (req, res) => {
  const contractor = await Contractor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!contractor) return res.status(404).json({ error: 'Not found' });
  res.json(contractor);
});

router.delete('/:id', async (req, res) => {
  await Contractor.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
