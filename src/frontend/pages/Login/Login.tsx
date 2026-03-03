import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@frontend/hooks/useAuth';
import { ROUTES } from '@frontend/routes';
import Button from '@frontend/components/Button/Button';
import Input from '@frontend/components/Input/Input';
import Logo from '@frontend/components/Logo/Logo';
import styles from './Login.module.scss';


export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
      {/* Lado esquerdo - Branding */}
      <div className={styles.branding} />

      {/* Lado direito - Formulario */}
      <div className={styles.formSide}>
        <div className={styles.formContainer}>


          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formFields}>
              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <div>
                <Input
                  label="Senha"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <div className={styles.forgotPassword}>
                  <button type="button" className={styles.forgotLink}>
                    Esqueceu a senha?
                  </button>
                </div>
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.formActions}>
              <Button type="submit" fullWidth loading={loading}>
                Entrar
              </Button>
            </div>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>© 2025 Soul540 — Gestão de Eventos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
