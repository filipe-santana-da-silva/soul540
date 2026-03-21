import styles from './Permissoes.module.scss';

export default function Permissoes() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Permissões</h1>
        <p className={styles.subtitle}>Gerencie o acesso dos usuários.</p>
      </div>
      <div className={styles.empty}>
        <p>Nenhum registro encontrado.</p>
      </div>
    </div>
  );
}
