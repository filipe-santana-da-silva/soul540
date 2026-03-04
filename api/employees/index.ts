// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db.js';
import { Employee } from '../_lib/models.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  if (req.method === 'GET') {
    const employees = await Employee.find().sort({ name: 1 });
    return res.json(employees);
  }

  if (req.method === 'POST') {
    const employee = await Employee.create(req.body);
    return res.status(201).json(employee);
  }

  res.status(405).end();
}
