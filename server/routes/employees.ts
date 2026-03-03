import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';

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
}, { toJSON: { virtuals: true, versionKey: false } });

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

const router = Router();

router.get('/', async (_req, res) => {
  const employees = await Employee.find().sort({ name: 1 });
  res.json(employees);
});

router.post('/', async (req, res) => {
  const employee = await Employee.create(req.body);
  res.status(201).json(employee);
});

router.put('/:id', async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!employee) return res.status(404).json({ error: 'Not found' });
  res.json(employee);
});

router.delete('/:id', async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
