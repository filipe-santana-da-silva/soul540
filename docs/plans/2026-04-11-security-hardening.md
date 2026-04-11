# Security Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix four critical security vulnerabilities: plaintext passwords in DB, JWT in localStorage, missing input validation, and weak tenant isolation.

**Architecture:** Backend changes (Express/Mongoose) + frontend changes across all three apps (main, franchise, factory). No new pages required — all changes are infrastructure-level.

**Tech Stack:** Express, Mongoose, Zod (new), cookie-parser (new), React, TypeScript

---

### Task 1: Remove `passwordPlain` from the database

**Files:**
- Modify: `server/routes/auth.ts`
- Modify: `server/routes/users.ts`
- Modify: `src/frontend/pages/Permissoes/Permissoes.tsx`

**Step 1: Remove `passwordPlain` from UserSchema**

In `server/routes/auth.ts`, remove the field from the schema:
```ts
// REMOVE this line:
passwordPlain: { type: String, default: '' },
```

**Step 2: Remove `passwordPlain` from POST /api/users**

In `server/routes/users.ts`, line 23, remove `passwordPlain: password` from `UserModel.create(...)`:
```ts
// BEFORE:
const user = await UserModel.create({ name: ..., passwordHash, passwordPlain: password, ... });
// AFTER:
const user = await UserModel.create({ name: ..., passwordHash, ... });
```

**Step 3: Remove `passwordPlain` from PUT /api/users/:id**

In `server/routes/users.ts`, lines 40-43:
```ts
// BEFORE:
if (password) {
  update.passwordHash = await bcrypt.hash(password, 10);
  update.passwordPlain = password;
}
// AFTER:
if (password) {
  update.passwordHash = await bcrypt.hash(password, 10);
}
```

**Step 4: Remove `passwordPlain` display from Permissoes page**

In `src/frontend/pages/Permissoes/Permissoes.tsx`:
- Remove the `revealedPasswords` state
- Remove the `passwordPlain` display `<p>` in the user card
- Remove the eye button that reveals the password
- The "Alterar Senha" button (added previously) is the correct secure replacement

Remove these blocks:
```tsx
// REMOVE state:
const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

// REMOVE password display in user card:
{authUser?.isAdmin && u.passwordPlain && (
  <p className={styles.userPassword}>
    {revealedPasswords[u.id] ? u.passwordPlain : '••••••••'}
  </p>
)}

// REMOVE eye button:
{authUser?.isAdmin && u.passwordPlain && (
  <button className={styles.btnEye} ...>
    ...
  </button>
)}
```

Also remove `passwordPlain?` from the `AppUser` type at the top of the file.

**Step 5: Add script to clear existing `passwordPlain` from MongoDB**

Create `server/migrate-remove-plaintext.ts`:
```ts
import 'dotenv/config';
import mongoose from 'mongoose';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const result = await mongoose.connection.collection('users').updateMany(
    {},
    { $unset: { passwordPlain: '' } }
  );
  console.log(`Cleared passwordPlain from ${result.modifiedCount} users`);
  await mongoose.disconnect();
}
run();
```

Run: `npx tsx server/migrate-remove-plaintext.ts`

**Step 6: Commit**
```bash
git add server/routes/auth.ts server/routes/users.ts src/frontend/pages/Permissoes/Permissoes.tsx server/migrate-remove-plaintext.ts
git commit -m "security: remove plaintext password storage from DB and UI"
```

---

### Task 2: Install new dependencies

**Step 1: Install `zod` and `cookie-parser`**
```bash
npm install zod cookie-parser
npm install -D @types/cookie-parser
```

**Step 2: Commit**
```bash
git add package.json package-lock.json
git commit -m "deps: add zod and cookie-parser"
```

---

### Task 3: JWT → httpOnly Cookie

**Files:**
- Modify: `server/routes/auth.ts`
- Modify: `server/middleware/auth.ts`
- Modify: `server/app.ts`
- Modify: `src/backend/infra/repositories/AuthRepository.ts`
- Modify: `src/backend/infra/storage/TokenStorage.ts`
- Modify: `franchise/src/lib/storage.ts`
- Modify: `franchise/src/lib/api.ts`
- Modify: `franchise/src/contexts/AuthContext.tsx`
- Modify: `factory/src/lib/storage.ts` (same pattern as franchise)
- Modify: `factory/src/lib/api.ts` (same pattern as franchise)
- Modify: `factory/src/contexts/AuthContext.tsx` (same pattern as franchise)

**Step 1: Add cookie-parser to `server/app.ts`**
```ts
import cookieParser from 'cookie-parser';
// After `app.use(express.json(...))`
app.use(cookieParser());
```

**Step 2: Update `/api/auth/login` to set httpOnly cookie**

