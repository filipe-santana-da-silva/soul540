import { useState, useEffect } from 'react';
import { useAuth } from '@frontend/hooks/useAuth';
import styles from './Permissoes.module.scss';

type AppUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  permissions: string[];
  passwordPlain?: string;
  unit?: string;
};

const SYSTEM_LABELS: Record<string, string> = {
  main: 'Principal',
  franchise: 'Franquia',
  factory: 'Fábrica',
};

function groupUsersByUnit(users: AppUser[]): { label: string; users: AppUser[] }[] {
  const groups: Record<string, AppUser[]> = {};
  for (const u of users) {
    const key = u.unit || 'main';
    if (!groups[key]) groups[key] = [];
    groups[key].push(u);
  }
  return Object.entries(groups).map(([key, us]) => ({
    label: SYSTEM_LABELS[key] || key,
    users: us,
  }));
}

const ALL_PAGES = [
  { group: 'Principal', items: [{ key: 'dashboard', label: 'Dashboard' }] },
  { group: 'Gestão', items: [
    { key: 'eventos', label: 'Eventos' },
    { key: 'tarefas', label: 'Tarefas' },
    { key: 'funcionarios', label: 'Funcionários' },
    { key: 'contratantes', label: 'Contratantes' },
  ]},
  { group: 'Financeiro', items: [
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'notas-fiscais', label: 'Notas Fiscais' },
    { key: 'contratos', label: 'Contratos' },
  ]},
  { group: 'Operações', items: [
    { key: 'cardapios', label: 'Cardápios' },
    { key: 'estoque-insumos', label: 'Est. Insumos' },
    { key: 'estoque-utensilios', label: 'Est. Utensílios' },
  ]},
  { group: 'Expansão', items: [{ key: 'franquias', label: 'Franquias' }] },
  { group: 'Sistema', items: [
    { key: 'chat', label: 'Chat IA' },
    { key: 'usuario', label: 'Minha Conta' },
    { key: 'permissoes', label: 'Permissões' },
  ]},
];

const ALL_KEYS = ALL_PAGES.flatMap(g => g.items.map(i => i.key));

const emptyForm = { name: '', email: '', password: '', isAdmin: false, unit: 'main' };

