import { useMemo, useState } from 'react';
import { useApp } from '@frontend/contexts/AppContext';
import { useAuth } from '@frontend/hooks/useAuth';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CalendarView from '@frontend/components/CalendarView/CalendarView';
import styles from './Dashboard.module.scss';

function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  const firstName = name?.split(' ')[0] || '';
  const suffix = firstName ? `, ${firstName}` : '';
  if (hour < 12) return `Bom dia${suffix}`;
  if (hour < 18) return `Boa tarde${suffix}`;
  return `Boa noite${suffix}`;
}

export default function Dashboard() {
  const { events, tasks } = useApp();
  const { user } = useAuth();
  const [showInfo, setShowInfo] = useState(false);

  const urgentTasks = useMemo(() => tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done'), [tasks]);

  const now = new Date();
  const monthEventCount = useMemo(() => {
    return events.filter((e) => {
      const d = parseISO(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [events]);

  const today = format(now, "EEEE, d 'de' MMMM", { locale: ptBR });
  const currentMonth = format(now, 'MMMM', { locale: ptBR });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.dateLabel}>{today}</p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{getGreeting(user?.name)}</h1>
            <button className={styles.btnInfo} onClick={() => setShowInfo(true)} title="Sobre o Dashboard">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
          </div>
          {urgentTasks.length > 0 ? (
            <p className={styles.subtitle}>
              Você tem <strong>{urgentTasks.length} tarefa{urgentTasks.length > 1 ? 's' : ''} urgente{urgentTasks.length > 1 ? 's' : ''}</strong> pendente{urgentTasks.length > 1 ? 's' : ''} hoje.
            </p>
          ) : (
            <p className={styles.subtitle}>Nenhuma urgência no momento — tudo sob controle.</p>
          )}
        </div>
      </div>


{/* Calendar */}
      <div className={styles.calendarSection}>
        <div className={styles.calendarHeader}>
          <span className={styles.calendarMonth}>{currentMonth}</span>
          <span className={styles.calendarCount}>
            {monthEventCount} evento{monthEventCount !== 1 ? 's' : ''}
          </span>
        </div>
        <CalendarView events={events} />
      </div>

      {showInfo && (
        <div className={styles.overlay} onClick={() => setShowInfo(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Sobre o Dashboard</h2>
              <button className={styles.modalClose} onClick={() => setShowInfo(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>O que é o Dashboard?</p>
                <p className={styles.infoText}>
                  O <strong>Dashboard</strong> é a tela inicial do sistema. Ele exibe uma visão geral dos eventos do mês em um calendário interativo, alertas de tarefas urgentes e as principais métricas do negócio.
                </p>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Calendário de eventos</p>
                <ul className={styles.infoList}>
                  <li>Exibe todos os agendamentos cadastrados no mês atual.</li>
                  <li>Clique em um evento para ver seus detalhes completos.</li>
                  <li>Use as setas para navegar entre os meses.</li>
                  <li>O contador acima mostra quantos eventos há no mês em exibição.</li>
                </ul>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <span />
              <button className={styles.btnPrimary} onClick={() => setShowInfo(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
