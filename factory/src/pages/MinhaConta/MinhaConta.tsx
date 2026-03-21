import type { FormEvent } from 'react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './MinhaConta.module.scss';

export default function MinhaConta() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Minha Conta</h1>
        <p className={styles.subtitle}>Gerencie seu perfil</p>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.profileAvatar}>{user?.name?.charAt(0) || 'F'}</div>
        <div className={styles.profileInfo}>
          <h2 className={styles.profileName}>{user?.name}</h2>
          <p className={styles.profileRole}>{user?.isAdmin ? 'Administrador' : 'Colaborador'}</p>
          <p className={styles.profileEmail}>{user?.email}</p>
        </div>
      </div>

      {saved && (
        <div className={styles.toast}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Salvo com sucesso!
        </div>
      )}

      <form className={styles.form} onSubmit={handleSave}>
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Dados Pessoais</h3>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Nome Completo</label>
              <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Telefone</label>
              <input className={styles.formInput} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
            </div>
            <div className={`${styles.formField} ${styles.formFieldFull}`}>
              <label className={styles.formLabel}>Endereço</label>
              <input className={styles.formInput} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" />
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.btnSave}>Salvar Alterações</button>
        </div>
      </form>

      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>Aparência</h3>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Modo Claro</span>
            <span className={styles.settingDesc}>Alterna entre tema escuro e claro</span>
          </div>
          <label className={styles.toggle}>
            <input type="checkbox" checked={!isDark} onChange={toggleTheme} />
            <span className={styles.toggleSlider} />
          </label>
        </div>
      </div>
    </div>
  );
}
