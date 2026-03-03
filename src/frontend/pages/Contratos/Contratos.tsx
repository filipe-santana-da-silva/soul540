import { useState, useMemo } from 'react';
import { useApp } from '@frontend/contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Contract } from '@backend/infra/data/mockData';
import { mockContracts } from '@backend/infra/data/mockData';
import styles from './Contratos.module.scss';
import ConfirmModal from '@frontend/components/ConfirmModal/ConfirmModal';
import ContractDocument from './ContractDocument';

type FormData = {
  clientName: string;
  clientDocument: string;
  clientEmail: string;
  clientPhone: string;
  eventId: string;
  value: string;
  startDate: string;
  endDate: string;
  description: string;
  paymentConditions: string;
  terms: string;
};

const emptyForm: FormData = {
  clientName: '', clientDocument: '', clientEmail: '', clientPhone: '',
  eventId: '', value: '', startDate: '', endDate: '',
  description: '', paymentConditions: '', terms: '',
};

function formatDate(iso: string) {
  try { return format(parseISO(iso), 'dd/MM/yy', { locale: ptBR }); } catch { return iso; }
}

export default function Contratos() {
  const { events } = useApp();
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewContract, setViewContract] = useState<Contract | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const eventMap = useMemo(() => {
    const m: Record<string, string> = {};
    events.forEach((e) => { m[e.id] = e.name; });
    return m;
  }, [events]);

  const filtered = useMemo(
    () => contracts.filter((c) => {
      if (search && !c.clientName.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [contracts, search],
  );

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (c: Contract) => {
    setForm({
      clientName: c.clientName,
      clientDocument: c.clientDocument || '',
      clientEmail: c.clientEmail || '',
      clientPhone: c.clientPhone || '',
      eventId: c.eventId || '',
      value: String(c.value),
      startDate: c.startDate,
      endDate: c.endDate || '',
      description: c.description,
      paymentConditions: c.paymentConditions || '',
      terms: c.terms || '',
    });
    setEditingId(c.id);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = () => {
    if (!form.clientName) return;
    const data: Omit<Contract, 'id' | 'createdAt' | 'status'> = {
      clientName: form.clientName,
      clientDocument: form.clientDocument || undefined,
      clientEmail: form.clientEmail || undefined,
      clientPhone: form.clientPhone || undefined,
      eventId: form.eventId || undefined,
      value: Number(form.value) || 0,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      description: form.description,
      paymentConditions: form.paymentConditions || undefined,
      terms: form.terms || undefined,
    };
    if (editingId) {
      setContracts((prev) => prev.map((c) => c.id === editingId ? { ...c, ...data } : c));
    } else {
      setContracts((prev) => [...prev, { ...data, id: `cont-${Date.now()}`, status: 'rascunho', createdAt: new Date().toISOString() }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => { setDeleteTargetId(id); };
  const confirmDelete = () => {
    if (deleteTargetId) setContracts((prev) => prev.filter((c) => c.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Contratos</h1>
          <p className={styles.subtitle}>Gerencie contratos e acordos com clientes</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Contrato
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className={styles.searchInput} placeholder="Buscar por cliente ou descricao..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Nenhum contrato encontrado.</div>
      ) : (
        <div className={styles.tableWrap}>
          <div className={styles.tableHead}>
            <span className={styles.thCell}>Cliente / Descricao</span>
            <span className={styles.thCell}>Evento / Vigencia</span>
            <span className={styles.thCell}>Valor</span>
            <span className={styles.thCell} style={{ textAlign: 'right' }}>Acoes</span>
          </div>

          {filtered.map((c) => (
            <div key={c.id} className={styles.row}>
              <div className={styles.cellMain}>
                <div className={styles.cellIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div className={styles.cellBody}>
                  <div className={styles.cellRef}>#{c.id.split('-').pop()?.toUpperCase()}</div>
                  <div className={styles.cellClient}>{c.clientName}</div>
                  <div className={styles.cellDesc}>{c.description}</div>
                </div>
              </div>

              <div className={styles.cellMeta}>
                {c.eventId && (
                  <span className={styles.cellEvent}>{eventMap[c.eventId] || c.eventId}</span>
                )}
                <div className={styles.cellDates}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {formatDate(c.startDate)}
                  {c.endDate && (
                    <><span className={styles.dateSep}>→</span>{formatDate(c.endDate)}</>
                  )}
                </div>
              </div>

              <div className={styles.cellValue}>
                R$ {c.value.toLocaleString('pt-BR')}
              </div>

              <div className={styles.cellActions}>
                <button className={styles.btnView} onClick={() => setViewContract(c)}>Ver</button>
                <button className={styles.btnEdit} onClick={() => openEdit(c)}>Editar</button>
                <button className={styles.btnDelete} onClick={() => handleDelete(c.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Editar Contrato' : 'Novo Contrato'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cliente *</label>
                  <input className={styles.input} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Nome ou Razao Social" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>CPF / CNPJ</label>
                  <input className={styles.input} value={form.clientDocument} onChange={(e) => setForm({ ...form, clientDocument: e.target.value })} placeholder="000.000.000-00" />
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>E-mail</label>
                  <input className={styles.input} type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} placeholder="cliente@email.com" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Telefone</label>
                  <input className={styles.input} value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Evento Vinculado</label>
                  <select className={styles.input} value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
                    <option value="">Nenhum</option>
                    {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Valor (R$)</label>
                  <input className={styles.input} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Data de Inicio</label>
                  <input className={styles.input} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Data de Termino</label>
                  <input className={styles.input} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Descricao / Objeto do Contrato</label>
                <textarea className={styles.textarea} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o servico contratado..." />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Condicoes de Pagamento</label>
                <input className={styles.input} value={form.paymentConditions} onChange={(e) => setForm({ ...form, paymentConditions: e.target.value })} placeholder="Ex: 50% adiantado, 50% no dia" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Clausulas Adicionais</label>
                <textarea className={styles.textarea} rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} placeholder="Disposicoes especificas deste contrato..." />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={closeModal}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={!form.clientName}>
                {editingId ? 'Salvar' : 'Criar Contrato'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewContract && (
        <ContractDocument
          contract={viewContract}
          event={events.find((e) => e.id === viewContract.eventId)}
          eventName={viewContract.eventId ? (eventMap[viewContract.eventId] || '') : ''}
          onClose={() => setViewContract(null)}
        />
      )}

      {deleteTargetId && (
        <ConfirmModal
          title="Excluir Contrato"
          message={<>Tem certeza que deseja excluir o contrato de <strong>{contracts.find((c) => c.id === deleteTargetId)?.clientName}</strong>? Esta acao nao pode ser desfeita.</>}
          confirmLabel="Excluir"
          variant="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
