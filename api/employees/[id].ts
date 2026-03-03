import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db';
import { Employee } from '../_lib/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;

  if (req.method === 'PUT') {
    const employee = await Employee.findByIdAndUpdate(id, req.body, { new: true });
    if (!employee) return res.status(404).json({ error: 'Not found' });
    return res.json(employee);
  }

  if (req.method === 'DELETE') {
    await Employee.findByIdAndDelete(id);
    return res.status(204).end();
  }

  res.status(405).end();
}
