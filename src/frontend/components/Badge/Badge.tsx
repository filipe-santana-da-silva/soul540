import type { ReactNode } from 'react';
import styles from './Badge.module.scss';

interface BadgeProps {
  children: ReactNode;
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'purple';
}

export default function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
}
