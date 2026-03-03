import { useState, useMemo, useRef, useEffect } from 'react';
import type { Contractor } from '@backend/infra/data/mockData';
import Badge from '@frontend/components/Badge/Badge';
import ConfirmModal from '@frontend/components/ConfirmModal/ConfirmModal';
import styles from './Contratantes.module.scss';

const statusConfig: Record<Contractor['status'], { label: string; color: 'green' | 'gray' | 'red' }> = {
  ativo:     { label: 'Ativo',     color: 'green' },
  inativo:   { label: 'Inativo',   color: 'gray' },
  bloqueado: { label: 'Bloqueado', color: 'red' },
};

// Legacy slug → label for existing mock data
const categoryLabels: Record<string, string> = {
  aniversario: 'Aniversário', casamento: 'Casamento', corporativo: 'Corporativo',
  formatura: 'Formatura', confraternizacao: 'Confraternização', festival: 'Festival', outro: 'Outro',
};

function displayCategory(cat: string): string {
  return categoryLabels[cat] ?? cat;
}

// ── Phone mask ────────────────────────────────────────────────────────────────
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (!d.length)    return '';
  if (d.length <= 2)  return `(${d}`;
  if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ── Document mask ─────────────────────────────────────────────────────────────
function formatDocument(raw: string, type: string): string {
  const d = raw.replace(/\D/g, '');
  if (type === 'CPF') {
    const n = d.slice(0, 11);
    if (n.length <= 3) return n;
    if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
    if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
  }
  if (type === 'CNPJ') {
    const n = d.slice(0, 14);
    if (n.length <= 2)  return n;
    if (n.length <= 5)  return `${n.slice(0, 2)}.${n.slice(2)}`;
    if (n.length <= 8)  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
    if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`;
    return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
  }
  if (type === 'RG') {
    const n = d.slice(0, 9);
    if (n.length <= 2) return n;
    if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`;
    if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
    return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}-${n.slice(8)}`;
  }
  return raw;
}

type FormData = {
  name: string;
  type: Contractor['type'];
  document: string;
  documentType: string;
  email: string;
  phone: string;
  address: string;
  maritalStatus: string;
  profession: string;
  category: string;
  status: Contractor['status'];
};

const emptyForm: FormData = {
  name: '', type: 'pessoa_fisica', document: '', documentType: '',
  email: '', phone: '', address: '', maritalStatus: '',
  profession: '', category: '', status: 'ativo',
};

export default function Contratantes() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [showCatModal, setShowCatModal] = useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = useState<string | null>(null);
  const catInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewContractor, setViewContractor] = useState<Contractor | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    fetch('/api/contractors')
      .then(r => r.json())
      .then(setContractors)
      .finally(() => setLoading(false));
    fetch('/api/contractor-categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (showCatModal) catInputRef.current?.focus();
  }, [showCatModal]);

  const filtered = useMemo(
    () =>
      contractors.filter((c) => {
        if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (typeFilter !== 'all' && c.type !== typeFilter) return false;
        if (selectedCategory && displayCategory(c.category ?? '') !== selectedCategory) return false;
        return true;
      }),
    [contractors, search, statusFilter, typeFilter, selectedCategory],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Contractor[]>();
    [...filtered]
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .forEach((c) => {
        const letter = c.name[0]?.toUpperCase() ?? '#';
        if (!map.has(letter)) map.set(letter, []);
        map.get(letter)!.push(c);
      });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  }, [filtered]);

  const totalActive = contractors.filter((c) => c.status === 'ativo').length;

  const addCategory = async () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      await fetch('/api/contractor-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      setCategories((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    }
    setNewCategory('');
    setShowCatModal(false);
  };

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };

  const openEdit = (c: Contractor) => {
    setForm({
      name: c.name, type: c.type, document: c.document,
      documentType: c.documentType || '', email: c.email, phone: c.phone,
      address: c.address || '', maritalStatus: c.maritalStatus || '',
      profession: c.profession || '', category: c.category || '',
      status: c.status,
    });
    setEditingId(c.id);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = async () => {
    if (!form.name) return;
    const existing = editingId ? contractors.find((c) => c.id === editingId) : undefined;
    const data: Omit<Contractor, 'id' | 'createdAt'> = {
      name: form.name, type: form.type,
      document: form.document,
      documentType: (form.documentType as Contractor['documentType']) || undefined,
      email: form.email, phone: form.phone,
      address: form.address || undefined,
      maritalStatus: (form.maritalStatus as Contractor['maritalStatus']) || undefined,
      profession: form.profession || undefined,
      category: form.category || undefined,
      status: form.status,
      totalRevenue: existing?.totalRevenue ?? 0,
    };
    if (editingId) {
      const res = await fetch(`/api/contractors/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      const updated = await res.json();
      setContractors((prev) => prev.map((c) => c.id === editingId ? updated : c));
    } else {
      const res = await fetch('/api/contractors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      const created = await res.json();
      setContractors((prev) => [...prev, created]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => setDeleteTargetId(id);
  const confirmDelete = async () => {
    if (deleteTargetId) {
      await fetch(`/api/contractors/${deleteTargetId}`, { method: 'DELETE' });
      setContractors((prev) => prev.filter((c) => c.id !== deleteTargetId));
    }
    setDeleteTargetId(null);
  };

  const isPF = form.type === 'pessoa_fisica';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Contratantes</h1>
            <button className={styles.btnInfo} onClick={() => setShowInfo(true)} title="Como usar esta página">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
          </div>
          <p className={styles.subtitle}>Gerencie clientes e contratantes</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Contratante
        </button>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.blue}`}>
          <div className={styles.kpiLabel}>Total</div>
          <div className={styles.kpiValue}>{contractors.length}</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.green}`}>
          <div className={styles.kpiLabel}>Ativos</div>
          <div className={styles.kpiValue}>{totalActive}</div>
        </div>
      </div>

      {/* Categorias */}
      <div className={styles.categoriesSection}>
        <p className={styles.categoriesTitle}>Categorias</p>
        <div className={styles.categoriesGrid}>
          {categories.map((cat) => {
            const count = contractors.filter((c) => (c.category ?? '') === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <div
                key={cat}
                className={`${styles.catCard} ${isActive ? styles.catCardActive : ''}`}
                onClick={() => setSelectedCategory(isActive ? null : cat)}
              >
                <div className={styles.catCardTop}>
                  <span className={styles.catCardName}>{cat}</span>
                  <button
                    className={styles.catCardDelete}
                    onClick={(e) => { e.stopPropagation(); setDeleteCatTarget(cat); }}
                    title="Remover"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <span className={styles.catCardCount}>{count} contratante{count !== 1 ? 's' : ''}</span>
              </div>
            );
          })}
          <button className={styles.catCardAdd} onClick={() => setShowCatModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Nova categoria</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className={styles.searchInput} placeholder="Buscar contratantes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="bloqueado">Bloqueado</option>
        </select>
        <select className={styles.select} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">Todos os tipos</option>
          <option value="pessoa_fisica">Pessoa Física</option>
          <option value="pessoa_juridica">Pessoa Jurídica</option>
        </select>
      </div>

      {/* Lista alfabética */}
      {loading ? (
        <div className={styles.empty}>Carregando...</div>
      ) : grouped.length === 0 ? (
        <div className={styles.empty}>Nenhum contratante encontrado.</div>
      ) : (
        grouped.map(([letter, group]) => (
          <div key={letter} className={styles.letterSection}>
            <div className={styles.letterDivider}>
              <span className={styles.letterLabel}>{letter}</span>
            </div>
            <div className={styles.grid}>
              {group.map((c) => (
                <div key={c.id} className={styles.card} onClick={() => setViewContractor(c)}>
                  <div className={styles.cardHeader}>
                    <p className={styles.cardName}>{c.name}</p>
                    <div className={styles.cardActions}>
                      <button className={styles.btnIcon} onClick={(e) => { e.stopPropagation(); openEdit(c); }} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className={`${styles.btnIcon} ${styles.btnIconDanger}`} onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} title="Excluir">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>
                  {c.phone && (
                    <div className={styles.cardDetail}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className={styles.cardDetail}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <span>{c.email}</span>
                    </div>
                  )}
                  {c.category && (
                    <div className={styles.cardCategory}>
                      <Badge variant="gray">{displayCategory(c.category)}</Badge>
                      <Badge variant={statusConfig[c.status].color}>{statusConfig[c.status].label}</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal add/edit */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Editar Contratante' : 'Adicionar Contratante'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tipo de pessoa</label>
                <select
                  className={styles.input}
                  value={form.type}
                  onChange={(e) => {
                    const newType = e.target.value as Contractor['type'];
                    setForm({ ...form, type: newType, maritalStatus: '', profession: '', documentType: newType === 'pessoa_juridica' ? 'CNPJ' : '', document: '' });
                  }}
                >
                  <option value="pessoa_fisica">Pessoa Física</option>
                  <option value="pessoa_juridica">Pessoa Jurídica</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>{isPF ? 'Nome do responsável *' : 'Nome da empresa / Razão social *'}</label>
                <input className={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isPF ? 'Ex: Fernanda' : 'Ex: Empresa ABC Ltda'} />
              </div>
              {isPF ? (
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Telefone</label>
                    <input className={styles.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(11) 91234-5678" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Endereço</label>
                    <input className={styles.input} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua das Flores, 123" />
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Telefone</label>
                    <input className={styles.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(11) 91234-5678" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Endereço</label>
                    <input className={styles.input} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua das Flores, 123" />
                  </div>
                </>
              )}
              {isPF && (
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Estado Civil</label>
                    <select className={styles.input} value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}>
                      <option value="">-- selecione --</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                      <option value="uniao_estavel">União Estável</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Profissão</label>
                    <input className={styles.input} value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} placeholder="Ex: Advogado, Médico" />
                  </div>
                </div>
              )}
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo de documento</label>
                  <select className={styles.input} value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value, document: '' })} disabled={!isPF}>
                    {isPF ? (
                      <><option value="">Selecione o tipo</option><option value="CPF">CPF</option><option value="RG">RG</option></>
                    ) : (
                      <option value="CNPJ">CNPJ</option>
                    )}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Número do documento</label>
                  <input
                    className={styles.input}
                    value={form.document}
                    onChange={(e) => setForm({ ...form, document: formatDocument(e.target.value, form.documentType) })}
                    placeholder={form.documentType === 'CNPJ' ? '00.000.000/0001-00' : form.documentType === 'RG' ? '00.000.000-0' : form.documentType === 'CPF' ? '000.000.000-00' : 'Selecione o tipo primeiro'}
                    disabled={!form.documentType}
                  />
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Categoria</label>
                  <select className={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Selecione uma categoria</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Status</label>
                  <select className={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Contractor['status'] })}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={closeModal}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={!form.name}>
                {editingId ? 'Salvar alterações' : 'Cadastrar Contratante'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar exclusão de contratante */}
      {deleteTargetId && (
        <ConfirmModal
          title="Excluir contratante"
          message={<>Tem certeza que deseja excluir <strong>{contractors.find((c) => c.id === deleteTargetId)?.name}</strong>? Esta ação não pode ser desfeita.</>}
          confirmLabel="Excluir"
          variant="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      )}

      {/* Detalhes do contratante */}
      {viewContractor && (() => {
        const vc = viewContractor;
        const maritalLabels: Record<string, string> = {
          solteiro: 'Solteiro(a)', casado: 'Casado(a)', divorciado: 'Divorciado(a)',
          viuvo: 'Viúvo(a)', uniao_estavel: 'União Estável',
        };
        const isPFView = vc.type === 'pessoa_fisica';
        const df = (label: string, value: string, full = false) => (
          <div className={`${styles.detailField} ${full ? styles.detailFieldFull : ''}`}>
            <span className={styles.detailFieldLabel}>{label}</span>
            <span>{value}</span>
          </div>
        );
        return (
          <div className={styles.overlay} onClick={() => setViewContractor(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div className={styles.detailHeaderInfo}>
                  <h2 className={styles.modalTitle}>{vc.name}</h2>
                  <div className={styles.detailHeaderBadges}>
                    <Badge variant={vc.type === 'pessoa_juridica' ? 'blue' : 'gray'}>
                      {vc.type === 'pessoa_juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                    </Badge>
                    <Badge variant={statusConfig[vc.status].color}>{statusConfig[vc.status].label}</Badge>
                  </div>
                </div>
                <button className={styles.modalClose} onClick={() => setViewContractor(null)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.detailGrid}>
                  {vc.phone    ? df('Telefone', vc.phone)                                       : df('Telefone', '—')}
                  {vc.email    ? df('E-mail', vc.email)                                         : df('E-mail', '—')}
                  {vc.address  ? df('Endereço', vc.address, true)                               : df('Endereço', '—', true)}
                  {vc.documentType ? df('Tipo de documento', vc.documentType)                   : df('Tipo de documento', '—')}
                  {vc.document ? df('Número do documento', vc.document)                         : df('Número do documento', '—')}
                  {vc.category ? df('Categoria', displayCategory(vc.category))                  : df('Categoria', '—')}
                  {isPFView && (vc.profession   ? df('Profissão', vc.profession)                : df('Profissão', '—'))}
                  {isPFView && (vc.maritalStatus ? df('Estado Civil', maritalLabels[vc.maritalStatus] ?? vc.maritalStatus) : df('Estado Civil', '—'))}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.btnCancel} onClick={() => setViewContractor(null)}>Fechar</button>
                <button className={styles.btnPrimary} onClick={() => { setViewContractor(null); openEdit(vc); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal nova categoria */}
      {showCatModal && (
        <div className={styles.overlay} onClick={() => { setShowCatModal(false); setNewCategory(''); }}>
          <div className={styles.modal} style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nova Categoria</h2>
              <button className={styles.modalClose} onClick={() => { setShowCatModal(false); setNewCategory(''); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nome da categoria</label>
                <input
                  ref={catInputRef}
                  className={styles.input}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') { setShowCatModal(false); setNewCategory(''); } }}
                  placeholder="Ex: Corporativo, Casamento..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => { setShowCatModal(false); setNewCategory(''); }}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={addCategory} disabled={!newCategory.trim()}>Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar exclusão de categoria */}
      {deleteCatTarget && (
        <ConfirmModal
          title="Remover categoria"
          message={<>Tem certeza que deseja remover a categoria <strong>{deleteCatTarget}</strong>?</>}
          confirmLabel="Remover"
          variant="danger"
          onConfirm={async () => {
            await fetch('/api/contractor-categories', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: deleteCatTarget }),
            });
            setCategories((prev) => prev.filter((c) => c !== deleteCatTarget));
            setDeleteCatTarget(null);
          }}
          onClose={() => setDeleteCatTarget(null)}
        />
      )}
      {/* Modal de informações */}
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
                  A página de <strong>Contratantes</strong> centraliza todos os seus clientes e parceiros. Aqui você pode cadastrar, editar, visualizar e excluir contratantes, além de organizá-los por categorias personalizadas.
                </p>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Como criar um contratante</p>
                <ol className={styles.infoList}>
                  <li>Clique no botão <strong>Novo Contratante</strong> no canto superior direito.</li>
                  <li>Selecione o tipo: <strong>Pessoa Física</strong> ou <strong>Pessoa Jurídica</strong>.</li>
                  <li>Preencha os dados: nome, telefone, endereço, documento e categoria.</li>
                  <li>Clique em <strong>Cadastrar Contratante</strong> para salvar.</li>
                </ol>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Como criar uma categoria</p>
                <ol className={styles.infoList}>
                  <li>Na seção <strong>Categorias de Contratantes</strong>, clique em <strong>Nova Categoria</strong>.</li>
                  <li>Digite o nome da categoria e clique em <strong>Adicionar</strong>.</li>
                  <li>A categoria ficará disponível como filtro e no formulário de contratante.</li>
                  <li>Para remover, clique no ícone de lixeira ao lado da categoria.</li>
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
    </div>
  );
}
