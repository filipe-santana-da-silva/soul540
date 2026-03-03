import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db';
import { ContractorCategory } from '../_lib/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  if (req.method === 'GET') {
    const cats = await ContractorCategory.find().sort({ name: 1 });
    return res.json(cats.map((c: { name: string }) => c.name));
  }

  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name required' });
    const cat = await ContractorCategory.findOneAndUpdate(
      { name: name.trim() },
      { name: name.trim() },
      { upsert: true, new: true },
    );
    return res.status(201).json(cat.name);
  }

  if (req.method === 'DELETE') {
    const { name } = req.body;
    await ContractorCategory.deleteOne({ name });
    return res.status(204).end();
  }

  res.status(405).end();
}
