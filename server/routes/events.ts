import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { Finance, FranchiseFinance } from './finances';
import { getTenantUnit } from '../middleware/tenant';

const EventSchema = new Schema({
  name: String,
  date: String,
  endDate: String,
  time: String,
  duration: String,
  location: String,
  outOfCity: Boolean,
  phone: String,
  guestCount: { type: Number, default: 0 },
  status: { type: String, default: 'planning' },
  budget: { type: Number, default: 0 },
  menu: [String],
  notes: { type: String, default: '' },
  responsibleEmployeeId: String,
  staffCount: Number,
  selectedEmployeeIds: [String],
  paymentProofName: String,
  contractPdfName: String,
  createdBy: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  source: { type: String, default: 'main' },
}, { collection: 'events', toJSON: { virtuals: true, versionKey: false } });

const FranchiseEventSchema = new Schema({
  name: String,
  date: String,
  endDate: String,
  time: String,
  duration: String,
  location: String,
  outOfCity: Boolean,
  phone: String,
  guestCount: { type: Number, default: 0 },
  status: { type: String, default: 'planning' },
  budget: { type: Number, default: 0 },
  menu: [String],
  notes: { type: String, default: '' },
  responsibleEmployeeId: String,
  staffCount: Number,
  selectedEmployeeIds: [String],
  paymentProofName: String,
  contractPdfName: String,
  createdBy: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  source: { type: String, default: 'franchise' },
}, { collection: 'franchiseevents', toJSON: { virtuals: true, versionKey: false } });

const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const FranchiseEvent = mongoose.models.FranchiseEvent || mongoose.model('FranchiseEvent', FranchiseEventSchema);

function isFromFranchise(req: any): boolean {
  return getTenantUnit(req) === 'franchise';
}

async function findEventInBothCollections(id: string) {
  const doc = await Event.findById(id);
  if (doc) return { doc, model: Event, isfranchise: false };
  const fdoc = await FranchiseEvent.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseEvent, isfranchise: true };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const events = await FranchiseEvent.find({}).sort({ date: 1 });
    return res.json(events);
  }
  const [main, franchise] = await Promise.all([
    Event.find({}).sort({ date: 1 }),
    FranchiseEvent.find({}).sort({ date: 1 }),
  ]);
  const merged = [...main, ...franchise].sort((a, b) => (a.date > b.date ? 1 : -1));
  res.json(merged);
});

router.post('/', async (req, res) => {
  const xSystem = (req.headers['x-system'] as string) || '';
  const userUnit = (req as any).user?.unit;
  const isFactory = xSystem === 'factory' || (!xSystem && userUnit === 'factory');
  if (isFactory) return res.status(403).json({ error: 'Forbidden' });
  if (isFromFranchise(req)) {
    const event = await FranchiseEvent.create({ ...req.body, source: 'franchise' });
    if (event.budget && event.budget > 0) {
      await FranchiseFinance.create({
        eventId: event.id,
        type: 'revenue',
        category: 'contrato',
        description: `Contrato - ${event.name}`,
        amount: event.budget,
        date: event.date,
        status: 'pending',
        autoEventBudget: true,
        source: 'franchise',
      });
    }
    return res.status(201).json(event);
  }
  const event = await Event.create({ ...req.body, source: 'main' });
  if (event.budget && event.budget > 0) {
    await Finance.create({
      eventId: event.id,
      type: 'revenue',
      category: 'contrato',
      description: `Contrato - ${event.name}`,
      amount: event.budget,
      date: event.date,
      status: 'pending',
      autoEventBudget: true,
      source: 'main',
    });
  }
  res.status(201).json(event);
});

router.put('/:id', async (req, res) => {
  const xSystem = (req.headers['x-system'] as string) || '';
  const userUnit = (req as any).user?.unit;
  const isFactory = xSystem === 'factory' || (!xSystem && userUnit === 'factory');
  if (isFactory) return res.status(403).json({ error: 'Forbidden' });
  const found = await findEventInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const event = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!event) return res.status(404).json({ error: 'Not found' });
  const FinanceModel = found.isfranchise ? FranchiseFinance : Finance;
  const financeSource = found.isfranchise ? 'franchise' : 'main';
  const existing = await FinanceModel.findOne({ eventId: event.id, autoEventBudget: true });
  if (event.budget && event.budget > 0) {
    if (existing) {
      await FinanceModel.findByIdAndUpdate(existing._id, {
        amount: event.budget,
        description: `Contrato - ${event.name}`,
        date: event.date,
      });
    } else {
      await FinanceModel.create({
        eventId: event.id,
        type: 'revenue',
        category: 'contrato',
        description: `Contrato - ${event.name}`,
        amount: event.budget,
        date: event.date,
        status: 'pending',
        autoEventBudget: true,
        source: financeSource,
      });
    }
  } else if (existing) {
    await FinanceModel.findByIdAndDelete(existing._id);
  }
  res.json(event);
});

router.delete('/:id', async (req, res) => {
  const xSystem = (req.headers['x-system'] as string) || '';
  const userUnit = (req as any).user?.unit;
  const isFactory = xSystem === 'factory' || (!xSystem && userUnit === 'factory');
  if (isFactory) return res.status(403).json({ error: 'Forbidden' });
  const found = await findEventInBothCollections(req.params.id);
  if (!found) return res.status(204).end();
  await found.model.findByIdAndDelete(req.params.id);
  const FinanceModel = found.isfranchise ? FranchiseFinance : Finance;
  await FinanceModel.deleteMany({ eventId: req.params.id, autoEventBudget: true });
  res.status(204).end();
});

export default router;
