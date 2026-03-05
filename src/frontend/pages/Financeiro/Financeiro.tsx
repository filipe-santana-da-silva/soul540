import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@frontend/contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { FinanceType, FinanceStatus } from '@backend/domain/entities/Finance';
import { FIXED_CATEGORIES, VARIABLE_CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '@backend/infra/data/mockData';
import GaugeChart from '@frontend/components/GaugeChart/GaugeChart';
import HorizontalBarChart from '@frontend/components/HorizontalBarChart/HorizontalBarChart';
import Badge from '@frontend/components/Badge/Badge';
import Button from '@frontend/components/Button/Button';
import Modal from '@frontend/components/Modal/Modal';
import styles from './Financeiro.module.scss';

type TabType = 'geral' | 'despesas' | 'mensal' | 'lancamentos';
type FilterType = 'all' | 'revenue' | 'cost';
type CostFilter = 'all' | 'fixed' | 'variable';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const statusLabels: Record<FinanceStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  received: 'Recebido',
};

const statusColors: Record<FinanceStatus, 'amber' | 'green'> = {
  pending: 'amber',
  paid: 'green',
  received: 'green',
};

const formCategories: Record<FinanceType, string[]> = {
  revenue: ['contrato', 'adicional', 'taxa', 'outro'],
  cost: [...FIXED_CATEGORIES, ...VARIABLE_CATEGORIES],
};

const formatBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

