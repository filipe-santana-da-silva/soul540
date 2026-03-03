import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db';
import { Finance } from '../_lib/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  if (req.method === 'GET') {
    const finances = await Finance.find().sort({ date: -1 });
    return res.json(finances);
  }

  if (req.method === 'POST') {
    const finance = await Finance.create(req.body);
    return res.status(201).json(finance);
  }

  res.status(405).end();
}
