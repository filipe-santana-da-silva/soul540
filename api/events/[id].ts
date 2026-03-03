import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db';
import { Event, Finance } from '../_lib/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;

  if (req.method === 'PUT') {
    const event = await Event.findByIdAndUpdate(id, req.body, { new: true });
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
    return res.json(event);
  }

  if (req.method === 'DELETE') {
    await Event.findByIdAndDelete(id);
    await Finance.deleteMany({ eventId: id, autoEventBudget: true });
    return res.status(204).end();
  }

  res.status(405).end();
}
