import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';

const TaskSchema = new Schema({
  title: String,
  description: { type: String, default: '' },
  status: { type: String, default: 'backlog' },
  priority: { type: String, default: 'medium' },
  assignee: { type: String, default: '' },
  dueDate: String,
  eventId: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  source: { type: String, default: 'main' },
}, { collection: 'tasks', toJSON: { virtuals: true, versionKey: false } });

const FranchiseTaskSchema = new Schema({
  title: String,
  description: { type: String, default: '' },
  status: { type: String, default: 'backlog' },
  priority: { type: String, default: 'medium' },
  assignee: { type: String, default: '' },
  dueDate: String,
  eventId: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  source: { type: String, default: 'franchise' },
}, { collection: 'franchisetasks', toJSON: { virtuals: true, versionKey: false } });

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const FranchiseTask = mongoose.models.FranchiseTask || mongoose.model('FranchiseTask', FranchiseTaskSchema);

function isFromFranchise(req: any): boolean {
  return getTenantUnit(req) === 'franchise';
}

async function findInBothCollections(id: string) {
  const doc = await Task.findById(id);
  if (doc) return { doc, model: Task };
  const fdoc = await FranchiseTask.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseTask };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const tasks = await FranchiseTask.find({});
    return res.json(tasks);
  }
  const [main, franchise] = await Promise.all([
    Task.find({}),
    FranchiseTask.find({}),
  ]);
  res.json([...main, ...franchise]);
});

router.post('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const task = await FranchiseTask.create({ ...req.body, source: 'franchise' });
    return res.status(201).json(task);
  }
  const task = await Task.create({ ...req.body, source: 'main' });
  res.status(201).json(task);
});

router.put('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const task = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

router.delete('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  await found.model.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
