import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';

const EmployeeSchema = new Schema({
  name: String,
  role: { type: String, default: 'auxiliar' },
  phone: { type: String, default: '' },
  status: { type: String, default: 'ativo' },
  email: String,
  city: String,
  state: String,
  hireDate: String,
  salary: Number,
  cpf: String,
  rg: String,
  address: String,
  notes: String,
  pixKey: String,
  availableDays: [String],
  createdAt: { type: String, default: () => new Date().toISOString() },
  source: { type: String, default: 'main' },
}, { collection: 'employees', toJSON: { virtuals: true, versionKey: false } });

const FranchiseEmployeeSchema = new Schema({
  name: String,
  role: { type: String, default: 'auxiliar' },
  phone: { type: String, default: '' },
  status: { type: String, default: 'ativo' },
  email: String,
  city: String,
  state: String,
  hireDate: String,
  salary: Number,
  cpf: String,
  rg: String,
  address: String,
  notes: String,
  pixKey: String,
  availableDays: [String],
  createdAt: { type: String, default: () => new Date().toISOString() },
  source: { type: String, default: 'franchise' },
}, { collection: 'franchiseemployees', toJSON: { virtuals: true, versionKey: false } });

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const FranchiseEmployee = mongoose.models.FranchiseEmployee || mongoose.model('FranchiseEmployee', FranchiseEmployeeSchema);

function isFromFranchise(req: any): boolean {
  return getTenantUnit(req) === 'franchise';
}

async function findInBothCollections(id: string) {
  const doc = await Employee.findById(id);
  if (doc) return { doc, model: Employee };
  const fdoc = await FranchiseEmployee.findById(id);
  if (fdoc) return { doc: fdoc, model: FranchiseEmployee };
  return null;
}

const router = Router();

router.get('/', async (req, res) => {
  const Model = isFromFranchise(req) ? FranchiseEmployee : Employee;
  const items = await Model.find({});
  res.json(items);
});

router.post('/', async (req, res) => {
  if (isFromFranchise(req)) {
    const employee = await FranchiseEmployee.create({ ...req.body, source: 'franchise' });
    return res.status(201).json(employee);
  }
  const employee = await Employee.create({ ...req.body, source: 'main' });
  res.status(201).json(employee);
});

router.put('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const employee = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(employee);
});

router.delete('/:id', async (req, res) => {
  const found = await findInBothCollections(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  await found.model.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
