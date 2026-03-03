import styles from './Logo.module.scss';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ size = 'md' }: LogoProps) {
  return (
    <div className={`${styles.logo} ${styles[size]}`}>
      <div className={styles.icon}>S</div>
      <span className={styles.text}>Soul540</span>
    </div>
  );
}
