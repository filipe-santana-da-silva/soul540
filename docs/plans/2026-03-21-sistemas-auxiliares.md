# Sistemas Auxiliares (Franchise + Factory) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar dois apps Vite independentes (`franchise/` e `factory/`) com o mesmo design do Soul540 principal, dados mock e login simplificado.

**Architecture:** Dois apps React + Vite + TypeScript + SCSS Modules em subpastas do projeto. Compartilham o mesmo design system (variáveis SCSS, fontes, paleta). Dados 100% mock via contextos locais. Auth mock com credenciais fixas em localStorage.

**Tech Stack:** React 18, Vite, TypeScript, SCSS Modules, React Router v6, date-fns

---

## Task 1: Scaffold do app `franchise/`

**Files:**
- Create: `franchise/package.json`
- Create: `franchise/vite.config.ts`
- Create: `franchise/tsconfig.json`
- Create: `franchise/index.html`
- Create: `franchise/src/main.tsx`

**Step 1: Criar `franchise/package.json`**

```json
{
  "name": "soul540-franchise",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "date-fns": "^3.6.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "sass": "^1.77.6",
    "typescript": "^5.5.3",
    "vite": "^5.3.1"
  }
}
```

**Step 2: Criar `franchise/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

**Step 3: Criar `franchise/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Step 4: Criar `franchise/index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Soul540 — Franquia</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Cormorant:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: Criar `franchise/src/main.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 6: Instalar dependências**

```bash
cd franchise && npm install
```

Expected: `added N packages`

**Step 7: Commit**

```bash
git add franchise/
git commit -m "feat(franchise): scaffold vite app"
```

---

## Task 2: Design system do `franchise/`

**Files:**
- Create: `franchise/src/styles/_variables.scss`
- Create: `franchise/src/styles/global.scss`

**Step 1: Criar `franchise/src/styles/_variables.scss`**

Copiar o conteúdo de `src/frontend/styles/_variables.scss` integralmente — é o mesmo design system.

**Step 2: Criar `franchise/src/styles/global.scss`**

```scss
@use 'variables' as *;

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-primary: #0a0f1e;
  --bg-secondary: #111827;
  --bg-tertiary: #1f2937;
  --bg-input: #151c2c;
  --bg-card: #111827;
  --bg-elevated: #1a2234;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border: rgba(255,255,255,0.08);
  --border-subtle: rgba(255,255,255,0.05);
  --border-faint: rgba(255,255,255,0.03);
}

body {
  font-family: $font-family;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

button { cursor: pointer; border: none; background: none; font-family: inherit; }
input, textarea { font-family: inherit; }
a { text-decoration: none; color: inherit; }
```

**Step 3: Commit**

```bash
git add franchise/src/styles/
git commit -m "feat(franchise): add design system styles"
```

---

## Task 3: Auth mock do `franchise/`

**Files:**
- Create: `franchise/src/contexts/AuthContext.tsx`
- Create: `franchise/src/routes.ts`

**Step 1: Criar `franchise/src/routes.ts`**

```typescript
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  FUNCIONARIOS: '/funcionarios',
  CONTRATANTES: '/contratantes',
  EVENTOS: '/eventos',
  ESTOQUE_INSUMOS: '/estoque-insumos',
  ESTOQUE_UTENSILIOS: '/estoque-utensilios',
  CARDAPIOS: '/cardapios',
  PERMISSOES: '/permissoes',
  FINANCEIRO: '/financeiro',
} as const;
```

**Step 2: Criar `franchise/src/contexts/AuthContext.tsx`**

```typescript
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User { name: string; email: string; role: string; }
interface AuthCtx {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

const MOCK_USER: User = { name: 'Admin Franquia', email: 'franquia@soul540.com', role: 'franqueado' };
const MOCK_EMAIL = 'franquia@soul540.com';
const MOCK_PASSWORD = 'franquia123';
const STORAGE_KEY = 'franchise_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_USER));
      setUser(MOCK_USER);
    } else {
      throw new Error('Email ou senha incorretos');
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**Step 3: Commit**

```bash
git add franchise/src/
git commit -m "feat(franchise): add mock auth context and routes"
```

---

## Task 4: Layout e Sidebar do `franchise/`

**Files:**
- Create: `franchise/src/components/Layout/Layout.tsx`
- Create: `franchise/src/components/Layout/Layout.module.scss`
- Create: `franchise/src/components/Sidebar/Sidebar.tsx`
- Create: `franchise/src/components/Sidebar/Sidebar.module.scss`

**Step 1: Criar `franchise/src/components/Layout/Layout.tsx`**

```typescript
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import styles from './Layout.module.scss';