In `server/routes/auth.ts`, replace the `res.json(...)` at the end of the login route:
```ts
// Set httpOnly cookie
res.cookie('soul540_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
});
// Return user info only (no token in body)
res.json({ user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, permissions: user.permissions, unit: userUnit } });
```

**Step 3: Add GET `/api/auth/me` and POST `/api/auth/logout` endpoints**

In `server/routes/auth.ts`:
```ts
// GET /api/auth/me — returns current user from cookie
router.get('/me', async (req, res) => {
  const token = req.cookies?.soul540_token;
  if (!token) return res.status(401).json({ error: 'not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'soul540-secret') as any;
    const user = await UserModel.findById(payload.userId).select('-passwordHash').lean();
    if (!user) return res.status(401).json({ error: 'user not found' });
    res.json({ user: { id: (user as any)._id, name: (user as any).name, email: (user as any).email, isAdmin: (user as any).isAdmin, permissions: (user as any).permissions, unit: (user as any).unit } });
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
});

// POST /api/auth/logout — clears cookie
router.post('/logout', (_req, res) => {
  res.clearCookie('soul540_token', { httpOnly: true, sameSite: 'strict' });
  res.json({ ok: true });
});
```

**Step 4: Update `authMiddleware` to read cookie (with Bearer fallback)**

In `server/middleware/auth.ts`:
```ts
export async function authMiddleware(req: any, res: any, next: any) {
  // Try cookie first, then Authorization header (backward compat)
  let token: string | undefined = req.cookies?.soul540_token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
  }
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'soul540-secret') as any;
    const user = await UserModel.findById(payload.userId).lean();
    if (user) (req as any).user = user;
  } catch {
    // invalid/expired token — continue without user
  }
  next();
}
```

**Step 5: Update main app `TokenStorage` to stop storing token**

In `src/backend/infra/storage/TokenStorage.ts`:
```ts
const USER_KEY = 'soul540_user';

export const TokenStorage = {
  // Token is now in httpOnly cookie — no localStorage methods needed
  getUser<T>(): T | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
  setUser<T>(user: T): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  },
  clear(): void {
    this.removeUser();
    // Also clear old token if it exists from before this migration
    localStorage.removeItem('soul540_token');
  },
};
```

**Step 6: Update main app `AuthRepository`**

In `src/backend/infra/repositories/AuthRepository.ts`:
```ts
export class AuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // send/receive cookies
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Email ou senha incorretos');
    }
    const data = await res.json();
    TokenStorage.setUser(data.user); // store only non-sensitive user profile
    return { user: data.user, token: '' };
  }

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    TokenStorage.clear();
  }

  async getCurrentUser(): Promise<User | null> {
    // Try localStorage cache first for instant render
    const cached = TokenStorage.getUser<User>();
    if (cached) return cached;
    // Fallback: verify with server (cookie is sent automatically)
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      TokenStorage.setUser(data.user);
      return data.user;
    } catch {
      return null;
    }
  }
}
```

**Step 7: Update franchise `storage.ts`**

In `franchise/src/lib/storage.ts` — remove token methods, keep only user:
```ts
const USER_KEY = 'soul540_user';

export const Storage = {
  getUser: <T>(): T | null => {
    try {
      const d = localStorage.getItem(USER_KEY);
      return d ? JSON.parse(d) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
  setUser: <T>(u: T) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clear: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('soul540_token'); // clean up old token
  },
};
```

**Step 8: Update franchise `api.ts`**

In `franchise/src/lib/api.ts` — add `credentials: 'include'`, remove token from header:
```ts
const BASE = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include', // cookie sent automatically
    headers: {
      'Content-Type': 'application/json',
      'X-System': 'franchise',
      ...(options.headers || {}),
    },
  });
}
```

**Step 9: Update franchise `AuthContext.tsx`**

In `franchise/src/contexts/AuthContext.tsx`:
```ts
useEffect(() => {
  // Try cache first, then verify with server
  const cached = Storage.getUser<User>();
  if (cached) {
    setUser(cached);
    setLoading(false);
    return;
  }
  apiFetch('/api/auth/me')
    .then(r => r.ok ? r.json() : null)
    .then(data => { if (data?.user) { Storage.setUser(data.user); setUser(data.user); } })
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);

const login = async (email: string, password: string) => {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Email ou senha incorretos');
  }
  const data = await res.json();
  Storage.setUser(data.user); // no token in response
  setUser(data.user);
};

const logout = () => {
  apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  Storage.clear();
  setUser(null);
};
```

**Step 10: Apply same changes to factory app**

Repeat Steps 7-9 for:
- `factory/src/lib/storage.ts`
- `factory/src/lib/api.ts` (use `'X-System': 'factory'`)
- `factory/src/contexts/AuthContext.tsx`

**Step 11: Update AppContext in all three apps to add `credentials: 'include'`**

