import styles from './EstoqueUtensilios.module.scss';

export default function EstoqueUtensilios() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Estoque de Utensílios</h1>
        <p className={styles.subtitle}>Controle o estoque de utensílios.</p>
      </div>
      <div className={styles.empty}>
        <p>Nenhum registro encontrado.</p>
      </div>
    </div>
  );
}
