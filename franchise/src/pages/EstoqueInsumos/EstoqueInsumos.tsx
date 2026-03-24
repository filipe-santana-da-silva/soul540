import { useState, useMemo, useRef, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

type Supply = {
  id: string;
  name: string;
  category: string;
  unit?: string;
  measureUnit?: string;
  quantity: number;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  expirationDate?: string;
  status: 'em_estoque' | 'estoque_baixo' | 'sem_estoque' | 'vencido';
  createdAt: string;
};

import Badge from '@/components/Badge/Badge';
import styles from './EstoqueInsumos.module.scss';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';

function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  const reais = Math.floor(num / 100);
  const centavos = num % 100;
  return `R$ ${reais.toLocaleString('pt-BR')},${String(centavos).padStart(2, '0')}`;
}

function parseCurrency(value: string): number {
  return Number(value.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
}

const statusConfig: Record<Supply['status'], { label: string; color: 'green' | 'amber' | 'red' | 'gray' }> = {
  em_estoque: { label: 'Em Estoque', color: 'green' },
  estoque_baixo: { label: 'Estoque Baixo', color: 'amber' },
  sem_estoque: { label: 'Sem Estoque', color: 'red' },
  vencido: { label: 'Vencido', color: 'gray' },
};

type FormData = {
  name: string;
  category: string;
  measureUnit: string;
  quantity: string;
  minStock: string;
  costPerUnit: string;
  supplier: string;
  expirationDate: string;
  status: Supply['status'];
};

const emptyForm: FormData = {
  name: '', category: '', measureUnit: 'kg', quantity: '', minStock: '', costPerUnit: '', supplier: '', expirationDate: '', status: 'em_estoque',
};

function calcStatus(qty: number, min: number, expDate?: string): Supply['status'] {
  if (expDate && new Date(expDate) < new Date()) return 'vencido';
  if (qty === 0) return 'sem_estoque';
  if (qty <= min) return 'estoque_baixo';
  return 'em_estoque';
}

export default function EstoqueInsumos() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    apiFetch('/api/supplies').then(r => r.json()).then(setSupplies).finally(() => setLoading(false));
    apiFetch('/api/supply-categories').then(r => r.json()).then(setCategories).catch(() => {});
  }, []);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [deleteCatTarget, setDeleteCatTarget] = useState<string | null>(null);
  const catInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<Supply | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => { if (showCatModal) catInputRef.current?.focus(); }, [showCatModal]);

  const filtered = useMemo(
    () =>
      supplies.filter((s) => {
        if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.category.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        if (selectedCategory && s.category !== selectedCategory) return false;
        return true;
      }),
    [supplies, search, statusFilter, selectedCategory],
  );

  const lowStockCount = supplies.filter((s) => s.status === 'estoque_baixo' || s.status === 'sem_estoque').length;
  const totalValue = supplies.reduce((acc, s) => acc + s.quantity * s.costPerUnit, 0);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (s: Supply) => {
    setForm({ name: s.name, category: s.category, measureUnit: s.measureUnit ?? s.unit ?? '', quantity: String(s.quantity), minStock: String(s.minStock), costPerUnit: s.costPerUnit ? formatCurrency(String(Math.round(s.costPerUnit * 100))) : '', supplier: s.supplier, expirationDate: s.expirationDate || '', status: s.status });
    setEditingId(s.id);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = async () => {
    if (!form.name) return;
    const qty = Number(form.quantity) || 0;
    const min = Number(form.minStock) || 0;
    const status = calcStatus(qty, min, form.expirationDate || undefined);
    const data = {
      name: form.name, category: form.category, measureUnit: form.measureUnit, quantity: qty, minStock: min,
      costPerUnit: parseCurrency(form.costPerUnit), supplier: form.supplier,
      expirationDate: form.expirationDate || undefined, status,
    };
    if (editingId) {
      const res = await apiFetch(`/api/supplies/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const updated = await res.json();
      setSupplies((prev) => prev.map((s) => s.id === editingId ? updated : s));
    } else {
      const res = await apiFetch('/api/supplies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const created = await res.json();
      setSupplies((prev) => [...prev, created]);
    }
    closeModal();
  };

  const addCategory = async () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      await apiFetch('/api/supply-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: trimmed }) });
      setCategories((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    }
    setNewCategory('');
    setShowCatModal(false);
  };

  const handleDelete = (id: string) => { setDeleteTargetId(id); };
  const confirmDelete = async () => {
    if (deleteTargetId) {
      await apiFetch(`/api/supplies/${deleteTargetId}`, { method: 'DELETE' });
      setSupplies((prev) => prev.filter((s) => s.id !== deleteTargetId));
    }
    setDeleteTargetId(null);
  };

  const isExpiringSoon = (expDate?: string) => {
    if (!expDate) return false;
    const diff = new Date(expDate).getTime() - new Date().getTime();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Estoque de Insumos</h1>
            <button className={styles.btnInfo} onClick={() => setShowInfo(true)} title="Como usar esta página">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
          </div>
          <p className={styles.subtitle}>Controle ingredientes, embalagens e materiais</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Insumo
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.blue}`}>
          <div className={styles.kpiLabel}>Total de Itens</div>
          <div className={styles.kpiValue}>{supplies.length}</div>
        </div>
        <div className={`${styles.kpiCard} ${lowStockCount > 0 ? styles.red : styles.green}`}>
          <div className={styles.kpiLabel}>Alertas de Estoque</div>
          <div className={styles.kpiValue}>{lowStockCount}</div>
          <div className={styles.kpiSub}>{lowStockCount > 0 ? 'requerem atencao' : 'tudo em ordem'}</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.amber}`}>
          <div className={styles.kpiLabel}>Valor em Estoque</div>
          <div className={styles.kpiValue}>R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className={styles.categoriesSection}>
        <p className={styles.categoriesTitle}>Categorias</p>
        <div className={styles.categoriesGrid}>
          {categories.map((cat) => {
            const count = supplies.filter((s) => s.category === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <div key={cat} className={`${styles.catCard} ${isActive ? styles.catCardActive : ''}`} onClick={() => setSelectedCategory(isActive ? null : cat)}>
                <div className={styles.catCardTop}>
                  <span className={styles.catCardName}>{cat}</span>
                  <button className={styles.catCardDelete} onClick={(e) => { e.stopPropagation(); setDeleteCatTarget(cat); }} title="Remover">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <span className={styles.catCardCount}>{count} item{count !== 1 ? 's' : ''}</span>
              </div>
            );
          })}
          <button className={styles.catCardAdd} onClick={() => setShowCatModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Nova categoria</span>
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className={styles.searchInput} placeholder="Buscar insumos..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos os status</option>
          <option value="em_estoque">Em Estoque</option>
          <option value="estoque_baixo">Estoque Baixo</option>
          <option value="sem_estoque">Sem Estoque</option>
          <option value="vencido">Vencido</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.empty}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Nenhum insumo encontrado.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((s) => (
            <div key={s.id} className={`${styles.card} ${s.status === 'estoque_baixo' || s.status === 'sem_estoque' ? styles.cardAlert : ''}`} onClick={() => setViewingItem(s)} style={{ cursor: 'pointer' }}>
              <div className={styles.cardTop}>
                <div>
                  <p className={styles.cardName}>{s.name}</p>
                  <p className={styles.cardCategory}>{s.category}</p>
                </div>
                <Badge variant={statusConfig[s.status].color}>{statusConfig[s.status].label}</Badge>
              </div>
              <div className={styles.cardStats}>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>{s.quantity} {s.measureUnit}</span>
                  <span className={styles.statLbl}>Quantidade</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>{s.minStock} {s.measureUnit}</span>
                  <span className={styles.statLbl}>Estoque Min.</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>R$ {s.costPerUnit.toFixed(2)}</span>
                  <span className={styles.statLbl}>Custo/{s.measureUnit}</span>
                </div>
              </div>
              {s.expirationDate && (
                <div className={`${styles.expiration} ${isExpiringSoon(s.expirationDate) ? styles.expirationWarn : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Val: {new Date(s.expirationDate).toLocaleDateString('pt-BR')}
                  {isExpiringSoon(s.expirationDate) && ' (vencendo em breve!)'}
                </div>
              )}
              {s.supplier && <p className={styles.supplier}>Fornecedor: {s.supplier}</p>}
              <div className={styles.cardActions}>
                <button className={styles.btnEdit} onClick={(e) => { e.stopPropagation(); openEdit(s); }}>Editar</button>
                <button className={styles.btnDelete} onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Editar Insumo' : 'Novo Insumo'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nome *</label>
                  <input className={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Farinha de Trigo" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Categoria</label>
                  <select className={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Sem categoria</option>
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGrid3}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Quantidade</label>
                  <input className={styles.input} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Estoque Min.</label>
                  <input className={styles.input} type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} placeholder="0" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Unidade</label>
                  <select className={styles.input} value={form.measureUnit} onChange={(e) => setForm({ ...form, measureUnit: e.target.value })}>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="un">un</option>
                    <option value="cx">cx</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Custo por Unidade (R$)</label>
                  <input className={styles.input} type="text" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: formatCurrency(e.target.value) })} placeholder="R$ 0,00" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Fornecedor</label>
                  <input className={styles.input} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Nome do fornecedor" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Data de Validade</label>
                <input className={styles.input} type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} />
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
                <input ref={catInputRef} className={styles.input} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') { setShowCatModal(false); setNewCategory(''); } }} placeholder="Ex: Farinhas, Embalagens..." />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => { setShowCatModal(false); setNewCategory(''); }}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={addCategory} disabled={!newCategory.trim()}>Adicionar</button>
            </div>
          </div>
        </div>
      )}
      {deleteCatTarget && (
        <ConfirmModal
          title="Remover categoria"
          message={<>Tem certeza que deseja remover a categoria <strong>{deleteCatTarget}</strong>?</>}
          confirmLabel="Remover"
          variant="danger"
          onConfirm={async () => { await apiFetch('/api/supply-categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: deleteCatTarget }) }); setCategories((prev) => prev.filter((c) => c !== deleteCatTarget)); setDeleteCatTarget(null); }}
          onClose={() => setDeleteCatTarget(null)}
        />
      )}
      {viewingItem && (
        <div className={styles.overlay} onClick={() => setViewingItem(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{viewingItem.name}</h2>
              <button className={styles.modalClose} onClick={() => setViewingItem(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.viewGrid}>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Status</span>
                  <Badge variant={statusConfig[viewingItem.status].color}>{statusConfig[viewingItem.status].label}</Badge>
                </div>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Categoria</span>
                  <span className={styles.viewValue}>{viewingItem.category || '—'}</span>
                </div>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Quantidade</span>
                  <span className={styles.viewValue}>{viewingItem.quantity} {viewingItem.measureUnit}</span>
                </div>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Estoque Mínimo</span>
                  <span className={styles.viewValue}>{viewingItem.minStock} {viewingItem.measureUnit}</span>
                </div>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Custo por Unidade</span>
                  <span className={styles.viewValue}>R$ {viewingItem.costPerUnit.toFixed(2)}</span>
                </div>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Valor Total em Estoque</span>
                  <span className={styles.viewValue}>R$ {(viewingItem.quantity * viewingItem.costPerUnit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Fornecedor</span>
                  <span className={styles.viewValue}>{viewingItem.supplier || '—'}</span>
                </div>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Validade</span>
                  <span className={styles.viewValue}>
                    {viewingItem.expirationDate ? new Date(viewingItem.expirationDate).toLocaleDateString('pt-BR') : '—'}
                    {isExpiringSoon(viewingItem.expirationDate) && ' ⚠️ vencendo em breve'}
                  </span>
                </div>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Cadastrado em</span>
                  <span className={styles.viewValue}>{new Date(viewingItem.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setViewingItem(null)}>Fechar</button>
              <button className={styles.btnPrimary} onClick={() => { setViewingItem(null); openEdit(viewingItem); }}>Editar</button>
            </div>
          </div>
        </div>
      )}
      {deleteTargetId && (
        <ConfirmModal
          title="Excluir Insumo"
          message={<>Tem certeza que deseja excluir <strong>{supplies.find((s) => s.id === deleteTargetId)?.name}</strong>? Esta ação não pode ser desfeita.</>}
          confirmLabel="Excluir"
          variant="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
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
                  A página de <strong>Estoque de Insumos</strong> centraliza o controle de ingredientes, embalagens e materiais consumíveis. Acompanhe quantidades, alertas de estoque baixo e datas de validade.
                </p>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Como cadastrar um insumo</p>
                <ol className={styles.infoList}>
                  <li>Clique em <strong>Novo Insumo</strong> no canto superior direito.</li>
                  <li>Preencha nome, categoria, quantidade, unidade e estoque mínimo.</li>
                  <li>Adicione custo por unidade, fornecedor e validade se desejar.</li>
                  <li>Clique em <strong>Cadastrar Insumo</strong> para salvar.</li>
                </ol>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Alertas de estoque</p>
                <p className={styles.infoText}>Quando a quantidade ficar abaixo do estoque mínimo, o card ficará destacado em vermelho. Itens com validade próxima também recebem aviso.</p>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Como usar as categorias</p>
                <ol className={styles.infoList}>
                  <li>Na seção <strong>Categorias</strong>, clique em <strong>Nova Categoria</strong>.</li>
                  <li>Digite o nome e clique em <strong>Adicionar</strong>.</li>
                  <li>Clique em uma categoria para filtrar os insumos por ela.</li>
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