export default function Permissoes() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [draftPerms, setDraftPerms] = useState<string[]>([]);
  const [draftIsAdmin, setDraftIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const { user: authUser } = useAuth();

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  const selectUser = (u: AppUser) => {
    setSelected(u);
    setDraftPerms([...u.permissions]);
    setDraftIsAdmin(u.isAdmin);
  };

  const togglePerm = (key: string) => {
    setDraftPerms(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleAll = () => {
    setDraftPerms(prev => prev.length === ALL_KEYS.length ? [] : [...ALL_KEYS]);
  };

  const savePermissions = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/users/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: draftPerms, isAdmin: draftIsAdmin }),
    });
    const updated = await res.json();
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setSelected(updated);
    setDraftIsAdmin(updated.isAdmin);
    setSaving(false);
  };

  const createUser = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) return;
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, unit: form.unit, permissions: form.isAdmin ? [...ALL_KEYS, 'permissoes'] : [] }),
    });
    const created = await res.json();
    setUsers(prev => [...prev, created]);
    setForm(emptyForm);
    setShowModal(false);
  };

  const deleteUser = async (u: AppUser) => {
    await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(x => x.id !== u.id));
    if (selected?.id === u.id) setSelected(null);
    setDeleteTarget(null);
  };

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Permissões</h1>
          <p className={styles.subtitle}>Gerencie usuários e controle o acesso às páginas</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Usuário
        </button>
      </div>

      <div className={styles.layout}>
        {/* Left — user list */}
        <div className={styles.userList}>
          <p className={styles.listTitle}>Usuários ({users.length})</p>
          {groupUsersByUnit(users).map(group => (
            <div key={group.label}>
              <p className={styles.systemGroupLabel}>{group.label}</p>
              {group.users.map(u => (
            <div
              key={u.id}
              className={`${styles.userCard} ${selected?.id === u.id ? styles.userCardActive : ''}`}
              onClick={() => selectUser(u)}
            >
              <div className={styles.userAvatar}>{initials(u.name)}</div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{u.name}</p>
                <p className={styles.userEmail}>{u.email}</p>
                {authUser?.isAdmin && u.passwordPlain && (
                  <p className={styles.userPassword}>
                    {revealedPasswords[u.id] ? u.passwordPlain : '••••••••'}
                  </p>
                )}
              </div>
              <div className={styles.userMeta}>
                {u.isAdmin && <span className={styles.badgeAdmin}>Admin</span>}
                {authUser?.isAdmin && u.passwordPlain && (
                  <button
                    className={styles.btnEye}
                    onClick={(e) => { e.stopPropagation(); setRevealedPasswords(prev => ({ ...prev, [u.id]: !prev[u.id] })); }}
                    title={revealedPasswords[u.id] ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {revealedPasswords[u.id] ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                )}
                <button
                  className={styles.btnDeleteUser}
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(u); }}
                  title="Remover usuário"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
              ))}
            </div>
          ))}
          {users.length === 0 && <p className={styles.empty}>Nenhum usuário cadastrado.</p>}
        </div>

        {/* Right — permission checkboxes */}
        <div className={styles.permPanel}>
          {!selected ? (
            <div className={styles.permEmpty}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <p>Selecione um usuário para gerenciar as permissões</p>
            </div>
          ) : (
            <>
              <label className={styles.adminToggleRow}>
                <input
                  type="checkbox"
                  checked={draftIsAdmin}
                  onChange={(e) => {
                    setDraftIsAdmin(e.target.checked);
                    if (e.target.checked) {
                      setDraftPerms([...ALL_KEYS, 'permissoes']);
                    }
                  }}
                />
                <span className={styles.adminToggleLabel}>
                  Administrador
                  <small> — acesso total + tela de Permissões</small>
                </span>
              </label>
              <div className={styles.permHeader}>
                <div>
                  <p className={styles.permTitle}>Permissões de {selected.name}</p>
                  <p className={styles.permSub}>{draftPerms.length} de {ALL_KEYS.length} páginas liberadas</p>
                </div>
                <button className={styles.btnToggleAll} onClick={toggleAll}>
                  {draftPerms.length === ALL_KEYS.length ? 'Desmarcar tudo' : 'Marcar tudo'}
                </button>
              </div>

              <div className={styles.permGroups}>
                {ALL_PAGES.map(group => (
                  <div key={group.group} className={styles.permGroup}>
                    <p className={styles.permGroupLabel}>{group.group}</p>
                    {group.items.map(item => (
                      <label key={item.key} className={styles.permItem}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={draftPerms.includes(item.key)}
                          onChange={() => togglePerm(item.key)}
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>

              <div className={styles.permFooter}>
                <button className={styles.btnSave} onClick={savePermissions} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Permissões'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create user modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Novo Usuário</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nome *</label>
                <input className={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email *</label>
                <input className={styles.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Senha *</label>
                <input className={styles.input} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
              </div>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={form.isAdmin} onChange={e => setForm({ ...form, isAdmin: e.target.checked })} />
                <span>Administrador (acesso total)</span>
              </label>
              <div className={styles.formGroup}>
                <label className={styles.label}>Sistema</label>
                <select className={styles.input} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  <option value="main">Principal</option>
                  <option value="franchise">Franquia</option>
                  <option value="factory">Fábrica</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={createUser} disabled={!form.name.trim() || !form.email.trim() || !form.password}>Cadastrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Remover usuário</h2>
              <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.deleteMsg}>Tem certeza que deseja remover <strong>{deleteTarget.name}</strong>? Esta ação não pode ser desfeita.</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className={styles.btnDanger} onClick={() => deleteUser(deleteTarget)}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
