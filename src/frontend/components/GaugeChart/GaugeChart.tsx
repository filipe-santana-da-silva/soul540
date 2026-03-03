import styles from './GaugeChart.module.scss';

interface GaugeChartProps {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
  color?: string;
  size?: 'sm' | 'md';
}

export default function GaugeChart({ label, value, max = 100, suffix = '%', color = '#f59e0b', size = 'md' }: GaugeChartProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const rotation = (percentage / 100) * 180;

  const getStatus = () => {
    if (label.toLowerCase().includes('lucro')) {
      if (percentage >= 25) return 'good';
      if (percentage >= 15) return 'warning';
      return 'danger';
    }
    if (percentage <= 30) return 'good';
    if (percentage <= 50) return 'warning';
    return 'danger';
  };

  const status = getStatus();

  return (
    <div className={`${styles.gauge} ${styles[size]}`}>
      <div className={styles.gaugeVisual}>
        <div className={styles.gaugeTrack}>
          <div
            className={styles.gaugeFill}
            style={{
              '--rotation': `${rotation}deg`,
              '--color': color,
            } as React.CSSProperties}
          />
        </div>
        <div className={styles.gaugeCenter}>
          <span className={styles.gaugeValue} style={{ color }}>
            {typeof value === 'number' && !suffix.includes('R$')
              ? value.toFixed(1)
              : value.toLocaleString('pt-BR')}
            <span className={styles.gaugeSuffix}>{suffix}</span>
          </span>
        </div>
      </div>
      <p className={styles.gaugeLabel}>{label}</p>
      <div className={`${styles.gaugeStatus} ${styles[status]}`}>
        {status === 'good' ? 'Saudavel' : status === 'warning' ? 'Atencao' : 'Critico'}
      </div>
    </div>
  );
}
