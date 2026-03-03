import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_lib/db';
import { Event, Task, Employee, Contractor } from '../_lib/models';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  await connectDB();

  const now = new Date().toISOString().split('T')[0];

  const [totalEvents, upcomingEvents, pendingTasks, activeEmployees, totalContractors] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({ date: { $gte: now }, status: { $nin: ['completed', 'cancelled'] } }),
    Task.countDocuments({ status: { $nin: ['done'] } }),
    Employee.countDocuments({ status: 'ativo' }),
    Contractor.countDocuments({ status: 'ativo' }),
  ]);

  res.json({ totalEvents, upcomingEvents, pendingTasks, activeEmployees, totalContractors });
}