Any `fetch()` call in AppContext that hits `/api/*` must add `credentials: 'include'`. In the main app's `src/frontend/contexts/AppContext.tsx`, all fetch calls need this. The franchise/factory use `apiFetch` which already includes it after Step 8/10.

For the main app, create a helper `src/frontend/lib/api.ts`:
```ts
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}
```
Then replace bare `fetch('/api/...')` calls in AppContext with `apiFetch(...)`.

**Step 12: Commit**
```bash
git add -A
git commit -m "security: migrate JWT from localStorage to httpOnly cookie"
```

---

### Task 4: Input Validation with Zod

**Files:**
- Create: `server/middleware/validate.ts`
- Create: `server/schemas/auth.ts`
- Create: `server/schemas/users.ts`
- Create: `server/schemas/finances.ts`
- Modify: `server/routes/auth.ts`
- Modify: `server/routes/users.ts`
- Modify: `server/routes/finances.ts`

**Step 1: Create validation middleware**

Create `server/middleware/validate.ts`:
```ts
import { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ error: messages });
    }
    req.body = result.data; // replace with parsed/coerced data
    next();
  };
}
```

**Step 2: Create auth schemas**

Create `server/schemas/auth.ts`:
```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'Senha obrigatória'),
});
```

**Step 3: Create user schemas**

Create `server/schemas/users.ts`:
```ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').trim(),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha mínimo 6 caracteres'),
  isAdmin: z.boolean().optional().default(false),
  unit: z.enum(['main', 'franchise', 'factory']).optional().default('main'),
  permissions: z.array(z.string()).optional().default([]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).trim().optional(),
  isAdmin: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  password: z.string().min(6, 'Senha mínimo 6 caracteres').optional(),
});
```

**Step 4: Create finance schemas**

Create `server/schemas/finances.ts`:
```ts
import { z } from 'zod';

export const createFinanceSchema = z.object({
  eventId: z.string().optional().default(''),
  type: z.enum(['revenue', 'cost']),
  category: z.string().min(1, 'Categoria obrigatória').trim(),
  description: z.string().min(1, 'Descrição obrigatória').trim(),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
  status: z.enum(['pending', 'paid', 'received']).optional().default('pending'),
  autoEventBudget: z.boolean().optional().default(false),
});

export const updateFinanceSchema = createFinanceSchema.partial();
```

**Step 5: Apply validation to `server/routes/auth.ts`**
```ts
import { validate } from '../middleware/validate';
import { loginSchema } from '../schemas/auth';

router.post('/login', validate(loginSchema), async (req, res) => {
  // req.body is now typed and validated
  ...
});
```

**Step 6: Apply validation to `server/routes/users.ts`**
```ts
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../schemas/users';

router.post('/', validate(createUserSchema), async (req, res) => { ... });
router.put('/:id', validate(updateUserSchema), async (req, res) => { ... });
```

**Step 7: Apply validation to `server/routes/finances.ts`**
```ts
import { validate } from '../middleware/validate';
import { createFinanceSchema, updateFinanceSchema } from '../schemas/finances';

router.post('/', validate(createFinanceSchema), async (req, res) => { ... });
router.put('/:id', validate(updateFinanceSchema), async (req, res) => { ... });
```

**Step 8: Commit**
```bash
git add server/middleware/validate.ts server/schemas/ server/routes/auth.ts server/routes/users.ts server/routes/finances.ts
git commit -m "security: add Zod input validation to auth, users, and finances routes"
```

---

### Task 5: Fix Tenant Isolation

**Files:**
- Modify: `server/middleware/tenant.ts`

**Problem:** Non-admin users with `unit: 'franchise'` can send `X-System: main` and get main tenant data.

**Fix:** Lock authenticated non-main users to their own unit, regardless of X-System header.

**Step 1: Update `resolveUnit` in `server/middleware/tenant.ts`**
```ts
function resolveUnit(req: any): string {
  const userUnit = req.user?.unit;

  // Authenticated non-admin users are ALWAYS locked to their own unit
  if (req.user && !req.user.isAdmin && userUnit && userUnit !== 'main') {
    return userUnit;
  }

  // For unauthenticated requests or main/admin users, trust X-System header
  const xSystem = req.headers?.['x-system'];
  if (xSystem === 'franchise' || xSystem === 'factory') return xSystem;

  // Fall back to user's unit (handles admin accessing a specific system)
  if (userUnit && userUnit !== 'main') return userUnit;

  return 'main';
}
```

**Step 2: Commit**
```bash
git add server/middleware/tenant.ts
git commit -m "security: lock non-admin users to their own tenant unit"
```

---

### Task 6: Final — run migration and push

**Step 1: Run the plaintext password migration**
```bash
npx tsx server/migrate-remove-plaintext.ts
```

**Step 2: Build and test**
```bash
npm run build
```

**Step 3: Push**
```bash
git push
```
