import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@frontend/contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './Contratos.module.scss';
import { SOUL540_MENUS } from '@frontend/data/soul540Menus';

import ConfirmModal from '@frontend/components/ConfirmModal/ConfirmModal';
import ContractDocument, { type Contract } from './ContractDocument';

const maskCpf = (v: string) => v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
const maskRg = (v: string) => v.replace(/\D/g, '').slice(0, 9).replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1})$/, '$1-$2');
const maskPhone = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 11); if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, ''); return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, ''); };
const maskCurrency = (v: string) => { const d = v.replace(/\D/g, ''); if (!d) return ''; const n = parseInt(d, 10); const reais = Math.floor(n / 100); const cents = n % 100; return `R$ ${reais.toLocaleString('pt-BR')},${String(cents).padStart(2, '0')}`; };
const parseCurrency = (v: string) => { const d = v.replace(/\D/g, ''); return d ? parseInt(d, 10) / 100 : 0; };

type FormData = {
  clientName: string;
  clientDocument: string;
  clientRg: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  eventId: string;
  description: string;
  pricePerAdult: string;
  adultsCount: string;
  pricePerChild: string;
  childrenCount: string;
  additionalServices: string;
  value: string;
  minGuests: string;
  serviceType: string;
  drinksDescription: string;
  cancellationDays: string;
  pizzaTeam: string;
  drinksTeam: string;
  startDate: string;
  endDate: string;
  paymentConditions: string;
  terms: string;
  menuId: string;
};

const emptyForm: FormData = {
  clientName: '', clientDocument: '', clientRg: '', clientAddress: '',
  clientEmail: '', clientPhone: '', eventId: '', description: '',
  pricePerAdult: '', adultsCount: '', pricePerChild: '', childrenCount: '',
  additionalServices: '', value: '', minGuests: '', serviceType: 'self service e coquetel',
  drinksDescription: '', cancellationDays: '30', pizzaTeam: '', drinksTeam: '',
  startDate: '', endDate: '', paymentConditions: '', terms: '', menuId: '',
};

function formatDate(iso: string) {
  try { return format(parseISO(iso), 'dd/MM/yy', { locale: ptBR }); } catch { return iso; }
}

