import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db';
import { Contractor } from '../_lib/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  if (req.method === 'GET') {
    const contractors = await Contractor.find().sort({ name: 1 });
    return res.json(contractors);
  }

  if (req.method === 'POST') {
    const contractor = await Contractor.create(req.body);
    return res.status(201).json(contractor);
  }

  res.status(405).end();
}
