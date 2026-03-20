# Permissions System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Permissions screen where the admin can create user accounts and control which pages each user can access.

**Architecture:** Real MongoDB user collection with bcrypt-hashed passwords; a new `/api/auth/login` + `/api/users` REST API replaces the current mock auth; the frontend reads `permissions[]` and `isAdmin` from the logged-in user to filter sidebar items and guard routes; a new `Permissoes` page (admin-only) provides the full management UI.

**Tech Stack:** Express + Mongoose + bcryptjs · React 18 + SCSS Modules · React Router v6

---

## Task 1: Install bcryptjs

**Files:**
- Modify: `package.json` (devDependencies)

**Step 1: Install packages**
```bash
cd "c:/Users/filip/OneDrive/Área de Trabalho/ideias/Soul540"
npm install bcryptjs
npm install -D @types/bcryptjs
```

**Step 2: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add bcryptjs for password hashing"
```

---

## Task 2: Create User Mongoose model + auth routes

**Files:**
- Create: `server/routes/auth.ts`
- Create: `server/routes/users.ts`

**Step 1: Create `server/routes/auth.ts`**
```typescript
import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  permissions: { type: [String], default: [] },
}, { toJSON: { virtuals: true, versionKey: false } });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email e senha obrigatorios' });

  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Email ou senha incorretos' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Email ou senha incorretos' });

  const token = 'token-' + user._id + '-' + Date.now();
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, permissions: user.permissions } });
});

export default router;
```

**Step 2: Create `server/routes/users.ts`**
```typescript
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from './auth';

const router = Router();

// GET /api/users
router.get('/', async (_req, res) => {
  const users = await UserModel.find().select('-passwordHash');
  res.json(users);
});

// POST /api/users
router.post('/', async (req, res) => {
  const { name, email, password, isAdmin, permissions } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'name, email e password obrigatorios' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash, isAdmin: !!isAdmin, permissions: permissions || [] });
  const { passwordHash: _, ...safe } = user.toJSON();
  res.status(201).json(safe);
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { name, isAdmin, permissions, password } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (isAdmin !== undefined) update.isAdmin = isAdmin;
  if (permissions !== undefined) update.permissions = permissions;
  if (password) update.passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  await UserModel.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
```

**Step 3: Commit**
```bash
git add server/routes/auth.ts server/routes/users.ts
git commit -m "feat: add User model and auth/users API routes"
```

---

## Task 3: Register new routes in server/index.ts

**Files:**
- Modify: `server/index.ts`

**Step 1: Add imports and app.use calls**

Add after the last import:
```typescript
import authRouter from './routes/auth';
import usersRouter from './routes/users';
```

Add after the last `app.use(...)` call:
```typescript
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
```

**Step 2: Commit**
```bash
git add server/index.ts
git commit -m "feat: register auth and users routes"
```

---

## Task 4: Update User entity (frontend)

**Files:**
- Modify: `src/backend/domain/entities/User.ts`

**Step 1: Add isAdmin and permissions fields**
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  isAdmin: boolean;
  permissions: string[];
}
```

**Step 2: Commit**
```bash
git add src/backend/domain/entities/User.ts
git commit -m "feat: add isAdmin and permissions to User entity"
```

---

## Task 5: Replace mock AuthRepository with real API

**Files:**
- Modify: `src/backend/infra/repositories/AuthRepository.ts`

**Step 1: Replace with API-based implementation**
```typescript
import type { User } from '@backend/domain/entities/User';
import type { IAuthRepository, LoginCredentials, AuthResult } from '@backend/domain/repositories/IAuthRepository';
import { TokenStorage } from '../storage/TokenStorage';

export class AuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Email ou senha incorretos');
    }
    const data = await res.json();
    TokenStorage.setToken(data.token);
    TokenStorage.setUser(data.user);
    return { user: data.user, token: data.token };
  }

  async logout(): Promise<void> {
    TokenStorage.clear();
  }

  async getCurrentUser(): Promise<User | null> {
    const token = TokenStorage.getToken();
    if (!token) return null;
    return TokenStorage.getUser<User>();
  }
}
```

**Step 2: Commit**
```bash
git add src/backend/infra/repositories/AuthRepository.ts
git commit -m "feat: replace mock auth with real API calls"
```

---

## Task 6: Seed the first admin user

> This creates the initial admin account in the database so login works.