export default function Financeiro() {
  const { events, finances, addFinance, updateFinance, deleteFinance } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('geral');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [costFilter, setCostFilter] = useState<CostFilter>('all');

  // Table filters
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formType, setFormType] = useState<FinanceType>('revenue');
  const [formEventId, setFormEventId] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<FinanceStatus>('pending');

  // === DATA COMPUTATIONS ===

  const totalRevenue = useMemo(
    () => finances.filter((f) => f.type === 'revenue').reduce((acc, f) => acc + f.amount, 0),
    [finances],
  );
  const totalCosts = useMemo(
    () => finances.filter((f) => f.type === 'cost').reduce((acc, f) => acc + f.amount, 0),
    [finances],
  );
  const profit = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; receita: number; despesa: number }>();
    for (const f of finances) {
      const ym = f.date.substring(0, 7);
      if (!map.has(ym)) map.set(ym, { month: ym, receita: 0, despesa: 0 });
      const entry = map.get(ym)!;
      if (f.type === 'revenue') entry.receita += f.amount;
      else entry.despesa += f.amount;
    }
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [finances]);

  // Available months for selector
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const f of finances) set.add(f.date.substring(0, 7));
    return [...set].sort();
  }, [finances]);

  // Auto-select most recent month when finances load
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths]);

  // Monthly detail data
  const monthFinances = useMemo(
    () => finances.filter((f) => f.date.startsWith(selectedMonth)),
    [finances, selectedMonth],
  );

  const monthRevenue = useMemo(
    () => monthFinances.filter((f) => f.type === 'revenue').reduce((acc, f) => acc + f.amount, 0),
    [monthFinances],
  );
  const monthCosts = useMemo(
    () => monthFinances.filter((f) => f.type === 'cost').reduce((acc, f) => acc + f.amount, 0),
    [monthFinances],
  );
  const monthProfit = monthRevenue - monthCosts;
  const monthMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;

  // Category breakdowns for selected month
  const fixedCosts = useMemo(() => {
    const costs: Record<string, number> = {};
    for (const f of monthFinances) {
      if (f.type === 'cost' && (FIXED_CATEGORIES as readonly string[]).includes(f.category)) {
        costs[f.category] = (costs[f.category] || 0) + f.amount;
      }
    }
    return Object.entries(costs)
      .map(([cat, val]) => ({
        label: CATEGORY_LABELS[cat] || cat,
        value: val,
        color: CATEGORY_COLORS[cat] || '#64748b',
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthFinances]);

  const variableCosts = useMemo(() => {
    const costs: Record<string, number> = {};
    for (const f of monthFinances) {
      if (f.type === 'cost' && (VARIABLE_CATEGORIES as readonly string[]).includes(f.category)) {
        costs[f.category] = (costs[f.category] || 0) + f.amount;
      }
    }
    return Object.entries(costs)
      .map(([cat, val]) => ({
        label: CATEGORY_LABELS[cat] || cat,
        value: val,
        color: CATEGORY_COLORS[cat] || '#64748b',
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthFinances]);

  // Gauge values for selected month
  const insumosRatio = useMemo(() => {
    const insumos = monthFinances
      .filter((f) => f.type === 'cost' && f.category === 'insumos')
      .reduce((acc, f) => acc + f.amount, 0);
    return monthRevenue > 0 ? (insumos / monthRevenue) * 100 : 0;
  }, [monthFinances, monthRevenue]);

  const maoObraRatio = useMemo(() => {
    const mo = monthFinances
      .filter((f) => f.type === 'cost' && (f.category === 'salario' || f.category === 'pro-labore'))
      .reduce((acc, f) => acc + f.amount, 0);
    return monthRevenue > 0 ? (mo / monthRevenue) * 100 : 0;
  }, [monthFinances, monthRevenue]);

  // Table filter
  const filtered = useMemo(() => {
    return finances.filter((f) => {
      if (filterType !== 'all' && f.type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        const event = events.find((e) => e.id === f.eventId);
        return (
          f.description.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          event?.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [finances, filterType, search, events]);

  // Events with budget joined with their finance entry
  const eventsWithBudget = useMemo(() => {
    return events
      .filter((e) => e.budget > 0)
      .map((e) => ({
        event: e,
        finance: finances.find(
          (f) => f.eventId === e.id && f.type === 'revenue' && f.category === 'contrato',
        ),
      }))
      .sort((a, b) => b.event.date.localeCompare(a.event.date));
  }, [events, finances]);

  const totalContracted = useMemo(
    () => eventsWithBudget.reduce((acc, { event }) => acc + event.budget, 0),
    [eventsWithBudget],
  );
  const totalReceived = useMemo(
    () => eventsWithBudget
      .filter(({ finance }) => finance?.status === 'received')
      .reduce((acc, { event }) => acc + event.budget, 0),
    [eventsWithBudget],
  );

  // === HANDLERS ===

  const handleEventFinanceStatus = async (financeId: string, status: FinanceStatus) => {
    await updateFinance(financeId, { status });
  };

  const resetForm = () => {
    setFormType('revenue');
    setFormEventId('');
    setFormCategory('');
    setFormDescription('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatus('pending');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formEventId || !formCategory || !formDescription || !formAmount) return;
    await addFinance({
      eventId: formEventId,
      type: formType,
      category: formCategory,
      description: formDescription,
      amount: parseFloat(formAmount),
      date: formDate,
      status: formStatus,
    });
    resetForm();
    setShowForm(false);
  };

  // === RENDER ===

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Financeiro</h1>
          <p className={styles.subtitle}>Controle completo de receitas, despesas e indicadores</p>
        </div>
        <div className={styles.headerActions}>
          <Button onClick={() => setShowForm(true)}>+ Novo Lancamento</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {([
          ['geral', 'Visao Geral'],
          ['despesas', 'Painel Despesas'],
          ['mensal', 'Painel Mensal'],
          ['lancamentos', 'Lancamentos'],
        ] as [TabType, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ===== TAB: VISAO GERAL ===== */}
      {activeTab === 'geral' && (
        <div className={styles.tabContent}>
          {/* Summary Bar */}
          <div className={styles.summaryBar}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryItemLabel}>Receita Total</span>
              <span className={`${styles.summaryItemValue} ${styles.green}`}>{formatBRL(totalRevenue)}</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryItemLabel}>Despesas Total</span>
              <span className={`${styles.summaryItemValue} ${styles.red}`}>{formatBRL(totalCosts)}</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryItemLabel}>{profit >= 0 ? 'Lucro' : 'Prejuizo'}</span>
              <span className={`${styles.summaryItemValue} ${profit >= 0 ? styles.green : styles.red}`}>
                {formatBRL(Math.abs(profit))}
              </span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryItemLabel}>Margem</span>
              <span className={`${styles.summaryItemValue} ${styles.amber}`}>{margin.toFixed(1)}%</span>
            </div>
          </div>

          {/* Revenue vs Costs Chart */}
          <div className={styles.chartSection}>
            <h3 className={styles.sectionTitle}>Receita x Despesas por Mes</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyData} barGap={4} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a2235',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '13px',
                    }}
                    formatter={(value: unknown) => [formatBRL(Number(value))]}
                    labelFormatter={(label: unknown) => formatMonth(String(label))}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                  />
                  <Bar dataKey="receita" name="Receita" fill="#4ade80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gauges */}
          <div className={styles.gaugesGrid}>
            <div className={styles.gaugeCard}>
              <GaugeChart
                label="Margem de Lucro"
                value={margin}
                max={100}
                suffix="%"
                color={margin >= 20 ? '#4ade80' : margin >= 10 ? '#fbbf24' : '#f87171'}
              />
            </div>
            <div className={styles.gaugeCard}>
              <GaugeChart
                label="Insumos / Receita"
                value={insumosRatio}
                max={100}
                suffix="%"
                color={insumosRatio <= 30 ? '#4ade80' : insumosRatio <= 45 ? '#fbbf24' : '#f87171'}
              />
            </div>
            <div className={styles.gaugeCard}>
              <GaugeChart
                label="Mao de Obra / Receita"
                value={maoObraRatio}
                max={100}
                suffix="%"
                color={maoObraRatio <= 25 ? '#4ade80' : maoObraRatio <= 40 ? '#fbbf24' : '#f87171'}
              />
            </div>
          </div>

          {/* Events Budget Card */}
          <div className={styles.agendamentosCard}>
            <div className={styles.agendamentosHeader}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Valores dos Agendamentos</h3>
              <div className={styles.agendamentosPills}>
                <div className={styles.agendamentosPill}>
                  <span className={styles.agendamentosPillLabel}>Contratado</span>
                  <span className={styles.agendamentosPillValue}>{formatBRL(totalContracted)}</span>
                </div>
                <div className={styles.agendamentosPill}>
                  <span className={styles.agendamentosPillLabel}>Recebido</span>
                  <span className={`${styles.agendamentosPillValue} ${styles.green}`}>{formatBRL(totalReceived)}</span>
                </div>
                <div className={styles.agendamentosPill}>
                  <span className={styles.agendamentosPillLabel}>Pendente</span>
                  <span className={`${styles.agendamentosPillValue} ${styles.amber}`}>{formatBRL(totalContracted - totalReceived)}</span>
                </div>
              </div>
            </div>

            {eventsWithBudget.length === 0 ? (
              <p className={styles.agendamentosEmpty}>Nenhum agendamento com valor cadastrado.</p>
            ) : (
              <div className={styles.agendamentosList}>
                {eventsWithBudget.map(({ event, finance }) => (
                  <div key={event.id} className={styles.agendamentoRow}>
                    <div className={styles.agendamentoInfo}>
                      <span className={styles.agendamentoName}>{event.name}</span>
                      <span className={styles.agendamentoDate}>
                        {format(parseISO(event.date), "dd 'de' MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className={styles.agendamentoRight}>
                      <span className={styles.agendamentoValue}>{formatBRL(event.budget)}</span>
                      {finance ? (
                        <select
                          className={`${styles.agendamentoStatus} ${finance.status === 'received' ? styles.statusReceived : styles.statusPending}`}
                          value={finance.status}
                          onChange={(e) => handleEventFinanceStatus(finance.id, e.target.value as FinanceStatus)}
                        >
                          <option value="pending">Pendente</option>
                          <option value="received">Recebido</option>
                        </select>
                      ) : (
                        <span className={styles.agendamentoNoFinance}>—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB: PAINEL DESPESAS ===== */}
      {activeTab === 'despesas' && (
        <div className={styles.tabContent}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              {(['all', 'fixed', 'variable'] as CostFilter[]).map((f) => (
                <button
                  key={f}
                  className={`${styles.filterBtn} ${costFilter === f ? styles.filterBtnActive : ''}`}
                  onClick={() => setCostFilter(f)}
                >
                  {f === 'all' ? 'Todas' : f === 'fixed' ? 'Fixas' : 'Variaveis'}
                </button>
              ))}
            </div>
          </div>

          {/* Category totals list */}
          <div className={styles.chartSection}>
            <h3 className={styles.sectionTitle}>Total por Categoria</h3>
            {(() => {
              const cats = costFilter === 'fixed' ? [...FIXED_CATEGORIES]
                : costFilter === 'variable' ? [...VARIABLE_CATEGORIES]
                  : [...FIXED_CATEGORIES, ...VARIABLE_CATEGORIES];
              const totals = cats
                .map((cat) => ({
                  cat,
                  total: finances.filter((f) => f.type === 'cost' && f.category === cat).reduce((a, f) => a + f.amount, 0),
                }))
                .filter(({ total }) => total > 0)
                .sort((a, b) => b.total - a.total);
              const max = totals[0]?.total || 1;
              if (totals.length === 0) return <p className={styles.emptyState}>Nenhuma despesa registrada.</p>;
              return (
                <div className={styles.catList}>
                  {totals.map(({ cat, total }) => (
                    <div key={cat} className={styles.catRow}>
                      <span className={styles.catDot} style={{ background: CATEGORY_COLORS[cat] || '#64748b' }} />
                      <span className={styles.catName}>{CATEGORY_LABELS[cat] || cat}</span>
                      <div className={styles.catBarWrap}>
                        <div className={styles.catBar} style={{ width: `${(total / max) * 100}%`, background: CATEGORY_COLORS[cat] || '#64748b' }} />
                      </div>
                      <span className={styles.catValue}>{formatBRL(total)}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===== TAB: PAINEL MENSAL ===== */}
      {activeTab === 'mensal' && (
        <div className={styles.tabContent}>
          {/* Month selector */}
          <div className={styles.monthSelector}>
            {availableMonths.map((m) => (
              <button
                key={m}
                className={`${styles.monthBtn} ${selectedMonth === m ? styles.monthBtnActive : ''}`}
                onClick={() => setSelectedMonth(m)}
              >
                {formatMonth(m)}
              </button>
            ))}
          </div>

          {/* Monthly summary bar */}
          <div className={styles.monthSummary}>
            <div className={`${styles.monthSummaryItem} ${styles.monthRevenue}`}>
              <span className={styles.monthSummaryLabel}>Receita</span>
              <span className={styles.monthSummaryValue}>{formatBRL(monthRevenue)}</span>
            </div>
            <div className={styles.monthSummaryOperator}>-</div>
            <div className={`${styles.monthSummaryItem} ${styles.monthExpense}`}>
              <span className={styles.monthSummaryLabel}>Despesas</span>
              <span className={styles.monthSummaryValue}>{formatBRL(monthCosts)}</span>
            </div>
            <div className={styles.monthSummaryOperator}>=</div>
            <div className={`${styles.monthSummaryItem} ${monthProfit >= 0 ? styles.monthProfit : styles.monthLoss}`}>
              <span className={styles.monthSummaryLabel}>{monthProfit >= 0 ? 'Lucro' : 'Prejuizo'}</span>
              <span className={styles.monthSummaryValue}>{formatBRL(Math.abs(monthProfit))}</span>
            </div>
          </div>

          {/* Gauges row */}
          <div className={styles.gaugesGrid}>
            <div className={styles.gaugeCard}>
              <GaugeChart
                label="Lucro"
                value={monthMargin}
                max={100}
                suffix="%"
                color={monthMargin >= 20 ? '#4ade80' : monthMargin >= 10 ? '#fbbf24' : '#f87171'}
              />
            </div>
            <div className={styles.gaugeCard}>
              <GaugeChart
                label="Insumos"
                value={insumosRatio}
                max={100}
                suffix="%"
                color={insumosRatio <= 30 ? '#4ade80' : insumosRatio <= 45 ? '#fbbf24' : '#f87171'}
              />
            </div>
            <div className={styles.gaugeCard}>
              <GaugeChart
                label="Mao de Obra"
                value={maoObraRatio}
                max={100}
                suffix="%"
                color={maoObraRatio <= 25 ? '#4ade80' : maoObraRatio <= 40 ? '#fbbf24' : '#f87171'}
              />
            </div>
          </div>

          {/* Horizontal bars */}
          <div className={styles.barsGrid}>
            <div className={styles.barCard}>
              <HorizontalBarChart
                title="Despesas Variaveis"
                items={variableCosts}
                formatValue={formatBRL}
              />
            </div>
            <div className={styles.barCard}>
              <HorizontalBarChart
                title="Despesas Fixas"
                items={fixedCosts}
                formatValue={formatBRL}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: LANCAMENTOS ===== */}
      {activeTab === 'lancamentos' && (
        <div className={styles.tabContent}>
          {/* Filters */}
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              {(['all', 'revenue', 'cost'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  className={`${styles.filterBtn} ${filterType === type ? styles.filterBtnActive : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type === 'all' ? 'Todos' : type === 'revenue' ? 'Receitas' : 'Custos'}
                </button>
              ))}
            </div>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por descricao, categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>Nenhum lancamento encontrado.</div>
          ) : (
            <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descricao</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <span className={entry.type === 'revenue' ? styles.typeRevenue : styles.typeCost}>
                        {entry.type === 'revenue' ? 'Receita' : 'Custo'}
                      </span>
                    </td>
                    <td>{entry.description}</td>
                    <td>
                      <span className={styles.categoryTag}>
                        <span
                          className={styles.categoryDot}
                          style={{ background: CATEGORY_COLORS[entry.category] || '#64748b' }}
                        />
                        {CATEGORY_LABELS[entry.category] || entry.category}
                      </span>
                    </td>
                    <td>{format(parseISO(entry.date), 'dd/MM/yy', { locale: ptBR })}</td>
                    <td>
                      <Badge variant={statusColors[entry.status]}>
                        {statusLabels[entry.status]}
                      </Badge>
                    </td>
                    <td>
                      <span className={entry.type === 'revenue' ? styles.typeRevenue : styles.typeCost}>
                        {entry.type === 'revenue' ? '+' : '-'} {formatBRL(entry.amount)}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => deleteFinance(entry.id)}
                        title="Excluir"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          {filtered.length > 50 && (
            <p className={styles.tableNote}>Mostrando 50 de {filtered.length} lancamentos</p>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal title="Novo Lancamento Financeiro" size="lg" onClose={() => setShowForm(false)}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Tipo</label>
                <select
                  className={styles.formSelect}
                  value={formType}
                  onChange={(e) => {
                    setFormType(e.target.value as FinanceType);
                    setFormCategory('');
                  }}
                >
                  <option value="revenue">Receita</option>
                  <option value="cost">Custo</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Evento</label>
                <select
                  className={styles.formSelect}
                  value={formEventId}
                  onChange={(e) => setFormEventId(e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>{evt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Categoria</label>
                <select
                  className={styles.formSelect}
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {formCategories[formType].map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Valor (R$)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Descricao</label>
              <input
                type="text"
                className={styles.formInput}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descreva o lancamento"
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Data</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Status</label>
                <select
                  className={styles.formSelect}
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as FinanceStatus)}
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="received">Recebido</option>
                </select>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Helpers
function formatMonth(ym: string) {
  const [y, m] = ym.split('-');
  return `${MONTHS_PT[parseInt(m, 10) - 1]} ${y?.substring(2)}`;
}
