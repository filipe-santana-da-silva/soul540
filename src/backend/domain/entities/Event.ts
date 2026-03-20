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
}