export default function Layout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
```

**Step 2: Criar `franchise/src/components/Layout/Layout.module.scss`**

Copiar o conteúdo de `src/frontend/components/Layout/Layout.module.scss` integralmente.

**Step 3: Criar `franchise/src/components/Sidebar/Sidebar.tsx`**

```typescript
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes';
import styles from './Sidebar.module.scss';

const navGroups = [
  {
    label: 'Principal',
    items: [{ path: ROUTES.DASHBOARD, label: 'Dashboard', icon: '⊞' }],
  },
  {
    label: 'Gestão',
    items: [
      { path: ROUTES.EVENTOS, label: 'Eventos', icon: '📅' },
      { path: ROUTES.FUNCIONARIOS, label: 'Funcionários', icon: '👤' },
      { path: ROUTES.CONTRATANTES, label: 'Contratantes', icon: '👥' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { path: ROUTES.FINANCEIRO, label: 'Financeiro', icon: '💰' },
    ],
  },
  {
    label: 'Operações',
    items: [
      { path: ROUTES.CARDAPIOS, label: 'Cardápios', icon: '🍽' },
      { path: ROUTES.ESTOQUE_INSUMOS, label: 'Est. Insumos', icon: '📦' },
      { path: ROUTES.ESTOQUE_UTENSILIOS, label: 'Est. Utensílios', icon: '🔧' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { path: ROUTES.PERMISSOES, label: 'Permissões', icon: '🔒' },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoText}>Soul540</span>
        <span className={styles.logoTag}>Franquia</span>
      </div>
      <nav className={styles.nav}>
        {navGroups.map((group) => (
          <div key={group.label} className={styles.navGroup}>
            <span className={styles.navGroupLabel}>{group.label}</span>
            {group.items.map((item) => {
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
        ))}
      </nav>
      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{user?.name?.charAt(0) || 'F'}</div>
          <div className={styles.userDetails}>
            <p className={styles.userName}>{user?.name}</p>
            <p className={styles.userRole}>{user?.role}</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Sair">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
```

**Step 4: Criar `franchise/src/components/Sidebar/Sidebar.module.scss`**

Copiar o conteúdo de `src/frontend/components/Sidebar/Sidebar.module.scss` integralmente — adicionar ao topo:
```scss
@use '../../styles/variables' as *;
```
(substituindo qualquer `@use '../styles/variables'` que já exista)

**Step 5: Commit**

```bash
git add franchise/src/components/
git commit -m "feat(franchise): add layout and sidebar components"
```

---

## Task 5: App.tsx e páginas mock do `franchise/`

**Files:**
- Create: `franchise/src/App.tsx`
- Create: `franchise/src/pages/Login/Login.tsx`
- Create: `franchise/src/pages/Login/Login.module.scss`
- Create: `franchise/src/pages/Dashboard/Dashboard.tsx`
- Create: `franchise/src/pages/[cada módulo]/[Módulo].tsx` (7 páginas)

**Step 1: Criar `franchise/src/App.tsx`**

```typescript
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes';
import Login from '@/pages/Login/Login';
import Layout from '@/components/Layout/Layout';
import Dashboard from '@/pages/Dashboard/Dashboard';
import Funcionarios from '@/pages/Funcionarios/Funcionarios';
import Contratantes from '@/pages/Contratantes/Contratantes';
import Eventos from '@/pages/Eventos/Eventos';
import EstoqueInsumos from '@/pages/EstoqueInsumos/EstoqueInsumos';
import EstoqueUtensilios from '@/pages/EstoqueUtensilios/EstoqueUtensilios';
import Cardapios from '@/pages/Cardapios/Cardapios';
import Permissoes from '@/pages/Permissoes/Permissoes';
import Financeiro from '@/pages/Financeiro/Financeiro';

function PrivateRoute() {
  const { authenticated, loading } = useAuth();
  if (loading) return null;
  return authenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
}

function PublicRoute() {
  const { authenticated, loading } = useAuth();
  if (loading) return null;
  return authenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path={ROUTES.LOGIN} element={<Login />} />
          </Route>
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
              <Route path={ROUTES.FUNCIONARIOS} element={<Funcionarios />} />
              <Route path={ROUTES.CONTRATANTES} element={<Contratantes />} />
              <Route path={ROUTES.EVENTOS} element={<Eventos />} />
              <Route path={ROUTES.ESTOQUE_INSUMOS} element={<EstoqueInsumos />} />
              <Route path={ROUTES.ESTOQUE_UTENSILIOS} element={<EstoqueUtensilios />} />
              <Route path={ROUTES.CARDAPIOS} element={<Cardapios />} />
              <Route path={ROUTES.PERMISSOES} element={<Permissoes />} />
              <Route path={ROUTES.FINANCEIRO} element={<Financeiro />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Step 2: Criar `franchise/src/pages/Login/Login.tsx`**

Copiar `src/frontend/pages/Login/Login.tsx` e `Login.module.scss`, substituindo os imports:
- `@frontend/hooks/useAuth` → `@/contexts/AuthContext`
- `@frontend/routes` → `@/routes`
- `@frontend/components/Button/Button` → criar botão inline ou copiar componente
- `@frontend/components/Input/Input` → criar input inline ou copiar componente

Versão simplificada sem componentes externos:

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes';
import styles from './Login.module.scss';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.branding} />
      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          <h1 className={styles.title}>Soul540 <span>Franquia</span></h1>
          <p className={styles.subtitle}>Acesse sua unidade</p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="franquia@soul540.com" required />
            </div>
            <div className={styles.field}>
              <label>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className={styles.hint}>Email: franquia@soul540.com · Senha: franquia123</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Criar `franchise/src/pages/Login/Login.module.scss`**

Copiar `src/frontend/pages/Login/Login.module.scss`, ajustando imports de variáveis para `@use '../../styles/variables' as *;`

**Step 4: Criar `franchise/src/pages/Dashboard/Dashboard.tsx`**

```typescript
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Dashboard.module.scss';

export default function Dashboard() {
  const { user } = useAuth();
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.dateLabel}>{today}</p>
        <h1 className={styles.title}>{greeting}, {user?.name?.split(' ')[0]}</h1>
        <p className={styles.subtitle}>Bem-vindo ao sistema da sua franquia.</p>
      </div>
      <div className={styles.cards}>
        {[
          { label: 'Eventos este mês', value: '—', color: 'amber' },
          { label: 'Funcionários', value: '—', color: 'blue' },
          { label: 'Receita mensal', value: '—', color: 'green' },
          { label: 'Estoque crítico', value: '—', color: 'red' },
        ].map(card => (
          <div key={card.label} className={`${styles.card} ${styles[card.color]}`}>
            <p className={styles.cardLabel}>{card.label}</p>
            <p className={styles.cardValue}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 5: Criar `franchise/src/pages/Dashboard/Dashboard.module.scss`**

```scss
@use '../../styles/variables' as *;

.page { padding: $spacing-xl; }
.header { margin-bottom: $spacing-xl; }
.dateLabel { font-size: $font-size-sm; color: var(--text-secondary); text-transform: capitalize; margin-bottom: $spacing-xs; }
.title { font-family: $font-display; font-size: $font-size-3xl; font-weight: $font-weight-semibold; margin-bottom: $spacing-xs; }
.subtitle { font-size: $font-size-sm; color: var(--text-secondary); }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: $spacing-md; margin-top: $spacing-xl; }
.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: $radius-md; padding: $spacing-lg; }
.cardLabel { font-size: $font-size-sm; color: var(--text-secondary); margin-bottom: $spacing-sm; }
.cardValue { font-size: $font-size-2xl; font-weight: $font-weight-bold; }
.amber .cardValue { color: $accent; }
.blue .cardValue { color: $info; }
.green .cardValue { color: $success; }
.red .cardValue { color: $danger; }
```

**Step 6: Criar as 7 páginas mock restantes**

Para cada uma das páginas abaixo, criar `franchise/src/pages/[Nome]/[Nome].tsx` com a estrutura padrão:

```typescript
// Exemplo para Funcionarios — repetir para: Contratantes, Eventos,
// EstoqueInsumos, EstoqueUtensilios, Cardapios, Permissoes, Financeiro
import styles from './Funcionarios.module.scss';

export default function Funcionarios() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Funcionários</h1>
        <p className={styles.subtitle}>Gerencie os colaboradores da sua unidade.</p>
      </div>
      <div className={styles.empty}>
        <p>Nenhum registro encontrado.</p>
      </div>
    </div>
  );
}
```

```scss
// [Nome].module.scss — mesmo para todas
@use '../../styles/variables' as *;
.page { padding: $spacing-xl; }
.header { margin-bottom: $spacing-xl; }
.title { font-family: $font-display; font-size: $font-size-2xl; font-weight: $font-weight-semibold; }
.subtitle { font-size: $font-size-sm; color: var(--text-secondary); margin-top: $spacing-xs; }
.empty { background: var(--bg-card); border: 1px solid var(--border); border-radius: $radius-md; padding: $spacing-2xl; text-align: center; color: var(--text-secondary); margin-top: $spacing-xl; }
```

Títulos e subtítulos para cada página:
- **Contratantes** — "Gerencie os clientes da sua unidade."
- **Eventos** — "Acompanhe os eventos agendados."
- **EstoqueInsumos** — "Controle o estoque de insumos."
- **EstoqueUtensilios** — "Controle o estoque de utensílios."
- **Cardapios** — "Cardápios disponíveis na sua unidade."
- **Permissoes** — "Gerencie o acesso dos usuários."
- **Financeiro** — "Acompanhe as finanças da sua unidade."

**Step 7: Commit**

```bash
git add franchise/src/
git commit -m "feat(franchise): add App, Login, Dashboard and all mock pages"
```

---

## Task 6: Testar o app `franchise/` localmente

**Step 1: Rodar o dev server**

```bash
cd franchise && npm run dev
```

Expected: `Local: http://localhost:5174/` (ou porta disponível)

**Step 2: Verificar**
- [ ] Abre na página de login
- [ ] Login com `franquia@soul540.com` / `franquia123` funciona
- [ ] Sidebar mostra todos os módulos
- [ ] Navegar por cada página sem erros no console
- [ ] Logout redireciona para login

**Step 3: Commit**

```bash
git add franchise/
git commit -m "feat(franchise): complete franchise app v1 mock"
```

---

## Task 7: Scaffold do app `factory/` (baseado no franchise)

**Files:**
- Create: `factory/` — estrutura idêntica ao `franchise/`, com as seguintes diferenças:

**Diferenças em relação ao franchise:**

1. `factory/package.json` — nome: `"soul540-factory"`
2. `factory/index.html` — título: `"Soul540 — Fábrica"`
3. `factory/src/contexts/AuthContext.tsx`:
   - `MOCK_USER.name` = `'Admin Fábrica'`
   - `MOCK_USER.email` = `'fabrica@soul540.com'`
   - `MOCK_USER.role` = `'fabrica'`
   - `MOCK_EMAIL` = `'fabrica@soul540.com'`
   - `MOCK_PASSWORD` = `'fabrica123'`
   - `STORAGE_KEY` = `'factory_user'`
4. `factory/src/routes.ts` — sem `CARDAPIOS`
5. `factory/src/components/Sidebar/Sidebar.tsx`:
   - Tag: `'Fábrica'` (em vez de `'Franquia'`)
   - Remover item `Cardápios` do navGroups
6. `factory/src/App.tsx` — sem import/route de `Cardapios`
7. `factory/src/pages/Login/Login.tsx`:
   - Título: `"Soul540 Fábrica"`
   - Hint: `Email: fabrica@soul540.com · Senha: fabrica123`

**Step 1: Copiar e adaptar estrutura**

Criar todos os arquivos acima com as diferenças listadas. As páginas mock (Dashboard, Funcionarios, Contratantes, Eventos, EstoqueInsumos, EstoqueUtensilios, Permissoes, Financeiro) são idênticas ao franchise — copiar e ajustar apenas o `@use` path se necessário.

**Step 2: Instalar dependências**

```bash
cd factory && npm install
```

**Step 3: Testar localmente**

```bash
cd factory && npm run dev
```

Verificar os mesmos itens do Task 6 Step 2, mas sem a página de Cardápios.

**Step 4: Commit**

```bash
git add factory/
git commit -m "feat(factory): complete factory app v1 mock"
```

---

## Task 8: Push final e verificação

**Step 1: Push para o repositório**

```bash
git push origin main
```

**Step 2: Verificação final**
- [ ] `franchise/` roda com `npm run dev` sem erros
- [ ] `factory/` roda com `npm run dev` sem erros
- [ ] Login mock funciona em ambos
- [ ] Todas as páginas renderizam sem erro no console
- [ ] Design consistente com o Soul540 principal
