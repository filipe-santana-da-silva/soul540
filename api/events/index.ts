import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db.js';
import { Event, Finance } from '../_lib/models.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  if (req.method === 'GET') {
    const events = await Event.find().sort({ date: 1 });
    return res.json(events);
  }

  if (req.method === 'POST') {
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
    return res.status(201).json(event);
  }

  res.status(405).end();
}
