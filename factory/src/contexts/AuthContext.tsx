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

const MOCK_USER: User = { name: 'Admin Fábrica', email: 'fabrica@soul540.com', role: 'fabrica' };
const MOCK_EMAIL = 'fabrica@soul540.com';
const MOCK_PASSWORD = 'fabrica123';
const STORAGE_KEY = 'factory_user';

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
