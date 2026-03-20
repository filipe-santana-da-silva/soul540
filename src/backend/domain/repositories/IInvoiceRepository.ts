import type { Invoice } from '../entities/Invoice';

export interface IInvoiceRepository {
  getAll(): Invoice[];
  getById(id: string): Invoice | undefined;
  create(invoice: Invoice): void;
  update(id: string, data: Partial<Invoice>): void;
  delete(id: string): void;
}
