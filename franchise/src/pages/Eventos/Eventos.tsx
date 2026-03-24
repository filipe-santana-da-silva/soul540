import { useState, useMemo, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useApp } from '@/contexts/AppContext';
import type { PizzaEvent } from '@/types/Event';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './Eventos.module.scss';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';

type Employee = {
  id: string;
  name: string;
  role: string;
  phone: string;
  status: string;
  createdAt: string;
  unit?: string;
};


function formatBudget(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  const reais = Math.floor(num / 100);
  const centavos = num % 100;
  return `R$ ${reais.toLocaleString('pt-BR')},${String(centavos).padStart(2, '0')}`;
}

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const roleLabels: Record<string, string> = {
  pizzaiolo: 'Pizzaiolo',
  auxiliar: 'Auxiliar',
  garcom: 'Garcom',
  gerente: 'Gerente',
  entregador: 'Entregador',
  administrativo: 'Administrativo',
};

type FormData = {
  name: string;
  date: string;
  endDate: string;
  time: string;
  duration: string;
  location: string;
  outOfCity: boolean;
  phone: string;
  guestCount: string;
  budget: string;
  responsibleEmployeeId: string;
  staffCount: string;
  selectedEmployeeIds: string[];
  paymentProofName: string;
  contractPdfName: string;
  createdBy: string;
  menu: string;
  notes: string;
  status: 'planning' | 'confirmed';
};

const emptyForm: FormData = {
  name: '',
  date: '',
  endDate: '',
  time: '',
  duration: '',
  location: '',
  outOfCity: false,
  phone: '',
  guestCount: '',
  budget: '',
  responsibleEmployeeId: '',
  staffCount: '',
  selectedEmployeeIds: [],
  paymentProofName: '',
  contractPdfName: '',
  createdBy: '',
  menu: '',
  notes: '',
  status: 'confirmed',
};

