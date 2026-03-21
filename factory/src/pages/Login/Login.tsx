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
          <h1 className={styles.title}>Soul540 <span>Fábrica</span></h1>
          <p className={styles.subtitle}>Acesse sua unidade</p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="fabrica@soul540.com" required />
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
          <p className={styles.hint}>Email: fabrica@soul540.com · Senha: fabrica123</p>
        </div>
      </div>
    </div>
  );
}
