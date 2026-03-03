import { useState, useMemo } from 'react';
import type { Utensil } from '@backend/infra/data/mockData';
import { mockUtensils } from '@backend/infra/data/mockData';
import Badge from '@frontend/components/Badge/Badge';
import styles from './EstoqueUtensilios.module.scss';
import ConfirmModal from '@frontend/components/ConfirmModal/ConfirmModal';

const statusConfig: Record<Utensil['status'], { label: string; color: 'green' | 'blue' | 'amber' | 'gray' }> = {
  disponivel: { label: 'Disponivel', color: 'green' },
  em_uso: { label: 'Em Uso', color: 'blue' },
  manutencao: { label: 'Manutencao', color: 'amber' },
  descartado: { label: 'Descartado', color: 'gray' },
};

type FormData = {
  name: string;
  category: string;
  quantity: string;
  location: string;
  status: Utensil['status'];
};

const emptyForm: FormData = { name: '', category: '', quantity: '1', location: '', status: 'disponivel' };

export default function EstoqueUtensilios() {
  const [utensils, setUtensils] = useState<Utensil[]>(mockUtensils);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      utensils.filter((u) => {
        if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.category.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== 'all' && u.status !== statusFilter) return false;
        return true;
      }),
    [utensils, search, statusFilter],
  );

  const availableCount = utensils.filter((u) => u.status === 'disponivel').length;
  const maintenanceCount = utensils.filter((u) => u.status === 'manutencao').length;

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (u: Utensil) => {
    setForm({ name: u.name, category: u.category, quantity: String(u.quantity), location: u.location, status: u.status });
    setEditingId(u.id);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = () => {
    if (!form.name) return;
    const data: Omit<Utensil, 'id' | 'createdAt'> = {
      name: form.name, category: form.category, quantity: Number(form.quantity) || 1, location: form.location, status: form.status,
    };
    if (editingId) {
      setUtensils((prev) => prev.map((u) => u.id === editingId ? { ...u, ...data } : u));
    } else {
      setUtensils((prev) => [...prev, { ...data, id: `ute-${Date.now()}`, createdAt: new Date().toISOString() }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => { setDeleteTargetId(id); };
  const confirmDelete = () => {
    if (deleteTargetId) setUtensils((prev) => prev.filter((u) => u.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Estoque de Utensilios</h1>
          <p className={styles.subtitle}>Controle equipamentos, ferramentas e utensilios</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Utensilio
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.blue}`}>
          <div className={styles.kpiLabel}>Total de Itens</div>
          <div className={styles.kpiValue}>{utensils.length}</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.green}`}>
          <div className={styles.kpiLabel}>Disponiveis</div>
          <div className={styles.kpiValue}>{availableCount}</div>
        </div>
        <div className={`${styles.kpiCard} ${maintenanceCount > 0 ? styles.amber : styles.green}`}>
          <div className={styles.kpiLabel}>Em Manutencao</div>
          <div className={styles.kpiValue}>{maintenanceCount}</div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className={styles.searchInput} placeholder="Buscar utensilios..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos os status</option>
          <option value="disponivel">Disponivel</option>
          <option value="em_uso">Em Uso</option>
          <option value="manutencao">Manutencao</option>
          <option value="descartado">Descartado</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Nenhum utensilio encontrado.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((u) => (
            <div key={u.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <div className={styles.cardInfo}>
                  <p className={styles.cardName}>{u.name}</p>
                  <p className={styles.cardCategory}>{u.category}</p>
                </div>
                <Badge variant={statusConfig[u.status].color}>{statusConfig[u.status].label}</Badge>
              </div>
              <div className={styles.cardDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Qtd:</span>
                  <span>{u.quantity} un</span>
                </div>
                {u.location && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Local:</span>
                    <span>{u.location}</span>
                  </div>
                )}
              </div>
              <div className={styles.cardActions}>
                <button className={styles.btnEdit} onClick={() => openEdit(u)}>Editar</button>
                <button className={styles.btnDelete} onClick={() => handleDelete(u.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Editar Utensilio' : 'Novo Utensilio'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nome *</label>
                  <input className={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Forno a Lenha 120cm" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Categoria</label>
                  <input className={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Fornos" />
                </div>
              </div>
              <div className={styles.formGrid3}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Quantidade</label>
                  <input className={styles.input} type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Localizacao</label>
                  <input className={styles.input} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex: Deposito" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Status</label>
                  <select className={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Utensil['status'] })}>
                    <option value="disponivel">Disponivel</option>
                    <option value="em_uso">Em Uso</option>
                    <option value="manutencao">Manutencao</option>
                    <option value="descartado">Descartado</option>
                  </select>
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
      {deleteTargetId && (
        <ConfirmModal
          title="Excluir Utensílio"
          message={<>Tem certeza que deseja excluir <strong>{utensils.find((u) => u.id === deleteTargetId)?.name}</strong>? Esta ação não pode ser desfeita.</>}
          confirmLabel="Excluir"
          variant="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
