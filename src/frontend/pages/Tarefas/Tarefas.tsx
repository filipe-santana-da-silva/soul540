import { useState, useMemo } from 'react';
import { useApp } from '@frontend/contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Task, TaskStatus, TaskPriority } from '@backend/domain/entities/Task';
import Badge from '@frontend/components/Badge/Badge';
import styles from './Tarefas.module.scss';
import ConfirmModal from '@frontend/components/ConfirmModal/ConfirmModal';

const statusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  in_progress: 'Em Andamento',
  review: 'Revisao',
  done: 'Concluido',
};

const statusColors: Record<TaskStatus, 'gray' | 'blue' | 'amber' | 'green'> = {
  backlog: 'gray',
  todo: 'blue',
  in_progress: 'amber',
  review: 'blue',
  done: 'green',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const priorityColors: Record<TaskPriority, 'gray' | 'blue' | 'amber' | 'red'> = {
  low: 'gray',
  medium: 'blue',
  high: 'amber',
  urgent: 'red',
};

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'A Fazer' },
  { id: 'in_progress', label: 'Em Andamento' },
  { id: 'review', label: 'Revisao' },
  { id: 'done', label: 'Concluido' },
];

type ViewMode = 'kanban' | 'list';

type FormData = {
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  eventId: string;
};

const emptyForm: FormData = {
  title: '',
  description: '',
  priority: 'medium',
  assignee: '',
  dueDate: '',
  eventId: '',
};