export default function Contratos() {
  const { events } = useApp();
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    fetch('/api/contracts').then(r => r.json()).then(setContracts).catch(() => {});
  }, []);
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
      clientRg: c.clientRg || '',
      clientAddress: c.clientAddress || '',
      clientEmail: c.clientEmail || '',
      clientPhone: c.clientPhone || '',
      eventId: c.eventId || '',
      description: c.description,
      pricePerAdult: c.pricePerAdult ? maskCurrency(String(Math.round(c.pricePerAdult * 100))) : '',
      adultsCount: c.adultsCount?.toString() || '',
      pricePerChild: c.pricePerChild ? maskCurrency(String(Math.round(c.pricePerChild * 100))) : '',
      childrenCount: c.childrenCount?.toString() || '',
      additionalServices: c.additionalServices || '',
      value: c.value ? maskCurrency(String(Math.round(c.value * 100))) : '',
      minGuests: c.minGuests?.toString() || '',
      serviceType: c.serviceType || 'self service e coquetel',
      drinksDescription: c.drinksDescription || '',
      cancellationDays: c.cancellationDays?.toString() || '30',
      pizzaTeam: c.pizzaTeam || '',
      drinksTeam: c.drinksTeam || '',
      startDate: c.startDate,
      endDate: c.endDate || '',
      paymentConditions: c.paymentConditions || '',
      terms: c.terms || '',
      menuId: c.menuId || '',
    });
    setEditingId(c.id);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = async () => {
    if (!form.clientName) return;
    const data = {
      clientName: form.clientName,
      clientDocument: form.clientDocument || '',
      clientRg: form.clientRg || '',
      clientAddress: form.clientAddress || '',
      clientEmail: form.clientEmail || '',
      clientPhone: form.clientPhone || '',
      eventId: form.eventId || '',
      description: form.description,
      pricePerAdult: parseCurrency(form.pricePerAdult),
      adultsCount: Number(form.adultsCount) || 0,
      pricePerChild: parseCurrency(form.pricePerChild),
      childrenCount: Number(form.childrenCount) || 0,
      additionalServices: form.additionalServices || '',
      value: parseCurrency(form.value),
      minGuests: Number(form.minGuests) || 0,
      serviceType: form.serviceType || '',
      drinksDescription: form.drinksDescription || '',
      cancellationDays: Number(form.cancellationDays) || 30,
      pizzaTeam: form.pizzaTeam || '',
      drinksTeam: form.drinksTeam || '',
      startDate: form.startDate,
      endDate: form.endDate || '',
      paymentConditions: form.paymentConditions || '',
      terms: form.terms || '',
      menuId: form.menuId || '',
    };
    if (editingId) {
      const res = await fetch(`/api/contracts/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const updated: Contract = await res.json();
      setContracts((prev) => prev.map((c) => c.id === editingId ? updated : c));
    } else {
      const res = await fetch('/api/contracts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const created: Contract = await res.json();
      setContracts((prev) => [created, ...prev]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => { setDeleteTargetId(id); };
  const confirmDelete = async () => {
    if (deleteTargetId) {
      await fetch(`/api/contracts/${deleteTargetId}`, { method: 'DELETE' });
      setContracts((prev) => prev.filter((c) => c.id !== deleteTargetId));
    }
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
              {/* Contratante */}
              <div className={styles.formSectionLabel}>Contratante</div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nome *</label>
                  <input className={styles.input} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Nome completo" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>CPF</label>
                  <input className={styles.input} value={form.clientDocument} onChange={(e) => setForm({ ...form, clientDocument: maskCpf(e.target.value) })} placeholder="000.000.000-00" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>RG</label>
                  <input className={styles.input} value={form.clientRg} onChange={(e) => setForm({ ...form, clientRg: maskRg(e.target.value) })} placeholder="00.000.000-0" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Telefone</label>
                  <input className={styles.input} value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Endereço</label>
                  <input className={styles.input} value={form.clientAddress} onChange={(e) => setForm({ ...form, clientAddress: e.target.value })} placeholder="Rua, nº – Bairro – Cidade, Estado" />
                </div>
              </div>

              {/* Evento */}
              <div className={styles.formSectionLabel}>Evento</div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Evento Vinculado</label>
                  <select className={styles.input} value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
                    <option value="">Nenhum</option>
                    {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Data do Contrato</label>
                  <input className={styles.input} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Descricao do Servico</label>
                  <input className={styles.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: formatura do colégio, aniversário de 15 anos..." />
                </div>
              </div>

              {/* Precificação */}
              <div className={styles.formSectionLabel}>Precificação</div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Valor por Adulto</label>
                  <input className={styles.input} value={form.pricePerAdult} onChange={(e) => setForm({ ...form, pricePerAdult: maskCurrency(e.target.value) })} placeholder="R$ 0,00" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nº de Adultos</label>
                  <input className={styles.input} type="number" value={form.adultsCount} onChange={(e) => setForm({ ...form, adultsCount: e.target.value })} placeholder="0" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Valor por Criança</label>
                  <input className={styles.input} value={form.pricePerChild} onChange={(e) => setForm({ ...form, pricePerChild: maskCurrency(e.target.value) })} placeholder="R$ 0,00" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nº de Crianças (7-11 anos)</label>
                  <input className={styles.input} type="number" value={form.childrenCount} onChange={(e) => setForm({ ...form, childrenCount: e.target.value })} placeholder="0" />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Serviços Adicionais</label>
                  <input className={styles.input} value={form.additionalServices} onChange={(e) => setForm({ ...form, additionalServices: e.target.value })} placeholder="Descreva serviços extras e valores" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Valor Total</label>
                  <input className={styles.input} value={form.value} onChange={(e) => setForm({ ...form, value: maskCurrency(e.target.value) })} placeholder="R$ 0,00" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Mínimo de Convidados</label>
                  <input className={styles.input} type="number" value={form.minGuests} onChange={(e) => setForm({ ...form, minGuests: e.target.value })} placeholder="0" />
                </div>
              </div>

              {/* Serviço */}
              <div className={styles.formSectionLabel}>Serviço</div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Cardápio do Evento (Anexo I)</label>
                  <select className={styles.input} value={form.menuId} onChange={(e) => setForm({ ...form, menuId: e.target.value })}>
                    <option value="">Cardápio Padrão (genérico)</option>
                    {SOUL540_MENUS.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Sistema de Servico</label>
                  <input className={styles.input} value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} placeholder="self service e coquetel" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Dias sem Multa (Cancelamento)</label>
                  <input className={styles.input} type="number" value={form.cancellationDays} onChange={(e) => setForm({ ...form, cancellationDays: e.target.value })} placeholder="30" />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Servico de Bebidas</label>
                  <input className={styles.input} value={form.drinksDescription} onChange={(e) => setForm({ ...form, drinksDescription: e.target.value })} placeholder="Descreva o serviço de bebidas incluso" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Equipe das Pizzas</label>
                  <input className={styles.input} value={form.pizzaTeam} onChange={(e) => setForm({ ...form, pizzaTeam: e.target.value })} placeholder="Ex: 2 pizzaiolos + 1 auxiliar" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Equipe de Bebidas</label>
                  <input className={styles.input} value={form.drinksTeam} onChange={(e) => setForm({ ...form, drinksTeam: e.target.value })} placeholder="Ex: 1 barman" />
                </div>
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
