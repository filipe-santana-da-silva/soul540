import styles from './HorizontalBarChart.module.scss';

interface BarItem {
  label: string;
  value: number;
  color: string;
}

interface HorizontalBarChartProps {
  title: string;
  items: BarItem[];
  formatValue?: (value: number) => string;
}

export default function HorizontalBarChart({ title, items, formatValue }: HorizontalBarChartProps) {
  const maxValue = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((acc, i) => acc + i.value, 0);

  const format = formatValue ?? ((v: number) => `R$ ${v.toLocaleString('pt-BR')}`);

  return (
    <div className={styles.chart}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.total}>{format(total)}</span>
      </div>
      <div className={styles.bars}>
        {items.map((item) => {
          const pct = (item.value / maxValue) * 100;
          return (
            <div key={item.label} className={styles.barRow}>
              <div className={styles.barLabel}>
                <span className={styles.barDot} style={{ background: item.color }} />
                <span className={styles.barName}>{item.label}</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${pct}%`, background: item.color }}
                />
              </div>
              <span className={styles.barValue}>{format(item.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
