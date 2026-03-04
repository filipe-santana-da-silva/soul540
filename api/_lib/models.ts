// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

// ── Event ──────────────────────────────────────────────────
const EventSchema = new Schema({
  name: String,
  date: String,
  endDate: String,
  time: String,
  duration: String,
  location: String,
  outOfCity: Boolean,
  phone: String,
  guestCount: { type: Number, default: 0 },
  status: { type: String, default: 'planning' },
  budget: { type: Number, default: 0 },
  menu: [String],
  notes: { type: String, default: '' },
  responsibleEmployeeId: String,
  staffCount: Number,
  selectedEmployeeIds: [String],
  paymentProofName: String,
  contractPdfName: String,
  createdBy: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true, versionKey: false } });

export const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

// ── Finance ────────────────────────────────────────────────
const FinanceSchema = new Schema({
  eventId: { type: String, required: true },
  type: { type: String, enum: ['revenue', 'cost'], required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['pending', 'paid', 'received'], default: 'pending' },
  autoEventBudget: { type: Boolean, default: false },
}, { toJSON: { virtuals: true, versionKey: false }, id: true });

export const Finance = mongoose.models.Finance || mongoose.model('Finance', FinanceSchema);

// ── Task ───────────────────────────────────────────────────
const TaskSchema = new Schema({
  title: String,
  description: { type: String, default: '' },
  status: { type: String, default: 'backlog' },
  priority: { type: String, default: 'medium' },
  assignee: { type: String, default: '' },
  dueDate: String,
  eventId: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true, versionKey: false } });

export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

// ── Employee ───────────────────────────────────────────────
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

export const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

// ── Contractor ─────────────────────────────────────────────
const ContractorSchema = new Schema({
  name: String,
  type: { type: String, default: 'pessoa_fisica' },
  document: { type: String, default: '' },
  documentType: String,
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: String,
  maritalStatus: String,
  profession: String,
  category: String,
  status: { type: String, default: 'ativo' },
  totalRevenue: { type: Number, default: 0 },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true, versionKey: false } });

export const Contractor = mongoose.models.Contractor || mongoose.model('Contractor', ContractorSchema);

// ── ContractorCategory ─────────────────────────────────────
const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
}, { toJSON: { virtuals: true, versionKey: false } });

export const ContractorCategory = mongoose.models.ContractorCategory || mongoose.model('ContractorCategory', CategorySchema);
