import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface PizzaEvent { id: string; name: string; date: string; endDate?: string; time?: string; location?: string; outOfCity?: boolean; phone?: string; guestCount?: number; status?: string; budget?: number; menu?: string[]; notes?: string; responsibleEmployeeId?: string; staffCount?: number; selectedEmployeeIds?: string[]; createdAt?: string; [key: string]: any; }
interface FinanceEntry { id: string; type: string; category: string; description: string; amount: number; date: string; status: string; eventId?: string; autoEventBudget?: boolean; [key: string]: any; }
interface Task { id: string; title: string; description?: string; priority?: string; status?: string; dueDate?: string; createdAt?: string; [key: string]: any; }

interface AppContextData {
  events: PizzaEvent[];
  finances: FinanceEntry[];
  tasks: Task[];
  addFinance: (entry: Omit<FinanceEntry, 'id'>) => Promise<FinanceEntry>;
  updateFinance: (id: string, data: Partial<FinanceEntry>) => Promise<void>;
  deleteFinance: (id: string) => Promise<void>;
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
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    apiFetch('/api/events').then(r => r.json()).then(setEvents).catch(() => {});
    apiFetch('/api/tasks').then(r => r.json()).then(setTasks).catch(() => {});
    apiFetch('/api/finances').then(r => r.json()).then(setFinances).catch(() => {});
  }, []);

  const refreshFinances = useCallback(() => {
    apiFetch('/api/finances').then(r => r.json()).then(setFinances).catch(() => {});
  }, []);

  const addFinance = useCallback(async (data: Omit<FinanceEntry, 'id'>) => {
    const res = await apiFetch('/api/finances', { method: 'POST', body: JSON.stringify(data) });
    const created: FinanceEntry = await res.json();
    setFinances((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateFinance = useCallback(async (id: string, data: Partial<FinanceEntry>) => {
    const res = await apiFetch(`/api/finances/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const updated: FinanceEntry = await res.json();
    setFinances((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }, []);

  const deleteFinance = useCallback(async (id: string) => {
    await apiFetch(`/api/finances/${id}`, { method: 'DELETE' });
    setFinances((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const addEvent = useCallback(async (data: Omit<PizzaEvent, 'id' | 'createdAt'>) => {
    const res = await apiFetch('/api/events', { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error(`Erro ao criar evento: ${res.status}`);
    const created: PizzaEvent = await res.json();
    setEvents((prev) => [...prev, created]);
    refreshFinances();
    return created;
  }, [refreshFinances]);

  const updateEvent = useCallback(async (id: string, data: Partial<PizzaEvent>) => {
    const res = await apiFetch(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) throw new Error(`Erro ao atualizar evento: ${res.status}`);
    const updated: PizzaEvent = await res.json();
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    refreshFinances();
  }, [refreshFinances]);

  const deleteEvent = useCallback(async (id: string) => {
    await apiFetch(`/api/events/${id}`, { method: 'DELETE' });
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setFinances((prev) => prev.filter((f) => f.eventId !== id));
  }, []);

  const addTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt'>) => {
    const res = await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
    const created: Task = await res.json();
    setTasks((prev) => [...prev, created]);
    return created;
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    const res = await apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const updated: Task = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{ events, finances, tasks, addFinance, updateFinance, deleteFinance, addEvent, updateEvent, deleteEvent, addTask, updateTask, deleteTask }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
