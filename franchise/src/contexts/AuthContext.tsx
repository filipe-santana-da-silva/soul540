import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import { Storage } from '@/lib/storage';

interface User { id: string; name: string; email: string; isAdmin: boolean; permissions: string[]; unit: string; }
interface AuthCtx {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = Storage.getUser<User>();
    if (stored) setUser(stored);
    setLoading(false);
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
    Storage.setToken(data.token);
    Storage.setUser(data.user);
    setUser(data.user);
  };

  const logout = () => {
    Storage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
