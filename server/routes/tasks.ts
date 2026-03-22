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

const FactoryTaskSchema = new Schema({
  title: String,
  description: { type: String, default: '' },
  status: { type: String, default: 'backlog' },
  priority: { type: String, default: 'medium' },
  assignee: { type: String, default: '' },
  dueDate: String,
  eventId: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  source: { type: String, default: 'factory' },
}, { collection: 'factorytasks', toJSON: { virtuals: true, versionKey: false } });

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const FranchiseTask = mongoose.models.FranchiseTask || mongoose.model('FranchiseTask', FranchiseTaskSchema);
const FactoryTask = mongoose.models.FactoryTask || mongoose.model('FactoryTask', FactoryTaskSchema);

function getModel(req: any) {
  const unit = getTenantUnit(req);
  if (unit === 'franchise') return FranchiseTask;
  if (unit === 'factory') return FactoryTask;
  return Task;
}

async function findInAllCollections(id: string) {
  const doc = await Task.findById(id);
  if (doc) return { doc, model: Task };
  const fdoc = await FranchiseTask.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseTask };
  const factdoc = await FactoryTask.findById(id);
  if (factdoc) return { doc: factdoc, model: FactoryTask };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  const Model = getModel(req);
  const items = await Model.find({});
  res.json(items);
});

router.post('/', async (req, res) => {
  const unit = getTenantUnit(req);
  const source = unit === 'franchise' ? 'franchise' : unit === 'factory' ? 'factory' : 'main';
  const Model = getModel(req);
  const task = await Model.create({ ...req.body, source });
  res.status(201).json(task);
});

router.put('/:id', async (req, res) => {
  const found = await findInAllCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const task = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

router.delete('/:id', async (req, res) => {
  const found = await findInAllCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  await found.model.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
