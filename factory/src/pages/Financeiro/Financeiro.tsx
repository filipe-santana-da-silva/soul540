import styles from './Financeiro.module.scss';

export default function Financeiro() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Financeiro</h1>
        <p className={styles.subtitle}>Acompanhe as finanças da sua unidade.</p>
      </div>
      <div className={styles.empty}>
        <p>Nenhum registro encontrado.</p>
      </div>
    </div>
  );
}
