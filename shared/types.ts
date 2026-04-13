// Shared types used across main, franchise, and factory apps

// ── Events ──────────────────────────────────────────────────────────────────

export type EventStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface PizzaEvent {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  time?: string;
  duration?: string;
  location: string;
  outOfCity?: boolean;
  phone?: string;
  guestCount: number;
  status: EventStatus;
  budget: number;
  menu: string[];
  notes: string;
  responsibleEmployeeId?: string;
  staffCount?: number;
  selectedEmployeeIds?: string[];
  paymentProofName?: string;
  contractPdfName?: string;
  createdBy?: string;
  createdAt: string;
  unit?: string;
  source?: string;
  celebration?: string;
  teamArrivalTime?: string;
  city?: string;
  guestsAdult?: number;
  guestsTeen?: number;
  guestsChild?: number;
  travelCost?: number;
  teamPizzaiolo?: string;
  teamHelper?: string;
  teamGarcon?: string;
  extrasLoucas?: number;
  extrasBebidas?: number;
  finalValue?: number;
  paymentMethod?: string;
  locationImageName?: string;
  locationImageData?: string;
  paymentProofData?: string;
  contractPdfData?: string;
}

// ── Finances ─────────────────────────────────────────────────────────────────

export type FinanceType = 'revenue' | 'cost';
export type FinanceStatus = 'pending' | 'paid' | 'received';

export interface FinanceEntry {
  id: string;
  eventId: string;
  type: FinanceType;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: FinanceStatus;
  autoEventBudget?: boolean;
  source?: string;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate?: string;
  eventId?: string;
  createdAt: string;
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'rascunho' | 'emitida' | 'cancelada';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  // NF-e only
  ncm?: string;
  cfop?: string;
  unit?: string;
}

export interface Invoice {
  id: string;
  eventId: string;
  clientName: string;
  clientDocument: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalValue: number;
  issueDate: string;
  notes: string;
  status: InvoiceStatus;
  // Tipo de documento
  type?: 'nfse' | 'nfe';
  serviceCode?: string;          // código de serviço municipal (NFS-e)

  // Endereço do tomador/destinatário
  clientAddress?: string;
  clientNumber?: string;
  clientDistrict?: string;
  clientCity?: string;
  clientState?: string;
  clientPostalCode?: string;

  // Resposta nfe.io (preenchida após emissão)
  nfeioId?: string;
  nfeioStatus?: 'processing' | 'issued' | 'error';
  nfeioNumber?: string;
  nfeioPdfUrl?: string;
  nfeioXmlUrl?: string;
  nfeioAccessKey?: string;
  nfeioProtocol?: string;
  nfeioRawResponse?: Record<string, unknown>;
  createdAt: string;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'manager' | 'staff';
  isAdmin: boolean;
  permissions: string[];
  unit: 'main' | 'franchise' | 'factory';
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
