import styles from './Eventos.module.scss';

export default function Eventos() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Eventos</h1>
        <p className={styles.subtitle}>Acompanhe os eventos agendados.</p>
      </div>
      <div className={styles.empty}>
        <p>Nenhum registro encontrado.</p>
      </div>
    </div>
  );
}
