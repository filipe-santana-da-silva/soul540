import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { Finance, FranchiseFinance, FactoryFinance } from './finances';
import { getTenantUnit } from '../middleware/tenant';
import { logAudit } from '../utils/audit';

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
  celebration: String,
  teamArrivalTime: String,
  city: String,
  guestsAdult: Number,
  guestsTeen: Number,
  guestsChild: Number,
  travelCost: Number,
  teamPizzaiolo: String,
  teamHelper: String,
  teamGarcon: String,
  extrasLoucas: Number,
  extrasBebidas: Number,
  finalValue: Number,
  paymentMethod: String,
  locationImageName: String,
  locationImageData: String,
  paymentProofData: String,
  contractPdfData: String,
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
  celebration: String,
  teamArrivalTime: String,
  city: String,
  guestsAdult: Number,
  guestsTeen: Number,
  guestsChild: Number,
  travelCost: Number,
  teamPizzaiolo: String,
  teamHelper: String,
  teamGarcon: String,
  extrasLoucas: Number,
  extrasBebidas: Number,
  finalValue: Number,
  paymentMethod: String,
  locationImageName: String,
  locationImageData: String,
  paymentProofData: String,
  contractPdfData: String,
}, { collection: 'franchiseevents', toJSON: { virtuals: true, versionKey: false } });

const FactoryEventSchema = new Schema({
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
  source: { type: String, default: 'factory' },
  celebration: String,
  teamArrivalTime: String,
  city: String,
  guestsAdult: Number,
  guestsTeen: Number,
  guestsChild: Number,
  travelCost: Number,
  teamPizzaiolo: String,
  teamHelper: String,
  teamGarcon: String,
  extrasLoucas: Number,
  extrasBebidas: Number,
  finalValue: Number,
  paymentMethod: String,
  locationImageName: String,
  locationImageData: String,
  paymentProofData: String,
  contractPdfData: String,
}, { collection: 'factoryevents', toJSON: { virtuals: true, versionKey: false } });

EventSchema.index({ date: -1 });
EventSchema.index({ status: 1, date: -1 });
FranchiseEventSchema.index({ date: -1 });
FranchiseEventSchema.index({ status: 1, date: -1 });
FactoryEventSchema.index({ date: -1 });
FactoryEventSchema.index({ status: 1, date: -1 });

export const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
export const FranchiseEvent = mongoose.models.FranchiseEvent || mongoose.model('FranchiseEvent', FranchiseEventSchema);
export const FactoryEvent = mongoose.models.FactoryEvent || mongoose.model('FactoryEvent', FactoryEventSchema);

function isFromFranchise(req: any): boolean {
  return getTenantUnit(req) === 'franchise';
}

function isFromFactory(req: any): boolean {
  return getTenantUnit(req) === 'factory';
}

async function findEventInAllCollections(id: string) {
  const doc = await Event.findById(id);
  if (doc) return { doc, model: Event, financeModel: Finance, financeSource: 'main' };
  const fdoc = await FranchiseEvent.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseEvent, financeModel: FranchiseFinance, financeSource: 'franchise' };
  const factDoc = await FactoryEvent.findById(id);
  if (factDoc) return { doc: factDoc, model: FactoryEvent, financeModel: FactoryFinance, financeSource: 'factory' };
  return null;
}

const router = Router();

const SLIM = '-locationImageData -paymentProofData -contractPdfData';

// Lightweight count endpoint — used by portal cards
router.get('/count', async (req, res) => {
  if (isFromFactory(req)) {
    const count = await FactoryEvent.countDocuments({});
    return res.json({ count });
  }
  if (isFromFranchise(req)) {
    const count = await FranchiseEvent.countDocuments({});
    return res.json({ count });
  }
  const count = await Event.countDocuments({});
  res.json({ count });
});

router.get('/', async (req, res) => {
  if (isFromFactory(req)) {
    const [mainClosed, franchiseClosed, factoryEvents] = await Promise.all([
      Event.find({ status: { $ne: 'planning' } }).select(SLIM).sort({ date: -1 }),
      FranchiseEvent.find({ status: { $ne: 'planning' } }).select(SLIM).sort({ date: -1 }),
      FactoryEvent.find({}).select(SLIM).sort({ date: -1 }),
    ]);
    const merged = [...mainClosed, ...franchiseClosed, ...factoryEvents]
      .sort((a, b) => (a.date > b.date ? -1 : 1));
    return res.json(merged);
  }
  if (isFromFranchise(req)) {
    const events = await FranchiseEvent.find({}).select(SLIM).sort({ date: 1 });
    return res.json(events);
  }
  const [main, franchise] = await Promise.all([
    Event.find({}).select(SLIM).sort({ date: 1 }),
    FranchiseEvent.find({}).select(SLIM).sort({ date: 1 }),
  ]);
  const merged = [...main, ...franchise].sort((a, b) => (a.date > b.date ? 1 : -1));
  res.json(merged);
});

router.post('/', async (req, res) => {
  if (isFromFactory(req)) {
    const event = await FactoryEvent.create({ ...req.body, source: 'factory' });
    if (event.budget && event.budget > 0) {
      await FactoryFinance.create({
        eventId: event.id,
        type: 'revenue',
        category: 'contrato',
        description: `Contrato - ${event.name}`,
        amount: event.budget,
        date: event.date,
        status: 'pending',
        autoEventBudget: true,
        source: 'factory',
      });
    }
    await logAudit({ req, action: 'create', resource: 'events', resourceId: event.id, description: `Criou evento: ${event.name} (${event.date})` });
    return res.status(201).json(event);
  }
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
    await logAudit({ req, action: 'create', resource: 'events', resourceId: event.id, description: `Criou evento: ${event.name} (${event.date})` });
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
  await logAudit({ req, action: 'create', resource: 'events', resourceId: event.id, description: `Criou evento: ${event.name} (${event.date})` });
  res.status(201).json(event);
});

router.put('/:id', async (req, res) => {
  const found = await findEventInAllCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const event = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!event) return res.status(404).json({ error: 'Not found' });
  const FinanceModel = found.financeModel;
  const financeSource = found.financeSource;
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
  await logAudit({ req, action: 'update', resource: 'events', resourceId: req.params.id, description: `Atualizou evento: ${event.name}` });
  res.json(event);
});

router.delete('/:id', async (req, res) => {
  const found = await findEventInAllCollections(req.params.id);
  if (!found) return res.status(204).end();
  const eventName = found.doc?.name || req.params.id;
  await found.model.findByIdAndDelete(req.params.id);
  await found.financeModel.deleteMany({ eventId: req.params.id, autoEventBudget: true });
  await logAudit({ req, action: 'delete', resource: 'events', resourceId: req.params.id, description: `Excluiu evento: ${eventName}` });
  res.status(204).end();
});

export default router;
