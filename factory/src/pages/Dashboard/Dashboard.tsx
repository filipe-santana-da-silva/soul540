import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Dashboard.module.scss';

export default function Dashboard() {
  const { user } = useAuth();
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.dateLabel}>{today}</p>
        <h1 className={styles.title}>{greeting}, {user?.name?.split(' ')[0]}</h1>
        <p className={styles.subtitle}>Bem-vindo ao sistema da fábrica.</p>
      </div>
      <div className={styles.cards}>
        {[
          { label: 'Eventos este mês', value: '—', color: 'amber' },
          { label: 'Funcionários', value: '—', color: 'blue' },
          { label: 'Receita mensal', value: '—', color: 'green' },
          { label: 'Estoque crítico', value: '—', color: 'red' },
        ].map(card => (
          <div key={card.label} className={`${styles.card} ${styles[card.color]}`}>
            <p className={styles.cardLabel}>{card.label}</p>
            <p className={styles.cardValue}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
