import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes';
import styles from './Sidebar.module.scss';

const navGroups = [
  {
    label: 'Principal',
    items: [{ path: ROUTES.DASHBOARD, label: 'Dashboard', icon: '⊞' }],
  },
  {
    label: 'Gestão',
    items: [
      { path: ROUTES.EVENTOS, label: 'Eventos', icon: '📅' },
      { path: ROUTES.FUNCIONARIOS, label: 'Funcionários', icon: '👤' },
      { path: ROUTES.CONTRATANTES, label: 'Contratantes', icon: '👥' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { path: ROUTES.FINANCEIRO, label: 'Financeiro', icon: '💰' },
    ],
  },
  {
    label: 'Operações',
    items: [
      { path: ROUTES.ESTOQUE_INSUMOS, label: 'Est. Insumos', icon: '📦' },
      { path: ROUTES.ESTOQUE_UTENSILIOS, label: 'Est. Utensílios', icon: '🔧' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { path: ROUTES.PERMISSOES, label: 'Permissões', icon: '🔒' },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoText}>Soul540</span>
        <span className={styles.logoTag}>Fábrica</span>
      </div>
      <nav className={styles.nav}>
        {navGroups.map((group) => (
          <div key={group.label} className={styles.navGroup}>
            <span className={styles.navGroupLabel}>{group.label}</span>
            {group.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  {isActive && <span className={styles.activeIndicator} />}
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{user?.name?.charAt(0) || 'F'}</div>
          <div className={styles.userDetails}>
            <p className={styles.userName}>{user?.name}</p>
            <p className={styles.userRole}>{user?.role}</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Sair">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
