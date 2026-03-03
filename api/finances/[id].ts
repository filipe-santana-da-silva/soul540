import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db';
import { Finance } from '../_lib/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;

  if (req.method === 'PUT') {
    const finance = await Finance.findByIdAndUpdate(id, req.body, { new: true });
    if (!finance) return res.status(404).json({ error: 'Not found' });
    return res.json(finance);
  }

  if (req.method === 'DELETE') {
    await Finance.findByIdAndDelete(id);
    return res.status(204).end();
  }

  res.status(405).end();
}
