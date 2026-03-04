// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db.js';
import { Task } from '../_lib/models.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  if (req.method === 'GET') {
    const tasks = await Task.find();
    return res.json(tasks);
  }

  if (req.method === 'POST') {
    const task = await Task.create(req.body);
    return res.status(201).json(task);
  }

  res.status(405).end();
}
