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
}
