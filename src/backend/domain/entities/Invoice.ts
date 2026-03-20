export type InvoiceStatus = 'rascunho' | 'emitida' | 'cancelada';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
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
  createdAt: string;
}
