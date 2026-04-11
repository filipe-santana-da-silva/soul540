import { Router } from 'express';
import mongoose from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';
import { validate } from '../middleware/validate';
import { createFinanceSchema, updateFinanceSchema } from '../schemas/finances';
import { logAudit } from '../utils/audit';

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

const FactoryFinanceSchema = new mongoose.Schema(
  {
    eventId: { type: String, default: '' },
    type: { type: String, enum: ['revenue', 'cost'], required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ['pending', 'paid', 'received'], default: 'pending' },
    autoEventBudget: { type: Boolean, default: false },
    source: { type: String, default: 'factory' },
  },
  { collection: 'factoryfinances', toJSON: { virtuals: true, versionKey: false }, id: true },
);

FinanceSchema.index({ source: 1, date: -1 });
FinanceSchema.index({ eventId: 1 });
FranchiseFinanceSchema.index({ source: 1, date: -1 });
FranchiseFinanceSchema.index({ eventId: 1 });
FactoryFinanceSchema.index({ source: 1, date: -1 });
FactoryFinanceSchema.index({ eventId: 1 });

export const Finance = mongoose.models.Finance || mongoose.model('Finance', FinanceSchema);
export const FranchiseFinance = mongoose.models.FranchiseFinance || mongoose.model('FranchiseFinance', FranchiseFinanceSchema);
export const FactoryFinance = mongoose.models.FactoryFinance || mongoose.model('FactoryFinance', FactoryFinanceSchema);

function isFromFranchise(req: any): boolean { return getTenantUnit(req) === 'franchise'; }
function isFromFactory(req: any): boolean { return getTenantUnit(req) === 'factory'; }

async function findFinanceInBothCollections(id: string) {
  const doc = await Finance.findById(id);
  if (doc) return { doc, model: Finance };
  const fdoc = await FranchiseFinance.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseFinance };
  const factDoc = await FactoryFinance.findById(id);
  if (factDoc) return { doc: factDoc, model: FactoryFinance };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  if (isFromFactory(req)) {
    const items = await FactoryFinance.find({ source: 'factory' });
    return res.json(items);
  }
  if (isFromFranchise(req)) {
    const items = await FranchiseFinance.find({ source: 'franchise' });
    return res.json(items);
  }
  const items = await Finance.find({ source: 'main' });
  res.json(items);
});

router.post('/', validate(createFinanceSchema), async (req, res) => {
  if (isFromFactory(req)) {
    const finance = await FactoryFinance.create({ ...req.body, source: 'factory' });
    await logAudit({ req, action: 'create', resource: 'finances', resourceId: finance.id, description: `Criou lançamento: ${finance.description} (R$ ${finance.amount})` });
    return res.status(201).json(finance);
  }
  if (isFromFranchise(req)) {
    const finance = await FranchiseFinance.create({ ...req.body, source: 'franchise' });
    await logAudit({ req, action: 'create', resource: 'finances', resourceId: finance.id, description: `Criou lançamento: ${finance.description} (R$ ${finance.amount})` });
    return res.status(201).json(finance);
  }
  const finance = await Finance.create({ ...req.body, source: 'main' });
  await logAudit({ req, action: 'create', resource: 'finances', resourceId: finance.id, description: `Criou lançamento: ${finance.description} (R$ ${finance.amount})` });
  res.status(201).json(finance);
});

const STATUS_LABELS: Record<string, string> = { pending: 'Pendente', paid: 'Pago', received: 'Recebido' };

router.put('/:id', validate(updateFinanceSchema), async (req, res) => {
  const found = await findFinanceInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const oldDoc = found.doc;
  const finance = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  // Detect status-only change to produce a specific audit message
  const changedKeys = Object.keys(req.body);
  let desc: string;
  if (changedKeys.length === 1 && changedKeys[0] === 'status') {
    const from = STATUS_LABELS[(oldDoc as any).status] || (oldDoc as any).status;
    const to   = STATUS_LABELS[req.body.status] || req.body.status;
    desc = `Alterou status de "${from}" para "${to}": ${finance?.description}`;
  } else {
    desc = `Atualizou lançamento: ${finance?.description} (R$ ${finance?.amount})`;
  }
  await logAudit({ req, action: 'update', resource: 'finances', resourceId: req.params.id, description: desc });
  res.json(finance);
});

router.delete('/:id', async (req, res) => {
  const found = await findFinanceInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const finance = found.doc;
  await found.model.findByIdAndDelete(req.params.id);
  await logAudit({ req, action: 'delete', resource: 'finances', resourceId: req.params.id, description: `Excluiu lançamento: ${finance?.description}` });
  res.status(204).end();
});

export default router;
