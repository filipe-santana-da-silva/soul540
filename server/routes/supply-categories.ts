import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
}, { toJSON: { virtuals: true, versionKey: false } });

const FranchiseCategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
}, { collection: 'franchisesupplycategories', toJSON: { virtuals: true, versionKey: false } });

const Category = mongoose.models.SupplyCategory || mongoose.model('SupplyCategory', CategorySchema);
const FranchiseCategory = mongoose.models.FranchiseSupplyCategory || mongoose.model('FranchiseSupplyCategory', FranchiseCategorySchema);

function getModel(req: any) {
  return getTenantUnit(req) === 'franchise' ? FranchiseCategory : Category;
}

const router = Router();

router.get('/', async (req, res) => {
  const cats = await getModel(req).find().sort({ name: 1 });
  res.json(cats.map((c: { name: string }) => c.name));
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const cat = await getModel(req).findOneAndUpdate(
    { name: name.trim() },
    { name: name.trim() },
    { upsert: true, new: true },
  );
  res.status(201).json(cat.name);
});

router.delete('/', async (req, res) => {
  const { name } = req.body;
  await getModel(req).deleteOne({ name });
  res.status(204).end();
});

export default router;
