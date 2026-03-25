import { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, addMonths, subMonths, addDays, subDays, parseISO, startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PizzaEvent } from '@backend/domain/entities/Event';
import { useApp } from '@frontend/contexts/AppContext';
import styles from './CalendarView.module.scss';

const EVENT_COLOR = {
  bg: 'rgba(245,158,11,0.14)',
  text: '#f59e0b',
  border: 'rgba(245,158,11,0.28)',
  solid: '#f59e0b',
};

const PLANNING_COLOR = {
  bg: 'rgba(239,68,68,0.12)',
  text: '#ef4444',
  border: 'rgba(239,68,68,0.28)',
  solid: '#ef4444',
};

function getEventColor(ev: PizzaEvent) {
  return ev.status === 'planning' ? PLANNING_COLOR : EVENT_COLOR;
}

function buildWhatsAppUrl(ev: PizzaEvent): string {
  const digits = ev.phone?.replace(/\D/g, '') || '';
  if (!digits) return '';
  const dateStr = format(parseISO(ev.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const lines = [
    `Olá! Segue o resumo do evento *${ev.name}*:`,
    '',
    `📅 Data: ${dateStr}${ev.time ? ` às ${ev.time}` : ''}`,
    `📍 Local: ${ev.location}${ev.outOfCity ? ' (fora da cidade)' : ''}`,
    `👥 Convidados: ${ev.guestCount}`,
    `💰 Valor: R$ ${ev.budget.toLocaleString('pt-BR')}`,
    ...(ev.notes ? [`📝 Obs: ${ev.notes}`] : []),
  ];
  return `https://wa.me/55${digits}?text=${encodeURIComponent(lines.join('\n'))}`;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07h–22h

type ViewMode = 'month' | 'day';

interface Props {
  events: PizzaEvent[];
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconAlertTriangle() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ── Event Detail Modal ────────────────────────────────────────────────────────
function EventModal({ event, onClose, onUpdate, onDelete }: {
  event: PizzaEvent;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<PizzaEvent>) => void;
  onDelete: (id: string) => void;
}) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [form, setForm] = useState<Partial<PizzaEvent>>({ ...event });

  const c = getEventColor(event);

  const handleSave = () => {
    onUpdate(event.id, form);
    onClose();
  };

  const handleDelete = () => {
    onDelete(event.id);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.eventOverlay} onClick={handleOverlayClick}>
      <div className={styles.eventPanel}>

        {/* Header */}
        <div className={styles.panelHeader} style={{ borderLeftColor: c.solid }}>
          <div className={styles.panelHeaderLeft}>
            {mode === 'view' && <p className={styles.panelTitle}>{event.name}</p>}
            {mode === 'edit' && <p className={styles.panelTitle}>Editar evento</p>}
            {mode === 'delete' && <p className={styles.panelTitle}>Excluir evento</p>}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <IconX />
          </button>
        </div>

        {/* ── View mode ── */}
        {mode === 'view' && (
          <>
            <div className={styles.panelBody}>

              {/* Informações */}
              <div className={styles.detailSection}>
                <p className={styles.detailSectionTitle}>Informações</p>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Data</span>
                    <span className={styles.detailValue}>
                      {format(parseISO(event.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {event.endDate && ` → ${format(parseISO(event.endDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
                    </span>
                  </div>
                  {event.time && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Horário</span>
                      <span className={styles.detailValue}>{event.time}</span>
                    </div>
                  )}
                  {event.duration && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Duração</span>
                      <span className={styles.detailValue}>{event.duration}</span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Local</span>
                    <span className={styles.detailValue}>
                      {event.location}{event.outOfCity && ' (fora da cidade)'}
                    </span>
                  </div>
                  {event.phone && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Telefone</span>
                      <span className={styles.detailValue}>{event.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financeiro */}
              <div className={styles.detailSection}>
                <p className={styles.detailSectionTitle}>Financeiro</p>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Valor</span>
                    <span className={styles.detailValue}>R$ {event.budget.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Convidados</span>
                    <span className={styles.detailValue}>{event.guestCount}</span>
                  </div>
                </div>
              </div>

              {/* Equipe */}
              {event.staffCount != null && event.staffCount > 0 && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Equipe</p>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Funcionários</span>
                      <span className={styles.detailValue}>{event.staffCount} pessoas</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cardápio */}
              {event.menu.length > 0 && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Cardápio</p>
                  <div className={styles.menuList}>
                    {event.menu.map((item) => (
                      <span key={item} className={styles.menuTag}>{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {event.notes && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Observações</p>
                  <p className={styles.notesBox}>{event.notes}</p>
                </div>
              )}

              {/* Documentos */}
              {(event.paymentProofName || event.contractPdfName) && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Documentos</p>
                  <div className={styles.docList}>
                    {event.paymentProofName && (
                      <span className={styles.docTag}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        {event.paymentProofName}
                      </span>
                    )}
                    {event.contractPdfName && (
                      <span className={styles.docTag}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        {event.contractPdfName}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Criado por */}
              <div className={styles.detailSection}>
                <p className={styles.detailSectionTitle}>Criado por</p>
                <span className={styles.detailValue}>
                  {event.createdBy || format(parseISO(event.createdAt), 'dd/MM/yyyy')}
                </span>
              </div>

            </div>
            <div className={styles.panelActions}>
              <button className={styles.btnDelete} onClick={() => setMode('delete')}>Excluir</button>
              {event.phone && (
                <a className={styles.btnWhatsapp} href={buildWhatsAppUrl(event)} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              )}
              <button className={styles.btnEdit} onClick={() => setMode('edit')}>Editar</button>
            </div>
          </>
        )}

        {/* ── Edit mode ── */}
        {mode === 'edit' && (
          <>
            <div className={styles.panelBody}>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Nome do evento</label>
                  <input
                    className={styles.formInput}
                    value={form.name ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Data</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={(form.date ?? '').slice(0, 10)}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Local</label>
                  <input
                    className={styles.formInput}
                    value={form.location ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Convidados</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={form.guestCount ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, guestCount: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Orçamento (R$)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={form.budget ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, budget: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Observações</label>
                <textarea
                  className={styles.formTextarea}
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.panelActions}>
              <button className={styles.btnCancel} onClick={() => setMode('view')}>Cancelar</button>
              <button className={styles.btnSave} onClick={handleSave}>Salvar</button>
            </div>
          </>
        )}

        {/* ── Delete confirm ── */}
        {mode === 'delete' && (
          <>
            <div className={styles.panelBody}>
              <div className={styles.deleteConfirmBox}>
                <div className={styles.deleteWarningIcon}>
                  <IconAlertTriangle />
                </div>
                <p className={styles.deleteConfirmTitle}>Excluir evento?</p>
                <p className={styles.deleteConfirmText}>
                  Esta ação não pode ser desfeita. O evento{' '}
                  <strong>"{event.name}"</strong> será removido permanentemente.
                </p>
              </div>
            </div>
            <div className={styles.panelActions}>
              <button className={styles.btnCancel} onClick={() => setMode('view')}>Cancelar</button>
              <button className={styles.btnDeleteConfirm} onClick={handleDelete}>Excluir</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CalendarView({ events }: Props) {
  const { updateEvent, deleteEvent } = useApp();
  const [view, setView] = useState<ViewMode>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<PizzaEvent | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsForDay = (day: Date) => {
    const d = startOfDay(day);
    return events.filter((e) => {
      const start = startOfDay(parseISO(e.date));
      const end = e.endDate ? startOfDay(parseISO(e.endDate)) : start;
      return d >= start && d <= end;
    });
  };

  const dayEvents = useMemo(() => eventsForDay(selectedDay), [events, selectedDay]);

  const openDay = (day: Date) => {
    setSelectedDay(day);
    setView('day');
  };

  const openEvent = (ev: PizzaEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(ev);
  };

  const goToday = () => {
    const t = new Date();
    setCurrentMonth(t);
    setSelectedDay(t);
  };

  // ── Month view ──────────────────────────────────────────────────────────────
  if (view === 'month') {
    return (
      <>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <h2 className={styles.monthTitle}>
              {format(currentMonth, 'MMMM', { locale: ptBR })}
              <span className={styles.monthYear}>{format(currentMonth, ' yyyy')}</span>
            </h2>
            <div className={styles.headerRight}>
              <button className={styles.todayBtn} onClick={goToday}>Hoje</button>
              <div className={styles.navBtns}>
                <button className={styles.navBtn} onClick={() => setCurrentMonth((d) => subMonths(d, 1))} aria-label="Mês anterior">
                  <IconChevronLeft />
                </button>
                <button className={styles.navBtn} onClick={() => setCurrentMonth((d) => addMonths(d, 1))} aria-label="Próximo mês">
                  <IconChevronRight />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.weekDays}>
            {WEEK_DAYS.map((d) => <div key={d} className={styles.weekDay}>{d}</div>)}
          </div>

          <div className={styles.grid}>
            {days.map((day) => {
              const de = eventsForDay(day);
              const inMonth = isSameMonth(day, currentMonth);
              const isTodayCell = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={[
                    styles.cell,
                    !inMonth ? styles.cellOtherMonth : '',
                    isSameDay(day, selectedDay) ? styles.cellSelected : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => openDay(day)}
                >
                  <span className={[
                    styles.dayNum,
                    isTodayCell ? styles.dayToday : '',
                  ].filter(Boolean).join(' ')}>
                    {format(day, 'd')}
                  </span>

                  <div className={styles.pills}>
                    {de.slice(0, 3).map((ev) => {
                      const c = getEventColor(ev);
                      const isStart = isSameDay(parseISO(ev.date), day);
                      const isEnd = !ev.endDate || isSameDay(parseISO(ev.endDate), day);
                      const isMulti = ev.endDate && !isSameDay(parseISO(ev.date), parseISO(ev.endDate));
                      const radius = !isMulti ? '4px'
                        : isStart && isEnd ? '4px'
                        : isStart ? '4px 0 0 4px'
                        : isEnd ? '0 4px 4px 0'
                        : '0';
                      return (
                        <div
                          key={ev.id}
                          className={styles.pill}
                          style={{
                            background: c.bg,
                            color: c.text,
                            borderColor: c.border,
                            borderRadius: radius,
                            ...(isMulti && !isStart ? { marginLeft: -6, paddingLeft: 4 } : {}),
                            ...(isMulti && !isEnd ? { marginRight: -6, paddingRight: 4 } : {}),
                          }}
                          title={ev.name}
                          onClick={(e) => openEvent(ev, e)}
                        >
                          {isStart ? ev.name : '\u00A0'}
                        </div>
                      );
                    })}
                    {de.length > 3 && <div className={styles.pillMore}>+{de.length - 3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedEvent && (
          <EventModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onUpdate={updateEvent}
            onDelete={deleteEvent}
          />
        )}
      </>
    );
  }

  // ── Day view ────────────────────────────────────────────────────────────────
  const isSelectedToday = isToday(selectedDay);

  return (
    <>
      <div className={`${styles.wrapper} ${styles.wrapperDay}`}>
        {/* Day header */}
        <div className={styles.dayHeader}>
          <button className={styles.backBtn} onClick={() => setView('month')}>
            <IconChevronLeft />
            <span>Voltar ao mês</span>
          </button>

          <div className={styles.dayTitle}>
            <span className={styles.dayTitleWeekday}>
              {format(selectedDay, 'EEEE', { locale: ptBR })}
            </span>
            <span className={styles.dayTitleDate}>
              {format(selectedDay, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            {isSelectedToday && <span className={styles.todayChip}>Hoje</span>}
          </div>

          <div className={styles.dayNav}>
            <button className={styles.navBtn} onClick={() => setSelectedDay((d) => subDays(d, 1))} aria-label="Dia anterior">
              <IconChevronLeft />
            </button>
            <button className={styles.navBtn} onClick={() => setSelectedDay((d) => addDays(d, 1))} aria-label="Próximo dia">
              <IconChevronRight />
            </button>
          </div>
        </div>

        {/* All-day events row */}
        <div className={styles.allDayRow}>
          <div className={styles.allDayLabel}>dia todo</div>
          <div className={styles.allDayEvents}>
            {dayEvents.length === 0 ? (
              <span className={styles.allDayEmpty}>Nenhum evento</span>
            ) : (
              dayEvents.map((ev) => {
                const c = getEventColor(ev);
                return (
                <div
                  key={ev.id}
                  className={styles.allDayEvent}
                  style={{ background: c.bg, borderColor: c.solid, color: c.text }}
                  onClick={(e) => openEvent(ev, e)}
                >
                  <div className={styles.allDayEventBar} style={{ background: c.solid }} />
                  <div className={styles.allDayEventContent}>
                    <p className={styles.allDayEventName}>{ev.name}</p>
                    <p className={styles.allDayEventMeta}>
                      {ev.location} · {ev.guestCount} convidados · R$ {ev.budget.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>

        {/* Time grid */}
        <div className={styles.timeGrid}>
          {HOURS.map((h) => {
            const label = `${String(h).padStart(2, '0')}:00`;
            const isCurrentHour = isSelectedToday && new Date().getHours() === h;

            return (
              <div key={h} className={`${styles.hourRow} ${isCurrentHour ? styles.hourRowNow : ''}`}>
                <div className={styles.hourLabel}>{label}</div>
                <div className={styles.hourSlot}>
                  {isCurrentHour && (
                    <div className={styles.nowIndicator}>
                      <div className={styles.nowDot} />
                      <div className={styles.nowLine} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
        />
      )}
    </>
  );
}
