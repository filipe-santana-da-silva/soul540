import styles from './Contratantes.module.scss';

export default function Contratantes() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contratantes</h1>
        <p className={styles.subtitle}>Gerencie os clientes da sua unidade.</p>
      </div>
      <div className={styles.empty}>
        <p>Nenhum registro encontrado.</p>
      </div>
    </div>
  );
}
