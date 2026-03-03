import type { ReactNode } from 'react';
import styles from './Modal.module.scss';

interface ModalProps {
  children: ReactNode;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose: () => void;
}

export default function Modal({ children, title, size = 'md', onClose }: ModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            X
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
}
