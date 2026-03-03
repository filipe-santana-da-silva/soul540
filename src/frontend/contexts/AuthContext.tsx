import type { ReactNode } from 'react';
import { createContext, useCallback, useEffect, useState } from 'react';
import type { User } from '@backend/domain/entities/User';
import { AuthRepository } from '@backend/infra/repositories/AuthRepository';
import { LoginUseCase } from '@backend/usecases/LoginUseCase';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const authRepository = new AuthRepository();
const loginUseCase = new LoginUseCase(authRepository);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authRepository.getCurrentUser().then((storedUser) => {
      if (storedUser) {
        setUser(storedUser);
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await loginUseCase.execute({ email, password });
      setUser(result.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authRepository.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
