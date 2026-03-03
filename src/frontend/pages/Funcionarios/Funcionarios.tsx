import { useState, useMemo, useEffect } from 'react';
import type { Employee } from '@backend/infra/data/mockData';
import Badge from '@frontend/components/Badge/Badge';
import ConfirmModal from '@frontend/components/ConfirmModal/ConfirmModal';
import styles from './Funcionarios.module.scss';

const DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const DAY_LABELS: Record<string, string> = {
  seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom',
};

const roleLabels: Record<Employee['role'], string> = {
  pizzaiolo: 'Pizzaiolo',
  auxiliar: 'Auxiliar',
  garcom: 'Garçom/Garçonete',
  gerente: 'Gerente',
  entregador: 'Entregador',
  administrativo: 'Administrativo',
};

const statusConfig: Record<Employee['status'], { label: string; color: 'green' | 'blue' | 'amber' | 'gray' }> = {
  ativo: { label: 'Ativo', color: 'green' },
  ferias: { label: 'Férias', color: 'blue' },
  afastado: { label: 'Afastado', color: 'amber' },
  desligado: { label: 'Desligado', color: 'gray' },
};

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatRG(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}-${d.slice(8)}`;
}

type FormData = {
  name: string;
  role: Employee['role'];
  phone: string;
  cpf: string;
  rg: string;
  address: string;
  notes: string;
  pixKey: string;
  availableDays: string[];
  status: Employee['status'];
};

const emptyForm: FormData = {
  name: '', role: 'auxiliar', phone: '', cpf: '', rg: '', address: '', notes: '', pixKey: '', availableDays: [], status: 'ativo',
};

export default function Funcionarios() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(setEmployees)
      .finally(() => setLoading(false));
  }, []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.phone.includes(search)) return false;
        if (statusFilter !== 'all' && e.status !== statusFilter) return false;
        if (roleFilter !== 'all' && e.role !== roleFilter) return false;
        return true;
      }),
    [employees, search, statusFilter, roleFilter],
  );

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const map = new Map<string, Employee[]>();
    for (const emp of sorted) {
      const letter = emp.name.charAt(0).toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(emp);
    }
    return map;
  }, [filtered]);

  const totalActive = employees.filter((e) => e.status === 'ativo').length;

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (emp: Employee) => {
    setForm({
      name: emp.name, role: emp.role, phone: emp.phone, status: emp.status,
      cpf: emp.cpf ?? '', rg: emp.rg ?? '', address: emp.address ?? '',
      notes: emp.notes ?? '', pixKey: emp.pixKey ?? '', availableDays: emp.availableDays ?? [],
    });
    setEditingId(emp.id);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    const data: Omit<Employee, 'id' | 'createdAt'> = {
      name: form.name, role: form.role, phone: form.phone, status: form.status,
      cpf: form.cpf || undefined, rg: form.rg || undefined, address: form.address || undefined,
      notes: form.notes || undefined, pixKey: form.pixKey || undefined,
      availableDays: form.availableDays.length > 0 ? form.availableDays : undefined,
    };
    if (editingId) {
      const res = await fetch(`/api/employees/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      const updated = await res.json();
      setEmployees((prev) => prev.map((e) => e.id === editingId ? updated : e));
    } else {
      const res = await fetch('/api/employees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      const created = await res.json();
      setEmployees((prev) => [...prev, created]);
    }
    closeModal();
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await fetch(`/api/employees/${deleteTargetId}`, { method: 'DELETE' });
      setEmployees((prev) => prev.filter((e) => e.id !== deleteTargetId));
    }
    setDeleteTargetId(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Funcionários</h1>
            <button className={styles.btnInfo} onClick={() => setShowInfo(true)} title="Como funciona esta página">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </button>
          </div>
          <p className={styles.subtitle}>Gerencie equipe e colaboradores</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Funcionário
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.blue}`}>
          <div className={styles.kpiLabel}>Total</div>
          <div className={styles.kpiValue}>{employees.length}</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.green}`}>
          <div className={styles.kpiLabel}>Ativos</div>
          <div className={styles.kpiValue}>{totalActive}</div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className={styles.searchInput} placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="ferias">Férias</option>
          <option value="afastado">Afastado</option>
          <option value="desligado">Desligado</option>
        </select>
        <select className={styles.select} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">Todos os cargos</option>
          {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className={styles.empty}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Nenhum funcionário encontrado.</div>
      ) : (
        Array.from(grouped.entries()).map(([letter, emps]) => (
          <div key={letter} className={styles.letterSection}>
            <div className={styles.letterDivider}>
              <span className={styles.letterLabel}>{letter}</span>
            </div>
            <div className={styles.grid}>
              {emps.map((emp) => (
                <div key={emp.id} className={styles.card} onClick={() => setViewEmployee(emp)}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardAvatar}>{emp.name.charAt(0)}</div>
                    <div className={styles.cardInfo}>
                      <p className={styles.cardName}>{emp.name}</p>
                      <p className={styles.cardRole}>{roleLabels[emp.role]}</p>
                    </div>
                    <Badge variant={statusConfig[emp.status].color}>{statusConfig[emp.status].label}</Badge>
                  </div>
                  <div className={styles.cardDetails}>
                    {emp.phone && (
                      <div className={styles.detailRow}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.38A2 2 0 0 1 3.54 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6.14 6.14l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        {emp.phone}
                      </div>
                    )}
                    {emp.address && (
                      <div className={styles.detailRow}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {emp.address}
                      </div>
                    )}
                  </div>
                  {emp.availableDays && emp.availableDays.length > 0 && (
                    <div className={styles.cardDays}>
                      {DAYS.filter((d) => emp.availableDays!.includes(d)).map((d) => (
                        <span key={d} className={styles.dayTag}>{DAY_LABELS[d]}</span>
                      ))}
                    </div>
                  )}
                  <div className={styles.cardActions}>
                    <button className={styles.btnEdit} onClick={(e) => { e.stopPropagation(); openEdit(emp); }}>Editar</button>
                    <button className={styles.btnDelete} onClick={(e) => { e.stopPropagation(); setDeleteTargetId(emp.id); }}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ── Create / Edit modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nome *</label>
                  <input className={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cargo</label>
                  <select className={styles.input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Employee['role'] })}>
                    {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Telefone (WhatsApp)</label>
                  <input className={styles.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(11) 99999-9999" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Status</label>
                  <select className={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Employee['status'] })}>
                    <option value="ativo">Ativo</option>
                    <option value="ferias">Férias</option>
                    <option value="afastado">Afastado</option>
                    <option value="desligado">Desligado</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>CPF</label>
                  <input className={styles.input} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>RG</label>
                  <input className={styles.input} value={form.rg} onChange={(e) => setForm({ ...form, rg: formatRG(e.target.value) })} placeholder="00.000.000-0" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Endereço</label>
                <input className={styles.input} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, bairro, cidade" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Chave Pix</label>
                <input className={styles.input} value={form.pixKey} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} placeholder="CPF, e-mail, telefone ou chave aleatória" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Observação</label>
                <textarea className={`${styles.input} ${styles.textarea}`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anotações sobre o funcionário..." rows={3} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Dias Disponíveis</label>
                <div className={styles.dayPicker}>
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`${styles.dayBtn} ${form.availableDays.includes(day) ? styles.dayBtnActive : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={closeModal}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={!form.name}>
                {editingId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail modal ──────────────────────────────────────────────────── */}
      {viewEmployee && (
        <div className={styles.overlay} onClick={() => setViewEmployee(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.detailHeaderInfo}>
                <h2 className={styles.modalTitle}>{viewEmployee.name}</h2>
                <div className={styles.detailHeaderBadges}>
                  <Badge variant="blue">{roleLabels[viewEmployee.role]}</Badge>
                  <Badge variant={statusConfig[viewEmployee.status].color}>{statusConfig[viewEmployee.status].label}</Badge>
                </div>
              </div>
              <button className={styles.modalClose} onClick={() => setViewEmployee(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Telefone (WhatsApp)</span>
                  <span>{viewEmployee.phone || '—'}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>CPF</span>
                  <span>{viewEmployee.cpf || '—'}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>RG</span>
                  <span>{viewEmployee.rg || '—'}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Chave Pix</span>
                  <span>{viewEmployee.pixKey || '—'}</span>
                </div>
                <div className={`${styles.detailField} ${styles.detailFieldFull}`}>
                  <span className={styles.detailFieldLabel}>Endereço</span>
                  <span>{viewEmployee.address || '—'}</span>
                </div>
                <div className={`${styles.detailField} ${styles.detailFieldFull}`}>
                  <span className={styles.detailFieldLabel}>Observação</span>
                  <span>{viewEmployee.notes || '—'}</span>
                </div>
                <div className={`${styles.detailField} ${styles.detailFieldFull}`}>
                  <span className={styles.detailFieldLabel}>Dias Disponíveis</span>
                  {viewEmployee.availableDays && viewEmployee.availableDays.length > 0 ? (
                    <div className={styles.detailDays}>
                      {DAYS.filter((d) => viewEmployee.availableDays!.includes(d)).map((d) => (
                        <span key={d} className={styles.dayTag}>{DAY_LABELS[d]}</span>
                      ))}
                    </div>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setViewEmployee(null)}>Fechar</button>
              <button className={styles.btnPrimary} onClick={() => { setViewEmployee(null); openEdit(viewEmployee); }}>
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Info modal ────────────────────────────────────────────────────── */}
      {showInfo && (
        <div className={styles.overlay} onClick={() => setShowInfo(false)}>
          <div className={styles.modal} style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Sobre Funcionários</h2>
              <button className={styles.modalClose} onClick={() => setShowInfo(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>O que é esta página?</p>
                <p className={styles.infoText}>Cadastre e gerencie toda a sua equipe — pizzaiolos, garçons, entregadores, gerentes e mais. Consulte informações de contato, documentos e disponibilidade de cada colaborador.</p>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Como cadastrar um funcionário</p>
                <ol className={styles.infoList}>
                  <li>Clique em <strong>Novo Funcionário</strong></li>
                  <li>Preencha nome, cargo e telefone (WhatsApp)</li>
                  <li>Adicione CPF, RG, endereço e chave Pix se desejar</li>
                  <li>Use o campo <strong>Observação</strong> para anotações internas</li>
                  <li>Selecione os <strong>dias disponíveis</strong> do colaborador</li>
                </ol>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Dias disponíveis</p>
                <p className={styles.infoText}>O seletor de dias mostra quais dias da semana o funcionário está disponível para trabalhar. Clique em cada dia para ativar ou desativar — os selecionados aparecem em verde no card.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      {deleteTargetId && (
        <ConfirmModal
          title="Excluir Funcionário"
          message={<>Tem certeza que deseja excluir <strong>{employees.find((e) => e.id === deleteTargetId)?.name}</strong>? Esta ação não pode ser desfeita.</>}
          confirmLabel="Excluir"
          variant="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
