import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { Finance } from './finances';
import { getTenantFilter, getTenantUnit } from '../middleware/tenant';

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
  unit: { type: String, default: 'main' },
}, { toJSON: { virtuals: true, versionKey: false } });

const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

function getEventReadFilter(req: any) {
  const unit = getTenantUnit(req);
  if (unit === 'franchise') return { unit: 'franchise' };
  // main and factory both see main + franchise events (null catches legacy docs with no unit field)
  return { unit: { $in: ['main', 'franchise', null] } };
}

const router = Router();

router.get('/', async (req, res) => {
  const events = await Event.find(getEventReadFilter(req)).sort({ date: 1 });
  res.json(events);
});

router.post('/', async (req, res) => {
  if ((req as any).user?.unit === 'factory') return res.status(403).json({ error: 'Forbidden' });
  const resolvedUnit = getTenantUnit(req);
  const bodyUnit = req.body.unit;
  const unit = (bodyUnit === 'franchise' || bodyUnit === 'factory') ? bodyUnit : resolvedUnit;
  const event = await Event.create({ ...req.body, unit });
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
      unit,
    });
  }
  res.status(201).json(event);
});

router.put('/:id', async (req, res) => {
  if ((req as any).user?.unit === 'factory') return res.status(403).json({ error: 'Forbidden' });
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!event) return res.status(404).json({ error: 'Not found' });
  const existing = await Finance.findOne({ eventId: event.id, autoEventBudget: true });
  if (event.budget && event.budget > 0) {
    if (existing) {
      await Finance.findByIdAndUpdate(existing._id, {
        amount: event.budget,
        description: `Contrato - ${event.name}`,
        date: event.date,
      });
    } else {
      await Finance.create({
        eventId: event.id,
        type: 'revenue',
        category: 'contrato',
        description: `Contrato - ${event.name}`,
        amount: event.budget,
        date: event.date,
        status: 'pending',
        autoEventBudget: true,
        unit: getTenantUnit(req),
      });
    }
  } else if (existing) {
    await Finance.findByIdAndDelete(existing._id);
  }
  res.json(event);
});

router.delete('/:id', async (req, res) => {
  if ((req as any).user?.unit === 'factory') return res.status(403).json({ error: 'Forbidden' });
  await Event.findByIdAndDelete(req.params.id);
  await Finance.deleteMany({ eventId: req.params.id, autoEventBudget: true });
  res.status(204).end();
});

export default router;