function buildWhatsAppUrl(ev: PizzaEvent): string {
  const digits = ev.phone?.replace(/\D/g, '') || '';
  if (!digits) return '';
  const dateStr = format(parseISO(ev.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const lines = [
    `Olá! Segue o resumo do evento *${ev.name}*:`,
    '',
    `Data: ${dateStr}${ev.time ? ` às ${ev.time}` : ''}`,
    `Local: ${ev.location}${ev.outOfCity ? ' (fora da cidade)' : ''}`,
    `Convidados: ${ev.guestCount}`,
    `Valor: R$ ${(ev.budget ?? 0).toLocaleString('pt-BR')}`,
    ...(ev.notes ? [`Obs: ${ev.notes}`] : []),
  ];
  return `https://wa.me/55${digits}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function EventCard({ ev, employeeMap, onView, onEdit, onDelete }: {
  ev: PizzaEvent;
  employeeMap: Record<string, string>;
  onView: (ev: PizzaEvent) => void;
  onEdit: (ev: PizzaEvent) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={styles.card} onClick={() => onView(ev)}>
      <div className={styles.cardTop}>
        <div>
          <h3 className={styles.cardTitle}>{ev.name}</h3>
          <p className={styles.cardSub}>
            {format(parseISO(ev.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
            {ev.endDate && ` → ${format(parseISO(ev.endDate), "dd 'de' MMM", { locale: ptBR })}`}
            {ev.time && ` · ${ev.time}`}
          </p>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {ev.location}{ev.outOfCity && ' (fora da cidade)'}
        </div>
        <div className={styles.cardRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          {ev.guestCount} convidados{ev.staffCount ? ` · ${ev.staffCount} funcionarios` : ''}
        </div>
        <div className={styles.cardRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          R$ {(ev.budget ?? 0).toLocaleString('pt-BR')}
        </div>
        {ev.responsibleEmployeeId && (
          <div className={styles.cardRow}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Resp: {employeeMap[ev.responsibleEmployeeId] || ev.responsibleEmployeeId}
          </div>
        )}
      </div>
      {ev.notes && <p className={styles.cardNotes}>{ev.notes}</p>}
      <div className={styles.cardActions}>
        {ev.phone && (
          <a className={styles.btnWhatsapp} href={buildWhatsAppUrl(ev)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="WhatsApp">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          </a>
        )}
        <button className={styles.btnEdit} onClick={(e) => { e.stopPropagation(); onEdit(ev); }}>Editar</button>
        <button className={styles.btnDelete} onClick={(e) => { e.stopPropagation(); onDelete(ev.id); }}>Excluir</button>
      </div>
    </div>
  );
}

const STATIC_MENU_NAMES = ['Menu Eccezionale', 'Menu Superiore', 'Menu Raffinato'];

export default function Eventos() {
  const { events, addEvent, updateEvent, deleteEvent } = useApp();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableMenus, setAvailableMenus] = useState<string[]>(STATIC_MENU_NAMES);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  useEffect(() => {
    apiFetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => {});
    apiFetch('/api/menus').then(r => r.json()).then((data: { name: string }[]) => {
      if (Array.isArray(data)) {
        const apiNames = data.map(m => m.name).filter(n => !STATIC_MENU_NAMES.includes(n));
        setAvailableMenus([...STATIC_MENU_NAMES, ...apiNames]);
      }
    }).catch(() => {});
  }, []);
  const [search, setSearch] = useState('');
const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<PizzaEvent | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const employeeMap = useMemo(() => {
    const m: Record<string, string> = {};
    employees.forEach((e) => { m[e.id] = e.name; });
    return m;
  }, [employees]);

  const filtered = useMemo(() => {
    const all = events
      .filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return {
      fechados: all.filter((e) => e.status !== 'planning'),
      orcamentos: all.filter((e) => e.status === 'planning'),
    };
  }, [events, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (ev: PizzaEvent) => {
    setForm({
      name: ev.name,
      date: ev.date,
      endDate: ev.endDate || '',
      time: ev.time || '',
      duration: ev.duration || '',
      location: ev.location || '',
      outOfCity: ev.outOfCity || false,
      phone: ev.phone || '',
      guestCount: String(ev.guestCount),
      budget: ev.budget ? formatBudget(String(Math.round(ev.budget * 100))) : '',
      responsibleEmployeeId: ev.responsibleEmployeeId || '',
      staffCount: ev.staffCount ? String(ev.staffCount) : '',
      selectedEmployeeIds: ev.selectedEmployeeIds || [],
      paymentProofName: ev.paymentProofName || '',
      contractPdfName: ev.contractPdfName || '',
      createdBy: ev.createdBy || '',
      menu: (ev.menu ?? []).join(', '),
      notes: ev.notes || '',
      status: ev.status === 'planning' ? 'planning' : 'confirmed',
    });
    setEditingId(ev.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const toggleEmployee = (empId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedEmployeeIds: prev.selectedEmployeeIds.includes(empId)
        ? prev.selectedEmployeeIds.filter((id) => id !== empId)
        : [...prev.selectedEmployeeIds, empId],
    }));
  };

  const handlePaymentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, paymentProofName: file.name }));
    e.target.value = '';
  };

  const handleContractFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, contractPdfName: file.name }));
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!form.name || !form.date || !form.location) return;
    const data: Omit<PizzaEvent, 'id' | 'createdAt'> = {
      name: form.name,
      date: form.date,
      endDate: form.endDate || undefined,
      time: form.time || undefined,
      duration: form.duration || undefined,
      location: form.location,
      outOfCity: form.outOfCity,
      phone: form.phone || undefined,
      guestCount: Number(form.guestCount) || 0,
      status: form.status,
      budget: Number(form.budget.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
      menu: form.menu.split(',').map((s) => s.trim()).filter(Boolean),
      notes: form.notes,
      responsibleEmployeeId: form.responsibleEmployeeId || undefined,
      staffCount: Number(form.staffCount) || undefined,
      selectedEmployeeIds: form.selectedEmployeeIds.length > 0 ? form.selectedEmployeeIds : undefined,
      paymentProofName: form.paymentProofName || undefined,
      contractPdfName: form.contractPdfName || undefined,
      createdBy: form.createdBy || undefined,
    };
    try {
      if (editingId) {
        await updateEvent(editingId, data);
      } else {
        await addEvent(data);
      }
      closeModal();
    } catch (err) {
      console.error('Erro ao salvar evento:', err);
    }
  };

  const handleDelete = (id: string) => { setDeleteTargetId(id); };
  const confirmDelete = async () => {
    if (deleteTargetId) await deleteEvent(deleteTargetId);
    setDeleteTargetId(null);
  };

return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Eventos</h1>
            <button className={styles.btnInfo} onClick={() => setShowInfo(true)} title="Como usar esta página">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
          </div>
          <p className={styles.subtitle}>Gerencie seus agendamentos e eventos de pizza</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Agendamento
        </button>
      </div>

<div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className={styles.searchInput}
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.fechados.length === 0 && filtered.orcamentos.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhum evento encontrado.</p>
          <button className={styles.emptyBtn} onClick={openCreate}>Criar primeiro agendamento</button>
        </div>
      ) : (
        <div className={styles.sections}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Orçamentos</h2>
            {filtered.orcamentos.length === 0 ? (
              <p className={styles.sectionEmpty}>Nenhum orçamento.</p>
            ) : (
              <div className={styles.grid}>
                {filtered.orcamentos.map((ev) => <EventCard key={ev.id} ev={ev} employeeMap={employeeMap} onView={setViewingEvent} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            )}
          </div>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Eventos Fechados</h2>
            {filtered.fechados.length === 0 ? (
              <p className={styles.sectionEmpty}>Nenhum evento fechado.</p>
            ) : (
              <div className={styles.grid}>
                {filtered.fechados.map((ev) => <EventCard key={ev.id} ev={ev} employeeMap={employeeMap} onView={setViewingEvent} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>

              {/* — Categoria — */}
              <div className={styles.statusToggle}>
                <button
                  type="button"
                  className={`${styles.statusBtn} ${form.status === 'confirmed' ? styles.statusBtnActive : ''}`}
                  onClick={() => setForm({ ...form, status: 'confirmed' })}
                >
                  Evento Fechado
                </button>
                <button
                  type="button"
                  className={`${styles.statusBtn} ${form.status === 'planning' ? styles.statusBtnActive : ''}`}
                  onClick={() => setForm({ ...form, status: 'planning' })}
                >
                  Orçamento
                </button>
              </div>

              {/* — Identificação — */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Nome do Evento *</label>
                <input className={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Casamento Silva" />
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Data Inicial *</label>
                  <input className={styles.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Data Final</label>
                  <input className={styles.input} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Horario</label>
                  <input className={styles.input} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Duracao</label>
                  <input className={styles.input} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Ex: 4 horas" />
                </div>
              </div>

              {/* — Local — */}
              <div className={styles.formSection}>
                <p className={styles.formSectionTitle}>Local</p>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Endereco do Evento *</label>
                  <input className={styles.input} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex: Salao Premium - Centro SP" />
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Telefone de Contato</label>
                    <input className={styles.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(11) 99999-0000" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>&nbsp;</label>
                    <div className={styles.checkRow} onClick={() => setForm({ ...form, outOfCity: !form.outOfCity })}>
                      <input type="checkbox" id="outOfCity" checked={form.outOfCity} readOnly />
                      <label htmlFor="outOfCity">Evento fora da cidade</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* — Equipe — */}
              <div className={styles.formSection}>
                <p className={styles.formSectionTitle}>Equipe</p>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Funcionario Responsavel</label>
                    <select className={styles.input} value={form.responsibleEmployeeId} onChange={(e) => setForm({ ...form, responsibleEmployeeId: e.target.value })}>
                      <option value="">Selecionar</option>
                      {employees.filter((e) => e.status === 'ativo').map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Qtd. Funcionarios</label>
                    <input className={styles.input} type="number" value={form.staffCount} onChange={(e) => setForm({ ...form, staffCount: e.target.value })} placeholder="0" min="0" />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Funcionarios no Evento ({form.selectedEmployeeIds.length} selecionados)</label>
                  <div className={styles.checkList}>
                    {employees.map((emp) => (
                      <label key={emp.id} className={styles.checkItem} onClick={() => toggleEmployee(emp.id)}>
                        <input type="checkbox" checked={form.selectedEmployeeIds.includes(emp.id)} readOnly />
                        <span className={styles.checkLabel}>
                          {emp.name} <span>{roleLabels[emp.role]}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* — Financeiro — */}
              <div className={styles.formSection}>
                <p className={styles.formSectionTitle}>Financeiro</p>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Valor do Agendamento (R$)</label>
                    <input className={styles.input} value={form.budget} onChange={(e) => setForm({ ...form, budget: formatBudget(e.target.value) })} placeholder="R$ 0,00" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Convidados</label>
                    <input className={styles.input} type="number" value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} placeholder="0" />
                  </div>
                </div>
              </div>

              {/* — Documentos — */}
              <div className={styles.formSection}>
                <p className={styles.formSectionTitle}>Documentos</p>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Comprovante de Pagamento</label>
                    <label className={`${styles.fileUploadBtn} ${form.paymentProofName ? styles.fileSelected : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      {form.paymentProofName || 'Selecionar arquivo'}
                      <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handlePaymentFile} />
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Contrato (PDF)</label>
                    <label className={`${styles.fileUploadBtn} ${form.contractPdfName ? styles.fileSelected : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      {form.contractPdfName || 'Selecionar PDF'}
                      <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleContractFile} />
                    </label>
                  </div>
                </div>
              </div>

              {/* — Criador — */}
              <div className={styles.formSection}>
                <p className={styles.formSectionTitle}>Criacao</p>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Seu Nome Completo</label>
                  <input className={styles.input} value={form.createdBy} onChange={(e) => setForm({ ...form, createdBy: e.target.value })} placeholder="Nome de quem esta criando o agendamento" />
                </div>
              </div>

              {/* — Extras — */}
              <div className={styles.formSection}>
                <p className={styles.formSectionTitle}>Extras</p>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cardápio</label>
                  <div style={{ position: 'relative' }}>
                    <div
                      className={styles.input}
                      style={{ cursor: 'pointer', userSelect: 'none', minHeight: 38, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}
                      onClick={() => setShowMenuDropdown(v => !v)}
                    >
                      {form.menu ? form.menu.split(',').map(s => s.trim()).filter(Boolean).map(name => (
                        <span key={name} style={{ background: 'rgba(255,193,7,0.15)', color: '#ffc107', fontSize: 12, borderRadius: 4, padding: '2px 7px' }}>{name}</span>
                      )) : <span style={{ color: 'var(--text-muted, #666)', fontSize: 13 }}>Selecionar cardápios...</span>}
                    </div>
                    {showMenuDropdown && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#131929', border: '1px solid #2a3352', borderRadius: 8, padding: 8, marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                        {availableMenus.map(name => {
                          const selected = form.menu.split(',').map(s => s.trim()).includes(name);
                          return (
                            <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 4, background: selected ? 'rgba(255,193,7,0.08)' : 'transparent' }}>
                              <input type="checkbox" checked={selected} onChange={() => {
                                const current = form.menu.split(',').map(s => s.trim()).filter(Boolean);
                                const next = selected ? current.filter(n => n !== name) : [...current, name];
                                setForm({ ...form, menu: next.join(', ') });
                              }} />
                              <span style={{ fontSize: 13 }}>{name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Observacoes</label>
                  <textarea className={styles.textarea} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalhes adicionais..." />
                </div>
              </div>

            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={closeModal}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={!form.name || !form.date || !form.location}>
                {editingId ? 'Salvar' : 'Criar Agendamento'}
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingEvent && (
        <div className={styles.overlay} onClick={() => setViewingEvent(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{viewingEvent.name}</h2>
              <button className={styles.modalClose} onClick={() => setViewingEvent(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.detailBody}>

              <div className={styles.detailSection}>
                <p className={styles.detailSectionTitle}>Informações</p>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Data</span>
                    <span className={styles.detailValue}>
                      {format(parseISO(viewingEvent.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      {viewingEvent.endDate && ` → ${format(parseISO(viewingEvent.endDate), "dd 'de' MMMM, yyyy", { locale: ptBR })}`}
                    </span>
                  </div>
                  {viewingEvent.time && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Horário</span>
                      <span className={styles.detailValue}>{viewingEvent.time}</span>
                    </div>
                  )}
                  {viewingEvent.duration && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Duração</span>
                      <span className={styles.detailValue}>{viewingEvent.duration}</span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Local</span>
                    <span className={styles.detailValue}>{viewingEvent.location}{viewingEvent.outOfCity && ' (fora da cidade)'}</span>
                  </div>
                  {viewingEvent.phone && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Telefone</span>
                      <span className={styles.detailValue}>{viewingEvent.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.detailSection}>
                <p className={styles.detailSectionTitle}>Financeiro</p>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Valor</span>
                    <span className={styles.detailValue}>R$ {(viewingEvent.budget ?? 0).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Convidados</span>
                    <span className={styles.detailValue}>{viewingEvent.guestCount}</span>
                  </div>
                </div>
              </div>

              {(viewingEvent.responsibleEmployeeId || viewingEvent.staffCount || (viewingEvent.selectedEmployeeIds && viewingEvent.selectedEmployeeIds.length > 0)) && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Equipe</p>
                  <div className={styles.detailGrid}>
                    {viewingEvent.responsibleEmployeeId && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Responsável</span>
                        <span className={styles.detailValue}>{employeeMap[viewingEvent.responsibleEmployeeId] || viewingEvent.responsibleEmployeeId}</span>
                      </div>
                    )}
                    {viewingEvent.staffCount && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Funcionários</span>
                        <span className={styles.detailValue}>{viewingEvent.staffCount} pessoas</span>
                      </div>
                    )}
                  </div>
                  {viewingEvent.selectedEmployeeIds && viewingEvent.selectedEmployeeIds.length > 0 && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Equipe escalada</span>
                      <div className={styles.menuTags}>
                        {viewingEvent.selectedEmployeeIds.map((id) => (
                          <span key={id} className={styles.menuTag}>{employeeMap[id] || id}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewingEvent.menu && viewingEvent.menu.length > 0 && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Cardápio</p>
                  <div className={styles.menuTags}>
                    {viewingEvent.menu.map((item, i) => (
                      <span key={i} className={styles.menuTag}>{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewingEvent.notes && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Observações</p>
                  <p className={styles.detailValue}>{viewingEvent.notes}</p>
                </div>
              )}

              {(viewingEvent.paymentProofName || viewingEvent.contractPdfName) && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Documentos</p>
                  <div className={styles.detailGrid}>
                    {viewingEvent.paymentProofName && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Comprovante</span>
                        <span className={styles.detailValue}>{viewingEvent.paymentProofName}</span>
                      </div>
                    )}
                    {viewingEvent.contractPdfName && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Contrato</span>
                        <span className={styles.detailValue}>{viewingEvent.contractPdfName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewingEvent.createdBy && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Criado por</p>
                  <p className={styles.detailValue}>{viewingEvent.createdBy}</p>
                </div>
              )}

            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setViewingEvent(null)}>Fechar</button>
              <button className={styles.btnPrimary} onClick={() => { setViewingEvent(null); openEdit(viewingEvent); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
      {showInfo && (
        <div className={styles.overlay} onClick={() => setShowInfo(false)}>
          <div className={styles.modal} style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Sobre esta página</h2>
              <button className={styles.modalClose} onClick={() => setShowInfo(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>O que é esta página?</p>
                <p className={styles.infoText}>
                  A página de <strong>Eventos</strong> centraliza todos os agendamentos de pizza. Cada evento contém informações completas: data, local, equipe, valor do contrato, cardápio e documentos.
                </p>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Como criar um agendamento</p>
                <ol className={styles.infoList}>
                  <li>Clique em <strong>Novo Agendamento</strong> no canto superior direito.</li>
                  <li>Preencha nome do evento, data, local e demais informações.</li>
                  <li>Selecione os funcionários da equipe e o responsável.</li>
                  <li>Informe o valor do contrato — ele será registrado automaticamente no <strong>Financeiro</strong>.</li>
                  <li>Clique em <strong>Criar Agendamento</strong> para salvar.</li>
                </ol>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <span />
              <button className={styles.btnPrimary} onClick={() => setShowInfo(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}
      {deleteTargetId && (
        <ConfirmModal
          title="Excluir Evento"
          message={<>Tem certeza que deseja excluir <strong>{events.find((e) => e.id === deleteTargetId)?.name}</strong>? Esta acao nao pode ser desfeita.</>}
          confirmLabel="Excluir"
          variant="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
