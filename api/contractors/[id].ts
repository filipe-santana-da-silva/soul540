// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db.js';
import { Contractor } from '../_lib/models.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) return res.status(400).end();

  if (req.method === 'PUT') {
    const contractor = await (Contractor.findByIdAndUpdate(id, req.body as any, { new: true }) as any);
    if (!contractor) return res.status(404).json({ error: 'Not found' });
    return res.json(contractor);
  }

  if (req.method === 'DELETE') {
    await Contractor.findByIdAndDelete(id);
    return res.status(204).end();
  }

  res.status(405).end();
}