export default function Tarefas() {
  const { tasks, events, addTask, updateTask, deleteTask } = useApp();
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const eventMap = useMemo(() => {
    const m: Record<string, string> = {};
    events.forEach((e) => { m[e.id] = e.name; });
    return m;
  }, [events]);

  const filtered = tasks.filter((t) => {
    if (eventFilter !== 'all' && t.eventId !== eventFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { backlog: [], todo: [], in_progress: [], review: [], done: [] };
    filtered.forEach((t) => map[t.status].push(t));
    return map;
  }, [filtered]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    await addTask({
      title: form.title,
      description: form.description,
      status: 'backlog',
      priority: form.priority,
      assignee: form.assignee,
      dueDate: form.dueDate || undefined,
      eventId: form.eventId || undefined,
    });
    setShowModal(false);
    setForm(emptyForm);
  };

  const handleMove = (taskId: string, newStatus: TaskStatus) => {
    updateTask(taskId, { status: newStatus });
  };

  const handleDelete = (id: string) => { setDeleteTargetId(id); };
  const confirmDelete = async () => {
    if (deleteTargetId) await deleteTask(deleteTargetId);
    setDeleteTargetId(null);
  };

  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Tarefas</h1>
            <button className={styles.btnInfo} onClick={() => setShowInfo(true)} title="Como usar esta página">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
          </div>
          <p className={styles.subtitle}>Gerencie e acompanhe o progresso das tarefas</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'kanban' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Kanban
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('list')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Lista
            </button>
          </div>
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova Tarefa
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}><span className={styles.statVal}>{tasks.length}</span><span className={styles.statLbl}>Total</span></div>
        <div className={styles.stat}><span className={styles.statVal}>{doneTasks}</span><span className={styles.statLbl}>Concluidas</span></div>
        <div className={`${styles.stat} ${urgentTasks > 0 ? styles.statDanger : ''}`}><span className={styles.statVal}>{urgentTasks}</span><span className={styles.statLbl}>Urgentes</span></div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className={styles.searchInput} placeholder="Buscar tarefas..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={styles.select} value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
          <option value="all">Todos os eventos</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {viewMode === 'kanban' ? (
        <div className={styles.kanban}>
          {COLUMNS.map((col) => (
            <div key={col.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <span className={styles.columnTitle}>{col.label}</span>
                <span className={styles.columnCount}>{tasksByStatus[col.id].length}</span>
              </div>
              <div
                className={`${styles.columnBody} ${dragOverCol === col.id ? styles.columnBodyOver : ''}`}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCol(col.id); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null); }}
                onDrop={(e) => { e.preventDefault(); if (draggedId) handleMove(draggedId, col.id); setDraggedId(null); setDragOverCol(null); }}
              >
                {tasksByStatus[col.id].length === 0 ? (
                  <div className={styles.colEmpty}>Arraste uma tarefa aqui</div>
                ) : (
                  tasksByStatus[col.id].map((task) => (
                    <div
                      key={task.id}
                      className={`${styles.taskCard} ${draggedId === task.id ? styles.taskCardDragging : ''}`}
                      draggable
                      onDragStart={(e) => { setDraggedId(task.id); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                    >
                      <div className={styles.taskTop}>
                        <Badge variant={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
                        <button className={styles.taskDelete} onClick={() => handleDelete(task.id)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      <p className={styles.taskTitle}>{task.title}</p>
                      {task.description && <p className={styles.taskDesc}>{task.description}</p>}
                      <div className={styles.taskMeta}>
                        {task.assignee && <span>{task.assignee}</span>}
                        {task.dueDate && <span>{format(parseISO(task.dueDate), 'dd/MM', { locale: ptBR })}</span>}
                        {task.eventId && <span className={styles.taskEvent}>{eventMap[task.eventId] || ''}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.listView}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>Nenhuma tarefa encontrada.</div>
          ) : (
            filtered.map((task) => (
              <div key={task.id} className={styles.listItem}>
                <div className={styles.listItemInfo}>
                  <p className={styles.listItemTitle}>{task.title}</p>
                  <p className={styles.listItemSub}>
                    {task.assignee && <span>{task.assignee}</span>}
                    {task.eventId && <span> · {eventMap[task.eventId]}</span>}
                    {task.dueDate && <span> · Prazo: {format(parseISO(task.dueDate), "dd 'de' MMM", { locale: ptBR })}</span>}
                  </p>
                </div>
                <div className={styles.listItemBadges}>
                  <Badge variant={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
                  <Badge variant={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
                  <button className={styles.btnDelete} onClick={() => handleDelete(task.id)}>Excluir</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={() => { setShowModal(false); setForm(emptyForm); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nova Tarefa</h2>
              <button className={styles.modalClose} onClick={() => { setShowModal(false); setForm(emptyForm); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Titulo *</label>
                <input className={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Comprar ingredientes" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Descricao</label>
                <textarea className={styles.textarea} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes da tarefa..." />
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Prioridade</label>
                  <select className={styles.input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                    <option value="low">Baixa</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Responsavel</label>
                  <input className={styles.input} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Nome" />
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Prazo</label>
                  <input className={styles.input} type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Evento</label>
                  <select className={styles.input} value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
                    <option value="">Nenhum</option>
                    {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => { setShowModal(false); setForm(emptyForm); }}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleCreate} disabled={!form.title.trim()}>Criar Tarefa</button>
            </div>
          </div>
        </div>
      )}
      {showInfo && (
        <div className={styles.overlay} onClick={() => setShowInfo(false)}>
          <div className={styles.modal} style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Sobre esta página</h2>
              <button className={styles.modalClose} onClick={() => setShowInfo(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>O que é esta página?</p>
                <p className={styles.infoText}>
                  A página de <strong>Tarefas</strong> permite gerenciar todas as atividades do negócio em um quadro Kanban visual ou em lista. As tarefas podem ser vinculadas a eventos específicos e organizadas por prioridade.
                </p>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Como criar uma tarefa</p>
                <ol className={styles.infoList}>
                  <li>Clique em <strong>Nova Tarefa</strong> no canto superior direito.</li>
                  <li>Preencha o título, prioridade e, opcionalmente, vincule a um evento.</li>
                  <li>Defina um responsável e prazo se necessário.</li>
                  <li>Clique em <strong>Criar Tarefa</strong> para salvar.</li>
                </ol>
              </div>
              <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Como mover tarefas</p>
                <ol className={styles.infoList}>
                  <li>No <strong>Kanban</strong>, arraste o card para a coluna desejada.</li>
                  <li>Na <strong>Lista</strong>, use o select de status em cada linha.</li>
                  <li>Colunas: Backlog → A Fazer → Em Andamento → Revisão → Concluído.</li>
                </ol>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <span />
              <button className={styles.btnPrimary} onClick={() => setShowInfo(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}
      {deleteTargetId && (
        <ConfirmModal
          title="Excluir Tarefa"
          message={<>Tem certeza que deseja excluir <strong>{tasks.find((t) => t.id === deleteTargetId)?.title}</strong>? Esta ação não pode ser desfeita.</>}
          confirmLabel="Excluir"
          variant="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
