import styles from './EstoqueInsumos.module.scss';

export default function EstoqueInsumos() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Estoque de Insumos</h1>
        <p className={styles.subtitle}>Controle o estoque de insumos.</p>
      </div>
      <div className={styles.empty}>
        <p>Nenhum registro encontrado.</p>
      </div>
    </div>
  );
}
