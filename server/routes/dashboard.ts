import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', async (_req, res) => {
  const Event = mongoose.model('Event');
  const Task = mongoose.model('Task');
  const Employee = mongoose.model('Employee');
  const Contractor = mongoose.model('Contractor');

  const now = new Date().toISOString().split('T')[0];

  const [totalEvents, upcomingEvents, pendingTasks, activeEmployees, totalContractors] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({ date: { $gte: now }, status: { $nin: ['completed', 'cancelled'] } }),
    Task.countDocuments({ status: { $nin: ['done'] } }),
    Employee.countDocuments({ status: 'ativo' }),
    Contractor.countDocuments({ status: 'ativo' }),
  ]);

  res.json({ totalEvents, upcomingEvents, pendingTasks, activeEmployees, totalContractors });
});

export default router;
