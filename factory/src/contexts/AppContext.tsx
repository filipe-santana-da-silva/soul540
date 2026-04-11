import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { PizzaEvent, FinanceEntry, Task, Invoice, InvoiceItem, InvoiceStatus } from '@shared/types';
export type { InvoiceItem, InvoiceStatus, Invoice };

interface AppContextData {
  events: PizzaEvent[];
  finances: FinanceEntry[];
  tasks: Task[];
  invoices: Invoice[];
  addFinance: (entry: Omit<FinanceEntry, 'id'>) => Promise<FinanceEntry>;
  updateFinance: (id: string, data: Partial<FinanceEntry>) => Promise<void>;
  deleteFinance: (id: string) => Promise<void>;
  addEvent: (event: Omit<PizzaEvent, 'id' | 'createdAt'>) => Promise<PizzaEvent>;
  updateEvent: (id: string, data: Partial<PizzaEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextData>({} as AppContextData);

export function AppProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<PizzaEvent[]>([]);
  const [finances, setFinances] = useState<FinanceEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    apiFetch('/api/events').then(r => r.json()).then(setEvents).catch((err) => console.error('Falha ao carregar dados:', err));
    apiFetch('/api/tasks').then(r => r.json()).then(setTasks).catch((err) => console.error('Falha ao carregar dados:', err));
    apiFetch('/api/finances').then(r => r.json()).then(setFinances).catch((err) => console.error('Falha ao carregar dados:', err));
    apiFetch('/api/invoices').then(r => r.json()).then(setInvoices).catch((err) => console.error('Falha ao carregar dados:', err));
  }, []);

  const refreshFinances = useCallback(() => {
    apiFetch('/api/finances').then(r => r.json()).then(setFinances).catch((err) => console.error('Falha ao carregar dados:', err));
  }, []);

  const addFinance = useCallback(async (data: Omit<FinanceEntry, 'id'>) => {
    const res = await apiFetch('/api/finances', { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Falha ao criar lançamento financeiro');
    const created: FinanceEntry = await res.json();
    setFinances((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateFinance = useCallback(async (id: string, data: Partial<FinanceEntry>) => {
    const res = await apiFetch(`/api/finances/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Falha ao atualizar lançamento financeiro');
    const updated: FinanceEntry = await res.json();
    setFinances((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }, []);

  const deleteFinance = useCallback(async (id: string) => {
    const res = await apiFetch(`/api/finances/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir lançamento financeiro');
    setFinances((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const addEvent = useCallback(async (data: Omit<PizzaEvent, 'id' | 'createdAt'>) => {
    const res = await apiFetch('/api/events', { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Falha ao criar evento');
    const created: PizzaEvent = await res.json();
    setEvents((prev) => [...prev, created]);
    refreshFinances();
    return created;
  }, [refreshFinances]);

  const updateEvent = useCallback(async (id: string, data: Partial<PizzaEvent>) => {
    const res = await apiFetch(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Falha ao atualizar evento');
    const updated: PizzaEvent = await res.json();
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    refreshFinances();
  }, [refreshFinances]);

  const deleteEvent = useCallback(async (id: string) => {
    const res = await apiFetch(`/api/events/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir evento');
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setFinances((prev) => prev.filter((f) => f.eventId !== id));
  }, []);

  const addTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt'>) => {
    const res = await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Falha ao criar tarefa');
    const created: Task = await res.json();
    setTasks((prev) => [...prev, created]);
    return created;
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    const res = await apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Falha ao atualizar tarefa');
    const updated: Task = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const res = await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir tarefa');
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addInvoice = useCallback(async (invoice: Invoice) => {
    const { id: _id, ...data } = invoice;
    const res = await apiFetch('/api/invoices', { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Falha ao criar nota fiscal');
    const created: Invoice = await res.json();
    setInvoices((prev) => [created, ...prev]);
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    const res = await apiFetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir nota fiscal');
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{ events, finances, tasks, invoices, addFinance, updateFinance, deleteFinance, addEvent, updateEvent, deleteEvent, addTask, updateTask, deleteTask, addInvoice, deleteInvoice }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
