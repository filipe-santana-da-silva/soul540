import type { IAuthRepository, LoginCredentials, AuthResult } from '@backend/domain/repositories/IAuthRepository';
import { isValidEmail, isValidPassword } from '@backend/shared/utils/validators';

export class LoginUseCase {
  private authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  async execute(credentials: LoginCredentials): Promise<AuthResult> {
    if (!credentials.email || !isValidEmail(credentials.email)) {
      throw new Error('Email invalido');
    }

    if (!credentials.password || !isValidPassword(credentials.password)) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    return this.authRepository.login(credentials);
  }
}
