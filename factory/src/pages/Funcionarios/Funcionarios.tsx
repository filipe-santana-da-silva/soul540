import styles from './Funcionarios.module.scss';

export default function Funcionarios() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Funcionários</h1>
        <p className={styles.subtitle}>Gerencie os colaboradores da sua unidade.</p>
      </div>
      <div className={styles.empty}>
        <p>Nenhum registro encontrado.</p>
      </div>
    </div>
  );
}
