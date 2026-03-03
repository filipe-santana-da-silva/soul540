import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { Finance } from './finances';

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
}, { toJSON: { virtuals: true, versionKey: false } });

const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

const router = Router();

router.get('/', async (_req, res) => {
  const events = await Event.find().sort({ date: 1 });
  res.json(events);
});

router.post('/', async (req, res) => {
  const event = await Event.create(req.body);
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
    });
  }
  res.status(201).json(event);
});

router.put('/:id', async (req, res) => {
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
      });
    }
  } else if (existing) {
    await Finance.findByIdAndDelete(existing._id);
  }
  res.json(event);
});

router.delete('/:id', async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  await Finance.deleteMany({ eventId: req.params.id, autoEventBudget: true });
  res.status(204).end();
});

export default router;
