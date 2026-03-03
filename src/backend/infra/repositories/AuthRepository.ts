import type { User } from '@backend/domain/entities/User';
import type { IAuthRepository, LoginCredentials, AuthResult } from '@backend/domain/repositories/IAuthRepository';
import { TokenStorage } from '../storage/TokenStorage';

export class AuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // TODO: substituir por chamada real a API
    // Simulacao temporaria para desenvolvimento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (credentials.email === 'admin@soul540.com' && credentials.password === '123456') {
      const user: User = {
        id: '1',
        name: 'Administrador',
        email: credentials.email,
        role: 'admin',
      };
      const token = 'mock-jwt-token-' + Date.now();

      TokenStorage.setToken(token);
      TokenStorage.setUser(user);

      return { user, token };
    }

    throw new Error('Email ou senha incorretos');
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