**Step 1: Create `server/seed.ts`**
```typescript
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './db';
import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: String, email: String, passwordHash: String,
  isAdmin: Boolean, permissions: [String],
});
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  await connectDB();
  const count = await UserModel.countDocuments();
  if (count > 0) { console.log('Usuarios ja existem, seed ignorado.'); process.exit(0); }
  const ALL_PERMISSIONS = ['dashboard','eventos','tarefas','funcionarios','contratantes','financeiro','notas-fiscais','contratos','franquias','cardapios','estoque-insumos','estoque-utensilios','chat','usuario'];
  const passwordHash = await bcrypt.hash('123456', 10);
  await UserModel.create({ name: 'Administrador', email: 'admin@soul540.com', passwordHash, isAdmin: true, permissions: ALL_PERMISSIONS });
  console.log('Admin criado: admin@soul540.com / 123456');
  process.exit(0);
}

seed().catch(console.error);
```

**Step 2: Add seed script to package.json**

In the `"scripts"` section, add:
```json
"seed": "tsx server/seed.ts"
```

**Step 3: Run seed**
```bash
npm run seed
```
Expected output: `Admin criado: admin@soul540.com / 123456`

**Step 4: Commit**
```bash
git add server/seed.ts package.json
git commit -m "feat: add seed script for initial admin user"
```

---

## Task 7: Update AuthContext to expose isAdmin and permissions

**Files:**
- Modify: `src/frontend/contexts/AuthContext.tsx`

**Step 1: Add isAdmin and permissions to context interface**

Update the `AuthContextData` interface:
```typescript
interface AuthContextData {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  isAdmin: boolean;
  permissions: string[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

Update the Provider return value to include:
```typescript
<AuthContext.Provider value={{
  user, loading, authenticated: !!user,
  isAdmin: user?.isAdmin ?? false,
  permissions: user?.permissions ?? [],
  login, logout,
}}>
```

**Step 2: Commit**
```bash
git add src/frontend/contexts/AuthContext.tsx
git commit -m "feat: expose isAdmin and permissions from AuthContext"
```

---

## Task 8: Add PERMISSOES to routes.ts

**Files:**
- Modify: `src/frontend/routes.ts`

**Step 1: Add new route**
```typescript
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  FINANCEIRO: '/financeiro',
  NOTAS_FISCAIS: '/notas-fiscais',
  USUARIO: '/usuario',
  EVENTOS: '/eventos',
  TAREFAS: '/tarefas',
  FUNCIONARIOS: '/funcionarios',
  CONTRATANTES: '/contratantes',
  CONTRATOS: '/contratos',
  FRANQUIAS: '/franquias',
  CARDAPIOS: '/cardapios',
  ESTOQUE_INSUMOS: '/estoque-insumos',
  ESTOQUE_UTENSILIOS: '/estoque-utensilios',
  CHAT: '/chat',
  PERMISSOES: '/permissoes',
} as const;
```

**Step 2: Commit**
```bash
git add src/frontend/routes.ts
git commit -m "feat: add PERMISSOES route"
```

---

## Task 9: Create Permissoes page

**Files:**
- Create: `src/frontend/pages/Permissoes/Permissoes.tsx`
- Create: `src/frontend/pages/Permissoes/Permissoes.module.scss`

**Step 1: Create `Permissoes.tsx`**

```typescript
import { useState, useEffect } from 'react';
import styles from './Permissoes.module.scss';

type AppUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  permissions: string[];
};

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
  ]},
];

const ALL_KEYS = ALL_PAGES.flatMap(g => g.items.map(i => i.key));

const emptyForm = { name: '', email: '', password: '', isAdmin: false };

