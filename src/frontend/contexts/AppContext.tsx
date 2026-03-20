import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PizzaEvent } from '@backend/domain/entities/Event';
import type { FinanceEntry } from '@backend/domain/entities/Finance';
import type { Invoice } from '@backend/domain/entities/Invoice';
import type { Task } from '@backend/domain/entities/Task';
import { mockInvoices } from '@backend/infra/data/mockData';

interface AppContextData {
  events: PizzaEvent[];
  finances: FinanceEntry[];
  invoices: Invoice[];
  tasks: Task[];
  addFinance: (entry: Omit<FinanceEntry, 'id'>) => Promise<FinanceEntry>;
  updateFinance: (id: string, data: Partial<FinanceEntry>) => Promise<void>;
  deleteFinance: (id: string) => Promise<void>;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addEvent: (event: Omit<PizzaEvent, 'id' | 'createdAt'>) => Promise<PizzaEvent>;
  updateEvent: (id: string, data: Partial<PizzaEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextData>({} as AppContextData);

export function AppProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<PizzaEvent[]>([]);
  const [finances, setFinances] = useState<FinanceEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(setEvents).catch(() => {});
    fetch('/api/tasks').then(r => r.json()).then(setTasks).catch(() => {});
    fetch('/api/finances').then(r => r.json()).then(setFinances).catch(() => {});
  }, []);

  // Finance (API)
  const addFinance = useCallback(async (data: Omit<FinanceEntry, 'id'>) => {
    const res = await fetch('/api/finances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created: FinanceEntry = await res.json();
    setFinances((prev) => [created, ...prev]);
    return created;
  }, []);
  const updateFinance = useCallback(async (id: string, data: Partial<FinanceEntry>) => {
    const res = await fetch(`/api/finances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated: FinanceEntry = await res.json();
    setFinances((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }, []);
  const deleteFinance = useCallback(async (id: string) => {
    await fetch(`/api/finances/${id}`, { method: 'DELETE' });
    setFinances((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Invoice (still mock)
  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => [...prev, invoice]);
  }, []);
  const updateInvoice = useCallback((id: string, data: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)));
  }, []);
  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  const refreshFinances = useCallback(() => {
    fetch('/api/finances').then(r => r.json()).then(setFinances).catch(() => {});
  }, []);

  // Events (API)
  const addEvent = useCallback(async (data: Omit<PizzaEvent, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created: PizzaEvent = await res.json();
    setEvents((prev) => [...prev, created]);
    refreshFinances();
    return created;
  }, [refreshFinances]);

  const updateEvent = useCallback(async (id: string, data: Partial<PizzaEvent>) => {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated: PizzaEvent = await res.json();
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    refreshFinances();
  }, [refreshFinances]);

  const deleteEvent = useCallback(async (id: string) => {
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setFinances((prev) => prev.filter((f) => f.eventId !== id));
  }, []);

  // Tasks (API)
  const addTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created: Task = await res.json();
    setTasks((prev) => [...prev, created]);
    return created;
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated: Task = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        events, finances, invoices, tasks,
        addFinance, updateFinance, deleteFinance,
        addInvoice, updateInvoice, deleteInvoice,
        addEvent, updateEvent, deleteEvent,
        addTask, updateTask, deleteTask,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
}
