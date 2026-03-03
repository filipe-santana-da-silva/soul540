import { useState, useMemo } from 'react';
import type { Supply } from '@backend/infra/data/mockData';
import { mockSupplies } from '@backend/infra/data/mockData';
import Badge from '@frontend/components/Badge/Badge';
import styles from './EstoqueInsumos.module.scss';
import ConfirmModal from '@frontend/components/ConfirmModal/ConfirmModal';

const statusConfig: Record<Supply['status'], { label: string; color: 'green' | 'amber' | 'red' | 'gray' }> = {
  em_estoque: { label: 'Em Estoque', color: 'green' },
  estoque_baixo: { label: 'Estoque Baixo', color: 'amber' },
  sem_estoque: { label: 'Sem Estoque', color: 'red' },
  vencido: { label: 'Vencido', color: 'gray' },
};

type FormData = {
  name: string;
  category: string;
  unit: string;
  quantity: string;
  minStock: string;
  costPerUnit: string;
  supplier: string;
  expirationDate: string;
  status: Supply['status'];
};

const emptyForm: FormData = {
  name: '', category: '', unit: 'kg', quantity: '', minStock: '', costPerUnit: '', supplier: '', expirationDate: '', status: 'em_estoque',
};

function calcStatus(qty: number, min: number, expDate?: string): Supply['status'] {
  if (expDate && new Date(expDate) < new Date()) return 'vencido';
  if (qty === 0) return 'sem_estoque';
  if (qty <= min) return 'estoque_baixo';
  return 'em_estoque';
}

export default function EstoqueInsumos() {
  const [supplies, setSupplies] = useState<Supply[]>(mockSupplies);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      supplies.filter((s) => {
        if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.category.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        return true;
      }),
    [supplies, search, statusFilter],
  );

  const lowStockCount = supplies.filter((s) => s.status === 'estoque_baixo' || s.status === 'sem_estoque').length;
  const totalValue = supplies.reduce((acc, s) => acc + s.quantity * s.costPerUnit, 0);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (s: Supply) => {
    setForm({ name: s.name, category: s.category, unit: s.unit, quantity: String(s.quantity), minStock: String(s.minStock), costPerUnit: String(s.costPerUnit), supplier: s.supplier, expirationDate: s.expirationDate || '', status: s.status });
    setEditingId(s.id);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = () => {
    if (!form.name) return;
    const qty = Number(form.quantity) || 0;
    const min = Number(form.minStock) || 0;
    const status = calcStatus(qty, min, form.expirationDate || undefined);
    const data: Omit<Supply, 'id' | 'createdAt'> = {
      name: form.name, category: form.category, unit: form.unit, quantity: qty, minStock: min,
      costPerUnit: Number(form.costPerUnit) || 0, supplier: form.supplier,
      expirationDate: form.expirationDate || undefined, status,
    };
    if (editingId) {
      setSupplies((prev) => prev.map((s) => s.id === editingId ? { ...s, ...data } : s));
    } else {
      setSupplies((prev) => [...prev, { ...data, id: `sup-${Date.now()}`, createdAt: new Date().toISOString() }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => { setDeleteTargetId(id); };
  const confirmDelete = () => {
    if (deleteTargetId) setSupplies((prev) => prev.filter((s) => s.id !== deleteTargetId));
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
          <h1 className={styles.title}>Estoque de Insumos</h1>
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

      {filtered.length === 0 ? (
        <div className={styles.empty}>Nenhum insumo encontrado.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((s) => (
            <div key={s.id} className={`${styles.card} ${s.status === 'estoque_baixo' || s.status === 'sem_estoque' ? styles.cardAlert : ''}`}>
              <div className={styles.cardTop}>
                <div>
                  <p className={styles.cardName}>{s.name}</p>
                  <p className={styles.cardCategory}>{s.category}</p>
                </div>
                <Badge variant={statusConfig[s.status].color}>{statusConfig[s.status].label}</Badge>
              </div>
              <div className={styles.cardStats}>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>{s.quantity} {s.unit}</span>
                  <span className={styles.statLbl}>Quantidade</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>{s.minStock} {s.unit}</span>
                  <span className={styles.statLbl}>Estoque Min.</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>R$ {s.costPerUnit.toFixed(2)}</span>
                  <span className={styles.statLbl}>Custo/{s.unit}</span>
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
                <button className={styles.btnEdit} onClick={() => openEdit(s)}>Editar</button>
                <button className={styles.btnDelete} onClick={() => handleDelete(s.id)}>Excluir</button>
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
                  <input className={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Massas" />
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
                  <select className={styles.input} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
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
                  <input className={styles.input} type="number" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} placeholder="0.00" />
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
    </div>
  );
}
