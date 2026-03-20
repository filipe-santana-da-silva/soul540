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
