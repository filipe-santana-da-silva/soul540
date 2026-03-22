import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';

const InvoiceItemSchema = new Schema({
  description: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
}, { _id: false });

const InvoiceSchema = new Schema({
  eventId: { type: String, default: '' },
  clientName: { type: String, default: '' },
  clientDocument: { type: String, default: '' },
  clientEmail: { type: String, default: '' },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  issueDate: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, default: 'rascunho' },
  source: { type: String, default: 'main' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'invoices', toJSON: { virtuals: true, versionKey: false } });

const FranchiseInvoiceSchema = new Schema({
  eventId: { type: String, default: '' },
  clientName: { type: String, default: '' },
  clientDocument: { type: String, default: '' },
  clientEmail: { type: String, default: '' },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  issueDate: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, default: 'rascunho' },
  source: { type: String, default: 'franchise' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'franchiseinvoices', toJSON: { virtuals: true, versionKey: false } });

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
const FranchiseInvoice = mongoose.models.FranchiseInvoice || mongoose.model('FranchiseInvoice', FranchiseInvoiceSchema);

function isFromFranchise(req: any): boolean {
  return getTenantUnit(req) === 'franchise';
}

async function findInBothCollections(id: string) {
  const doc = await Invoice.findById(id);
  if (doc) return { doc, model: Invoice };
  const fdoc = await FranchiseInvoice.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseInvoice };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const invoices = await FranchiseInvoice.find({}).sort({ createdAt: -1 });
    return res.json(invoices);
  }
  const [main, franchise] = await Promise.all([
    Invoice.find({}).sort({ createdAt: -1 }),
    FranchiseInvoice.find({}).sort({ createdAt: -1 }),
  ]);
  const merged = [...main, ...franchise].sort((a, b) =>
    (a.createdAt ?? '') < (b.createdAt ?? '') ? 1 : -1,
  );
  res.json(merged);
});

router.post('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const invoice = await FranchiseInvoice.create({ ...req.body, source: 'franchise' });
    return res.status(201).json(invoice);
  }
  const invoice = await Invoice.create({ ...req.body, source: 'main' });
  res.status(201).json(invoice);
});

router.put('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const invoice = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(invoice);
});

router.delete('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  await found.model.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
