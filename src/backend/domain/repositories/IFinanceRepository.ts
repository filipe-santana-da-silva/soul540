import type { FinanceEntry } from '../entities/Finance';

export interface IFinanceRepository {
  getAll(): FinanceEntry[];
  getByEventId(eventId: string): FinanceEntry[];
  create(entry: FinanceEntry): void;
  update(id: string, data: Partial<FinanceEntry>): void;
  delete(id: string): void;
}
