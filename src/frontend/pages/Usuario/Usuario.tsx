import type { FormEvent } from 'react';
import { useState } from 'react';
import { useAuth } from '@frontend/hooks/useAuth';
import { useTheme } from '@frontend/contexts/ThemeContext';
import Button from '@frontend/components/Button/Button';
import styles from './Usuario.module.scss';

export default function Usuario() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Profile form
  const [name, setName] = useState(user?.name || 'Administrador');
  const [phone, setPhone] = useState('(11) 99999-0000');
  const [address, setAddress] = useState('Rua das Pizzas, 540 - Sao Paulo, SP');
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Minha Conta</h1>
          <p className={styles.subtitle}>Gerencie seu perfil</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.profileAvatar}>
          {user?.name?.charAt(0) || 'A'}
        </div>
        <div className={styles.profileInfo}>
          <h2 className={styles.profileName}>{user?.name || 'Administrador'}</h2>
          <p className={styles.profileRole}>{user?.role === 'admin' ? 'Administrador' : user?.role === 'manager' ? 'Gerente' : 'Equipe'}</p>
          <p className={styles.profileEmail}>{user?.email || 'admin@soul540.com'}</p>
        </div>
        <div className={styles.profileStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>5</span>
            <span className={styles.statLabel}>Eventos</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>7</span>
            <span className={styles.statLabel}>Tarefas</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>2</span>
            <span className={styles.statLabel}>Notas</span>
          </div>
        </div>
      </div>

      {/* Toast */}
      {saved && (
        <div className={styles.toast}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Salvo com sucesso!
        </div>
      )}

      <div className={styles.tabContent}>
        <form className={styles.form} onSubmit={handleSaveProfile}>
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>Dados Pessoais</h3>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Nome Completo</label>
                <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Telefone</label>
                <input className={styles.formInput} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label className={styles.formLabel}>Endereco</label>
                <input className={styles.formInput} value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>Aparencia</h3>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Modo Escuro</span>
                <span className={styles.settingDesc}>Tema escuro para o sistema</span>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" checked={isDark} onChange={toggleTheme} />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="submit">Salvar Alteracoes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