export default function Permissoes() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [draftPerms, setDraftPerms] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  const selectUser = (u: AppUser) => {
    setSelected(u);
    setDraftPerms([...u.permissions]);
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
      body: JSON.stringify({ permissions: draftPerms }),
    });
    const updated = await res.json();
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setSelected(updated);
    setSaving(false);
  };

  const createUser = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) return;
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, permissions: form.isAdmin ? ALL_KEYS : [] }),
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
          {users.map(u => (
            <div
              key={u.id}
              className={`${styles.userCard} ${selected?.id === u.id ? styles.userCardActive : ''}`}
              onClick={() => selectUser(u)}
            >
              <div className={styles.userAvatar}>{initials(u.name)}</div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{u.name}</p>
                <p className={styles.userEmail}>{u.email}</p>
              </div>
              <div className={styles.userMeta}>
                {u.isAdmin && <span className={styles.badgeAdmin}>Admin</span>}
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
```

**Step 2: Create `Permissoes.module.scss`**

```scss
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.page { padding: $spacing-2xl $spacing-xl; animation: fadeIn 0.4s ease; @include mobile { padding: $spacing-md; } }
.header { @include flex-between; margin-bottom: $spacing-2xl; flex-wrap: wrap; gap: $spacing-md; }
.title { font-size: $font-size-3xl; font-weight: $font-weight-bold; color: $text-primary; letter-spacing: -0.5px; }
.subtitle { font-size: $font-size-sm; color: $text-muted; margin-top: 6px; }

.layout { display: grid; grid-template-columns: 320px 1fr; gap: $spacing-xl; align-items: start; @include tablet { grid-template-columns: 1fr; } }

// User list
.userList { @include card; padding: $spacing-lg; display: flex; flex-direction: column; gap: $spacing-sm; }
.listTitle { font-size: $font-size-sm; font-weight: $font-weight-semibold; color: $text-muted; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: $spacing-xs; }
.userCard { display: flex; align-items: center; gap: $spacing-md; padding: $spacing-md; border-radius: $radius-sm; border: 1px solid transparent; cursor: pointer; transition: all $transition-fast; &:hover { background: rgba(255,255,255,0.04); border-color: $border; } }
.userCardActive { background: rgba($accent, 0.08) !important; border-color: rgba($accent, 0.3) !important; }
.userAvatar { width: 38px; height: 38px; border-radius: 50%; background: rgba($accent, 0.15); color: $accent; font-size: $font-size-sm; font-weight: $font-weight-bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.userInfo { flex: 1; min-width: 0; }
.userName { font-size: $font-size-sm; font-weight: $font-weight-medium; color: $text-primary; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.userEmail { font-size: $font-size-xs; color: $text-muted; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.userMeta { display: flex; align-items: center; gap: $spacing-sm; flex-shrink: 0; }
.badgeAdmin { font-size: 10px; font-weight: $font-weight-semibold; background: rgba($accent, 0.15); color: $accent; padding: 2px 8px; border-radius: 20px; }
.btnDeleteUser { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: none; border: none; color: $text-muted; cursor: pointer; border-radius: $radius-xs; &:hover { color: #f87171; background: rgba(239,68,68,0.1); } }
.empty { text-align: center; padding: $spacing-xl; color: $text-muted; font-size: $font-size-sm; }

// Permission panel
.permPanel { @include card; padding: $spacing-xl; min-height: 400px; }
.permEmpty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: $spacing-md; height: 300px; color: $text-muted; text-align: center; font-size: $font-size-sm; svg { opacity: 0.3; } }
.permHeader { @include flex-between; margin-bottom: $spacing-xl; flex-wrap: wrap; gap: $spacing-md; }
.permTitle { font-size: $font-size-lg; font-weight: $font-weight-semibold; color: $text-primary; }
.permSub { font-size: $font-size-sm; color: $text-muted; margin-top: 4px; }
.btnToggleAll { font-size: $font-size-sm; color: $accent; background: none; border: none; cursor: pointer; &:hover { text-decoration: underline; } }

.permGroups { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: $spacing-xl; margin-bottom: $spacing-xl; }
.permGroup { display: flex; flex-direction: column; gap: $spacing-sm; }
.permGroupLabel { font-size: $font-size-xs; font-weight: $font-weight-semibold; color: $text-muted; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.permItem { display: flex; align-items: center; gap: $spacing-sm; cursor: pointer; font-size: $font-size-sm; color: $text-secondary; &:hover { color: $text-primary; } }
.checkbox { width: 16px; height: 16px; accent-color: $accent; cursor: pointer; }

.permFooter { border-top: 1px solid $border; padding-top: $spacing-lg; display: flex; justify-content: flex-end; }

// Buttons
.btnPrimary { display: flex; align-items: center; gap: $spacing-sm; padding: 10px $spacing-md; background: $accent; color: #0a0f1e; font-size: $font-size-sm; font-weight: $font-weight-semibold; border: none; border-radius: $radius-sm; cursor: pointer; transition: background $transition-fast; &:hover { background: $accent-hover; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btnSave { padding: 10px $spacing-xl; background: $accent; color: #0a0f1e; font-size: $font-size-sm; font-weight: $font-weight-semibold; border: none; border-radius: $radius-sm; cursor: pointer; transition: background $transition-fast; &:hover { background: $accent-hover; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btnCancel { padding: 10px $spacing-md; background: none; border: none; color: $text-muted; font-size: $font-size-sm; cursor: pointer; &:hover { color: $text-primary; } }
.btnDanger { padding: 10px $spacing-md; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: $radius-sm; color: #f87171; font-size: $font-size-sm; cursor: pointer; &:hover { background: rgba(239,68,68,0.18); } }

// Modal
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: $spacing-md; backdrop-filter: blur(4px); }
.modal { background: $bg-secondary; border: 1px solid $border; border-radius: $radius-lg; width: 100%; max-width: 440px; box-shadow: $shadow-lg; }
.modalHeader { @include flex-between; padding: $spacing-lg $spacing-xl; border-bottom: 1px solid $border; }
.modalTitle { font-size: $font-size-lg; font-weight: $font-weight-semibold; color: $text-primary; }
.modalClose { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: none; border: none; color: $text-muted; cursor: pointer; border-radius: $radius-xs; &:hover { color: $text-primary; background: rgba(255,255,255,0.06); } }
.modalBody { padding: $spacing-xl; display: flex; flex-direction: column; gap: $spacing-md; }
.modalFooter { @include flex-between; padding: $spacing-md $spacing-xl; border-top: 1px solid $border; }

.formGroup { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: $font-size-sm; font-weight: $font-weight-medium; color: $text-secondary; }
.input { padding: 10px $spacing-md; background: $bg-card; border: 1px solid $border; border-radius: $radius-sm; color: $text-primary; font-size: $font-size-sm; transition: all $transition-base; &::placeholder { color: $text-muted; } &:focus { outline: none; border-color: $accent; box-shadow: 0 0 0 3px rgba($accent, 0.1); } }
.checkboxLabel { display: flex; align-items: center; gap: $spacing-sm; font-size: $font-size-sm; color: $text-secondary; cursor: pointer; input { width: 16px; height: 16px; accent-color: $accent; cursor: pointer; } }
.deleteMsg { font-size: $font-size-sm; color: $text-secondary; line-height: 1.6; strong { color: $text-primary; } }
```

**Step 3: Commit**
```bash
git add src/frontend/pages/Permissoes/
git commit -m "feat: create Permissoes page"
```

---

## Task 10: Register Permissoes in App.tsx

**Files:**
- Modify: `src/frontend/App.tsx`

**Step 1: Add import and route**

Add import at top:
```typescript
import Permissoes from '@frontend/pages/Permissoes/Permissoes';
```

Add route inside the Layout block (after Chat route):
```typescript
<Route path={ROUTES.PERMISSOES} element={<Permissoes />} />
```

**Step 2: Commit**
```bash
git add src/frontend/App.tsx
git commit -m "feat: register Permissoes route in App"
```

---

## Task 11: Update Sidebar — filter by permissions + add Permissoes entry

**Files:**
- Modify: `src/frontend/components/Sidebar/Sidebar.tsx`

**Step 1: Add permission filtering and Permissoes nav item**

At the top of the `Sidebar` component function, add:
```typescript
const { user, logout, isAdmin, permissions } = useAuth();
```

Add Permissoes entry to the `navGroups` array at the end of the Sistema group items:
```typescript
// Add inside Sistema group items array (after Minha Conta):
{
  path: ROUTES.PERMISSOES,
  label: 'Permissões',
  icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
},
```

Filter items in the render loop — replace the `group.items.map(...)` with:
```typescript
{group.items
  .filter(item => {
    if (item.path === ROUTES.PERMISSOES) return isAdmin;
    if (isAdmin) return true;
    const key = item.path.replace('/', '') || 'dashboard';
    return permissions.includes(key);
  })
  .map((item) => { /* existing render code unchanged */ })}
```

Also wrap the entire group render with a check so empty groups don't show a label:
```typescript
{navGroups.map((group) => {
  const visibleItems = group.items.filter(item => {
    if (item.path === ROUTES.PERMISSOES) return isAdmin;
    if (isAdmin) return true;
    const key = item.path.replace('/', '') || 'dashboard';
    return permissions.includes(key);
  });
  if (visibleItems.length === 0) return null;
  return (
    <div key={group.label} className={styles.navGroup}>
      <span className={styles.navGroupLabel}>{group.label}</span>
      {visibleItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            onClick={() => navigate(item.path)}
          >
            {isActive && <span className={styles.activeIndicator} />}
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
})}
```

**Step 2: Commit**
```bash
git add src/frontend/components/Sidebar/Sidebar.tsx
git commit -m "feat: filter sidebar by user permissions, add Permissoes link for admin"
```

---

## Task 12: Guard routes by permission in PrivateRoute

**Files:**
- Modify: `src/frontend/App.tsx`

**Step 1: Replace PrivateRoute with permission-aware version**

```typescript
function PrivateRoute() {
  const { authenticated, loading } = useAuth();
  if (loading) return null;
  return authenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
}

function PermissionRoute({ routeKey }: { routeKey: string }) {
  const { permissions, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (isAdmin || permissions.includes(routeKey)) return <Outlet />;
  return <Navigate to={ROUTES.DASHBOARD} replace />;
}
```

**Step 2: Wrap each route with PermissionRoute**

Replace the inner route block with:
```typescript
<Route element={<PrivateRoute />}>
  <Route element={<Layout />}>
    <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
    <Route element={<PermissionRoute routeKey="financeiro" />}>
      <Route path={ROUTES.FINANCEIRO} element={<Financeiro />} />
    </Route>
    <Route element={<PermissionRoute routeKey="notas-fiscais" />}>
      <Route path={ROUTES.NOTAS_FISCAIS} element={<NotasFiscais />} />
    </Route>
    <Route element={<PermissionRoute routeKey="usuario" />}>
      <Route path={ROUTES.USUARIO} element={<Usuario />} />
    </Route>
    <Route element={<PermissionRoute routeKey="eventos" />}>
      <Route path={ROUTES.EVENTOS} element={<Eventos />} />
    </Route>
    <Route element={<PermissionRoute routeKey="tarefas" />}>
      <Route path={ROUTES.TAREFAS} element={<Tarefas />} />
    </Route>
    <Route element={<PermissionRoute routeKey="funcionarios" />}>
      <Route path={ROUTES.FUNCIONARIOS} element={<Funcionarios />} />
    </Route>
    <Route element={<PermissionRoute routeKey="contratantes" />}>
      <Route path={ROUTES.CONTRATANTES} element={<Contratantes />} />
    </Route>
    <Route element={<PermissionRoute routeKey="contratos" />}>
      <Route path={ROUTES.CONTRATOS} element={<Contratos />} />
    </Route>
    <Route element={<PermissionRoute routeKey="franquias" />}>
      <Route path={ROUTES.FRANQUIAS} element={<Franquias />} />
    </Route>
    <Route element={<PermissionRoute routeKey="cardapios" />}>
      <Route path={ROUTES.CARDAPIOS} element={<Cardapios />} />
    </Route>
    <Route element={<PermissionRoute routeKey="estoque-insumos" />}>
      <Route path={ROUTES.ESTOQUE_INSUMOS} element={<EstoqueInsumos />} />
    </Route>
    <Route element={<PermissionRoute routeKey="estoque-utensilios" />}>
      <Route path={ROUTES.ESTOQUE_UTENSILIOS} element={<EstoqueUtensilios />} />
    </Route>
    <Route element={<PermissionRoute routeKey="chat" />}>
      <Route path={ROUTES.CHAT} element={<Chat />} />
    </Route>
    <Route element={<PermissionRoute routeKey="__admin__" />}>
      <Route path={ROUTES.PERMISSOES} element={<Permissoes />} />
    </Route>
  </Route>
</Route>
```

Note: `routeKey="__admin__"` will never match `permissions[]`, so only `isAdmin` can enter — which is the desired behavior.

**Step 3: Commit**
```bash
git add src/frontend/App.tsx
git commit -m "feat: guard routes with PermissionRoute component"
```

---

## Final Verification

1. `npm run seed` — creates admin user if not already seeded
2. `npm run dev` — starts Vite + Express
3. Login with `admin@soul540.com` / `123456`
4. Navigate to `/permissoes` — should be visible in sidebar under Sistema
5. Create a new user with limited permissions (e.g., only Dashboard + Eventos)
6. Logout and login with the new account — only those pages should appear in sidebar
7. Try accessing `/financeiro` directly — should redirect to Dashboard
