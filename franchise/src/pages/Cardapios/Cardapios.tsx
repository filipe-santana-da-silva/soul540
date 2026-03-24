import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { apiFetch } from '@/lib/api';
import styles from './Cardapios.module.scss';
import ConfirmModal from '@/components/ConfirmModal/ConfirmModal';

type MenuItem = { id: string; name: string; description: string; price: number; };
type MenuCategory = { id: string; name: string; items: MenuItem[]; };
type Menu = { id: string; name: string; eventId?: string; headerText: string; footerText: string; categories: MenuCategory[]; createdAt: string; };

export default function Cardapios() {
  const { events } = useApp();
  const [menus, setMenus] = useState<Menu[]>([]);

  useEffect(() => {
    apiFetch('/api/menus').then(r => r.json()).then(setMenus).catch(() => {});
  }, []);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMenu, setPreviewMenu] = useState<Menu | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEventId, setFormEventId] = useState('');
  const [formHeaderText, setFormHeaderText] = useState('');
  const [formFooterText, setFormFooterText] = useState('');
  const [formCategories, setFormCategories] = useState<MenuCategory[]>([]);

  const eventMap = useMemo(() => {
    const m: Record<string, string> = {};
    events.forEach((e) => { m[e.id] = e.name; });
    return m;
  }, [events]);

  const filtered = menus.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.eventId && eventMap[m.eventId]?.toLowerCase().includes(search.toLowerCase()))
  );

  const resetForm = () => {
    setFormName('');
    setFormEventId('');
    setFormHeaderText('');
    setFormFooterText('');
    setFormCategories([]);
  };

  const openCreate = () => {
    resetForm();
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (menu: Menu) => {
    setFormName(menu.name);
    setFormEventId(menu.eventId || '');
    setFormHeaderText(menu.headerText);
    setFormFooterText(menu.footerText);
    setFormCategories(JSON.parse(JSON.stringify(menu.categories)));
    setEditingId(menu.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formName) return;
    const data = { name: formName, eventId: formEventId || '', headerText: formHeaderText, footerText: formFooterText, categories: formCategories };
    if (editingId) {
      const res = await apiFetch(`/api/menus/${editingId}`, { method: 'PUT', body: JSON.stringify(data) });
      const updated: Menu = await res.json();
      setMenus((prev) => prev.map((m) => m.id === editingId ? updated : m));
    } else {
      const res = await apiFetch('/api/menus', { method: 'POST', body: JSON.stringify(data) });
      const created: Menu = await res.json();
      setMenus((prev) => [...prev, created]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => { setDeleteTargetId(id); };
  const confirmDelete = async () => {
    if (deleteTargetId) {
      await apiFetch(`/api/menus/${deleteTargetId}`, { method: 'DELETE' });
      setMenus((prev) => prev.filter((m) => m.id !== deleteTargetId));
    }
    setDeleteTargetId(null);
  };

  const addCategory = () => {
    setFormCategories((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, name: 'Nova Categoria', items: [] },
    ]);
  };

  const removeCategory = (catId: string) => {
    setFormCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  const updateCategoryName = (catId: string, name: string) => {
    setFormCategories((prev) => prev.map((c) => c.id === catId ? { ...c, name } : c));
  };

  const addItem = (catId: string) => {
    setFormCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, items: [...c.items, { id: `item-${Date.now()}`, name: '', description: '', price: 0 }] }
          : c
      )
    );
  };

  const removeItem = (catId: string, itemId: string) => {
    setFormCategories((prev) =>
      prev.map((c) => c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c)
    );
  };

  const updateItem = (catId: string, itemId: string, field: keyof MenuItem, value: string | number) => {
    setFormCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, [field]: value } : i) }
          : c
      )
    );
  };

  const totalItems = (menu: Menu) => menu.categories.reduce((acc, c) => acc + c.items.length, 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cardapios</h1>
          <p className={styles.subtitle}>Gerencie cardapios de eventos e pedidos</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Cardapio
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className={styles.searchInput} placeholder="Buscar cardapios..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Nenhum cardapio encontrado.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((menu) => (
            <div key={menu.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardName}>{menu.name}</h3>
                  {menu.eventId && <p className={styles.cardEvent}>{eventMap[menu.eventId]}</p>}
                </div>
                <div className={styles.cardStats}>
                  <span className={styles.statBadge}>{menu.categories.length} cats.</span>
                  <span className={styles.statBadge}>{totalItems(menu)} itens</span>
                </div>
              </div>
              {menu.headerText && <p className={styles.cardSubText}>{menu.headerText}</p>}
              <div className={styles.categoriesList}>
                {menu.categories.map((cat) => (
                  <div key={cat.id} className={styles.catItem}>
                    <span className={styles.catName}>{cat.name}</span>
                    <span className={styles.catCount}>{cat.items.length} itens</span>
                  </div>
                ))}
              </div>
              <div className={styles.cardActions}>
                <button className={styles.btnView} onClick={() => setPreviewMenu(menu)}>Visualizar</button>
                <button className={styles.btnEdit} onClick={() => openEdit(menu)}>Editar</button>
                <button className={styles.btnDelete} onClick={() => handleDelete(menu.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Editar Cardapio' : 'Novo Cardapio'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nome do Cardapio *</label>
                  <input className={styles.input} value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Cardapio Corporativo" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Evento Vinculado</label>
                  <select className={styles.input} value={formEventId} onChange={(e) => setFormEventId(e.target.value)}>
                    <option value="">Nenhum</option>
                    {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cabecalho</label>
                  <input className={styles.input} value={formHeaderText} onChange={(e) => setFormHeaderText(e.target.value)} placeholder="Soul540 - Pizzas Artesanais" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Rodape</label>
                  <input className={styles.input} value={formFooterText} onChange={(e) => setFormFooterText(e.target.value)} placeholder="Ingredientes frescos..." />
                </div>
              </div>

              <div className={styles.categoriesSection}>
                <div className={styles.categoriesHeader}>
                  <span className={styles.categoriesTitle}>Categorias e Itens</span>
                  <button className={styles.btnAddCat} type="button" onClick={addCategory}>+ Categoria</button>
                </div>
                {formCategories.map((cat) => (
                  <div key={cat.id} className={styles.catBlock}>
                    <div className={styles.catBlockHeader}>
                      <input
                        className={styles.catNameInput}
                        value={cat.name}
                        onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                        placeholder="Nome da categoria"
                      />
                      <button className={styles.btnRemoveCat} type="button" onClick={() => removeCategory(cat.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    {cat.items.map((item) => (
                      <div key={item.id} className={styles.itemRow}>
                        <input
                          className={styles.itemInput}
                          value={item.name}
                          onChange={(e) => updateItem(cat.id, item.id, 'name', e.target.value)}
                          placeholder="Nome do item"
                        />
                        <input
                          className={`${styles.itemInput} ${styles.itemDesc}`}
                          value={item.description}
                          onChange={(e) => updateItem(cat.id, item.id, 'description', e.target.value)}
                          placeholder="Descricao"
                        />
                        <input
                          className={`${styles.itemInput} ${styles.itemPrice}`}
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(cat.id, item.id, 'price', Number(e.target.value))}
                          placeholder="R$"
                        />
                        <button className={styles.btnRemoveItem} type="button" onClick={() => removeItem(cat.id, item.id)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                    <button className={styles.btnAddItem} type="button" onClick={() => addItem(cat.id)}>+ Item</button>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={closeModal}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={!formName}>
                {editingId ? 'Salvar' : 'Criar Cardapio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewMenu && (
        <div className={styles.overlay} onClick={() => setPreviewMenu(null)}>
          <div className={styles.preview} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Visualizar Cardapio</h2>
              <button className={styles.modalClose} onClick={() => setPreviewMenu(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.previewBody}>
              {previewMenu.headerText && <div className={styles.previewHeader}>{previewMenu.headerText}</div>}
              <h3 className={styles.previewTitle}>{previewMenu.name}</h3>
              {previewMenu.eventId && <p className={styles.previewEvent}>{eventMap[previewMenu.eventId]}</p>}
              {previewMenu.categories.map((cat) => (
                <div key={cat.id} className={styles.previewCat}>
                  <h4 className={styles.previewCatName}>{cat.name}</h4>
                  {cat.items.map((item) => (
                    <div key={item.id} className={styles.previewItem}>
                      <div>
                        <p className={styles.previewItemName}>{item.name}</p>
                        {item.description && <p className={styles.previewItemDesc}>{item.description}</p>}
                      </div>
                      <span className={styles.previewItemPrice}>R$ {item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
              {previewMenu.footerText && <div className={styles.previewFooter}>{previewMenu.footerText}</div>}
            </div>
          </div>
        </div>
      )}
      {deleteTargetId && (
        <ConfirmModal
          title="Excluir Cardápio"
          message={<>Tem certeza que deseja excluir <strong>{menus.find((m) => m.id === deleteTargetId)?.name}</strong>? Esta ação não pode ser desfeita.</>}
          confirmLabel="Excluir"
          variant="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
