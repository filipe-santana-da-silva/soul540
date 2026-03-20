import { useState, useMemo, useRef, useEffect } from 'react';
import type { Utensil } from '@backend/infra/data/mockData';
import Badge from '@frontend/components/Badge/Badge';
import styles from './EstoqueUtensilios.module.scss';
import ConfirmModal from '@frontend/components/ConfirmModal/ConfirmModal';

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
  unitValue: string;
  location: string;
  status: Utensil['status'];
};

const emptyForm: FormData = { name: '', category: '', quantity: '1', unitValue: '', location: '', status: 'disponivel' };

export default function EstoqueUtensilios() {
  const [utensils, setUtensils] = useState<Utensil[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/utensils').then(r => r.json()).then(setUtensils).finally(() => setLoading(false));
    fetch('/api/utensil-categories').then(r => r.json()).then(setCategories).catch(() => {});
  }, []);
  const [categories, setCategories] = useState<string[]>([]);
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
  const [viewingItem, setViewingItem] = useState<Utensil | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => { if (showCatModal) catInputRef.current?.focus(); }, [showCatModal]);

  const filtered = useMemo(
    () =>
      utensils.filter((u) => {
        if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.category.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== 'all' && u.status !== statusFilter) return false;
        if (selectedCategory && u.category !== selectedCategory) return false;
        return true;
      }),
    [utensils, search, statusFilter, selectedCategory],
  );

  const availableCount = utensils.filter((u) => u.status === 'disponivel').length;
  const totalValue = utensils.reduce((acc, u) => acc + (u.unitValue ?? 0) * u.quantity, 0);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (u: Utensil) => {
    setForm({ name: u.name, category: u.category, quantity: String(u.quantity), unitValue: u.unitValue ? formatCurrency(String(Math.round(u.unitValue * 100))) : '', location: u.location, status: u.status });
    setEditingId(u.id);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = async () => {
    if (!form.name) return;
    const data = {
      name: form.name, category: form.category, quantity: Number(form.quantity) || 1, unitValue: parseCurrency(form.unitValue) || undefined, location: form.location, status: form.status,
    };
    if (editingId) {
      const res = await fetch(`/api/utensils/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const updated = await res.json();
      setUtensils((prev) => prev.map((u) => u.id === editingId ? updated : u));
    } else {
      const res = await fetch('/api/utensils', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const created = await res.json();
      setUtensils((prev) => [...prev, created]);
    }
    closeModal();
  };

  const addCategory = async () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      await fetch('/api/utensil-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: trimmed }) });
      setCategories((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    }
    setNewCategory('');
    setShowCatModal(false);
  };

  const handleDelete = (id: string) => { setDeleteTargetId(id); };
  const confirmDelete = async () => {
    if (deleteTargetId) {
      await fetch(`/api/utensils/${deleteTargetId}`, { method: 'DELETE' });
      setUtensils((prev) => prev.filter((u) => u.id !== deleteTargetId));
    }
    setDeleteTargetId(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Estoque de Utensilios</h1>
            <button className={styles.btnInfo} onClick={() => setShowInfo(true)} title="Como usar esta página">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
          </div>
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
        <div className={`${styles.kpiCard} ${styles.amber}`}>
          <div className={styles.kpiLabel}>Valor Total</div>
          <div className={styles.kpiValue}>R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className={styles.categoriesSection}>
        <p className={styles.categoriesTitle}>Categorias</p>
        <div className={styles.categoriesGrid}>
          {categories.map((cat) => {
            const count = utensils.filter((u) => u.category === cat).length;
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

      {loading ? (
        <div className={styles.empty}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Nenhum utensilio encontrado.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((u) => (
            <div key={u.id} className={styles.card} onClick={() => setViewingItem(u)} style={{ cursor: 'pointer' }}>
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
                {u.unitValue != null && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Valor:</span>
                    <span>R$ {(u.unitValue * u.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {u.location && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Local:</span>
                    <span>{u.location}</span>
                  </div>
                )}
              </div>
              <div className={styles.cardActions}>
                <button className={styles.btnEdit} onClick={(e) => { e.stopPropagation(); openEdit(u); }}>Editar</button>
                <button className={styles.btnDelete} onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }}>Excluir</button>
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
                  <select className={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Sem categoria</option>
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Quantidade</label>
                  <input className={styles.input} type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Valor Unitário (R$)</label>
                  <input className={styles.input} type="text" value={form.unitValue} onChange={(e) => setForm({ ...form, unitValue: formatCurrency(e.target.value) })} placeholder="R$ 0,00" />
                </div>
              </div>
              <div className={styles.formGrid2}>
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
                <input ref={catInputRef} className={styles.input} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') { setShowCatModal(false); setNewCategory(''); } }} placeholder="Ex: Fornos, Utensílios..." />
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
          onConfirm={async () => {
            await fetch('/api/utensil-categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: deleteCatTarget }) });
            setCategories((prev) => prev.filter((c) => c !== deleteCatTarget));
            setDeleteCatTarget(null);
          }}
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
                  <span className={styles.viewValue}>{viewingItem.quantity} un</span>
                </div>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Valor Unitário</span>
                  <span className={styles.viewValue}>{viewingItem.unitValue != null ? `R$ ${viewingItem.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</span>
                </div>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Valor Total</span>
                  <span className={styles.viewValue}>{viewingItem.unitValue != null ? `R$ ${(viewingItem.unitValue * viewingItem.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</span>
                </div>
                <div className={styles.viewField}>
                  <span className={styles.viewLabel}>Localização</span>
                  <span className={styles.viewValue}>{viewingItem.location || '—'}</span>
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
          title="Excluir Utensílio"
          message={<>Tem certeza que deseja excluir <strong>{utensils.find((u) => u.id === deleteTargetId)?.name}</strong>? Esta ação não pode ser desfeita.</>}
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
                  A página de <strong>Estoque de Utensílios</strong> permite controlar todos os equipamentos, ferramentas e utensílios do seu negócio. Acompanhe disponibilidade, localização e valor de cada item.
                </p>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Como cadastrar um utensílio</p>
                <ol className={styles.infoList}>
                  <li>Clique em <strong>Novo Utensílio</strong> no canto superior direito.</li>
                  <li>Preencha nome, categoria, quantidade, valor unitário e localização.</li>
                  <li>Selecione o status: Disponível, Em Uso, Manutenção ou Descartado.</li>
                  <li>Clique em <strong>Cadastrar Utensílio</strong> para salvar.</li>
                </ol>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Como usar as categorias</p>
                <ol className={styles.infoList}>
                  <li>Na seção <strong>Categorias</strong>, clique em <strong>Nova Categoria</strong>.</li>
                  <li>Digite o nome e clique em <strong>Adicionar</strong>.</li>
                  <li>Clique em uma categoria para filtrar os utensílios por ela.</li>
                </ol>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Ver detalhes de um item</p>
                <p className={styles.infoText}>Clique em qualquer card para abrir todos os detalhes do utensílio, incluindo valor total e data de cadastro.</p>
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
