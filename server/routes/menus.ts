import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';

const MenuItemSchema = new Schema({
  id: String,
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
}, { _id: false });

const MenuCategorySchema = new Schema({
  id: String,
  name: { type: String, default: '' },
  items: [MenuItemSchema],
}, { _id: false });

const MenuSchema = new Schema({
  name: String,
  eventId: { type: String, default: '' },
  headerText: { type: String, default: '' },
  footerText: { type: String, default: '' },
  categories: [MenuCategorySchema],
  source: { type: String, default: 'main' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'menus', toJSON: { virtuals: true, versionKey: false } });

const FranchiseMenuSchema = new Schema({
  name: String,
  eventId: { type: String, default: '' },
  headerText: { type: String, default: '' },
  footerText: { type: String, default: '' },
  categories: [MenuCategorySchema],
  source: { type: String, default: 'franchise' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: 'franchisemenus', toJSON: { virtuals: true, versionKey: false } });

const Menu = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
const FranchiseMenu = mongoose.models.FranchiseMenu || mongoose.model('FranchiseMenu', FranchiseMenuSchema);

function isFromFranchise(req: any): boolean {
  return getTenantUnit(req) === 'franchise';
}

async function findInBothCollections(id: string) {
  const doc = await Menu.findById(id);
  if (doc) return { doc, model: Menu };
  const fdoc = await FranchiseMenu.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseMenu };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  const Model = isFromFranchise(req) ? FranchiseMenu : Menu;
  const items = await Model.find({});
  res.json(items);
});

router.post('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const menu = await FranchiseMenu.create({ ...req.body, source: 'franchise' });
    return res.status(201).json(menu);
  }
  const menu = await Menu.create({ ...req.body, source: 'main' });
  res.status(201).json(menu);
});

router.put('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const menu = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(menu);
});

router.delete('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  await found.model.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
