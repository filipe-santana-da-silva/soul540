import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@frontend/contexts/AppContext';
import { format, parseISO } from 'date-fns';
import type { Invoice, InvoiceItem, InvoiceStatus } from '@backend/domain/entities/Invoice';
import Badge from '@frontend/components/Badge/Badge';
import Button from '@frontend/components/Button/Button';
import Modal from '@frontend/components/Modal/Modal';
import styles from './NotasFiscais.module.scss';

type FilterStatus = 'all' | InvoiceStatus;

const statusLabels: Record<InvoiceStatus, string> = {
  rascunho: 'Rascunho',
  emitida: 'Emitida',
  cancelada: 'Cancelada',
};

const statusColors: Record<InvoiceStatus, 'gray' | 'green' | 'red'> = {
  rascunho: 'gray',
  emitida: 'green',
  cancelada: 'red',
};

const emptyItem = (): InvoiceItem => ({ description: '', quantity: 1, unitPrice: 0, ncm: '', cfop: '', unit: 'UN' });

export default function NotasFiscais() {
  const { events, invoices, addInvoice, updateInvoice, deleteInvoice, emitInvoice, pollInvoiceStatus } = useApp();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [confirmEmitId, setConfirmEmitId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [emitError, setEmitError] = useState<string | null>(null);

  // CPF/CNPJ mask
  const maskCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  // Form state
  const [formEventId, setFormEventId] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formClientDoc, setFormClientDoc] = useState('');
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formIssueDate, setFormIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTaxRate, setFormTaxRate] = useState('5');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<InvoiceStatus>('rascunho');
  const [formItems, setFormItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [formType, setFormType] = useState<'nfse' | 'nfe'>('nfse');
  const [formServiceCode, setFormServiceCode] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formAddressNumber, setFormAddressNumber] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPostalCode, setFormPostalCode] = useState('');

  const formSubtotal = formItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const formTaxAmount = formSubtotal * (parseFloat(formTaxRate || '0') / 100);

  // Polling for invoices in processing state
  const processingInvoices = useMemo(
    () => invoices.filter((inv) => inv.nfeioStatus === 'processing'),
    [invoices],
  );
  const pollInvoiceStatusRef = useRef(pollInvoiceStatus);
  useEffect(() => { pollInvoiceStatusRef.current = pollInvoiceStatus; }, [pollInvoiceStatus]);

  useEffect(() => {
    if (processingInvoices.length === 0) return;
    const ids = processingInvoices.map((inv) => inv.id);
    const timer = setInterval(() => {
      ids.forEach((id) => pollInvoiceStatusRef.current(id).catch(() => {}));
    }, 3000);
    return () => clearInterval(timer);
  }, [processingInvoices]);

  // Filtered
  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const event = events.find((e) => e.id === inv.eventId);
        return (
          inv.clientName.toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q) ||
          (event?.name.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [invoices, filterStatus, search, events]);

  const resetForm = () => {
    setEditingInvoice(null);
    setFormEventId('');
    setFormClientName('');
    setFormClientDoc('');
    setFormClientEmail('');
    setFormIssueDate(new Date().toISOString().split('T')[0]);
    setFormTaxRate('5');
    setFormNotes('');
    setFormStatus('rascunho');
    setFormItems([emptyItem()]);
    setFormType('nfse');
    setFormServiceCode('');
    setFormAddress('');
    setFormAddressNumber('');
    setFormDistrict('');
    setFormCity('');
    setFormState('');
    setFormPostalCode('');
  };

  const openEditForm = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormEventId(invoice.eventId);
    setFormClientName(invoice.clientName);
    setFormClientDoc(invoice.clientDocument);
    setFormClientEmail(invoice.clientEmail);
    setFormIssueDate(invoice.issueDate);
    setFormTaxRate(String(invoice.taxRate));
    setFormNotes(invoice.notes);
    setFormStatus(invoice.status);
    setFormItems(invoice.items.length > 0 ? invoice.items : [emptyItem()]);
    setFormType(invoice.type ?? 'nfse');
    setFormServiceCode(invoice.serviceCode ?? '');
    setFormAddress(invoice.clientAddress ?? '');
    setFormAddressNumber(invoice.clientNumber ?? '');
    setFormDistrict(invoice.clientDistrict ?? '');
    setFormCity(invoice.clientCity ?? '');
    setFormState(invoice.clientState ?? '');
    setFormPostalCode(invoice.clientPostalCode ?? '');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formEventId || !formClientName || formItems.length === 0) return;

    const data: Partial<Invoice> = {
      eventId: formEventId,
      clientName: formClientName,
      clientDocument: formClientDoc,
      clientEmail: formClientEmail,
      items: formItems.filter((i) => i.description),
      subtotal: formSubtotal,
      taxRate: parseFloat(formTaxRate || '0'),
      taxAmount: formTaxAmount,
      totalValue: formSubtotal,
      issueDate: formIssueDate,
      notes: formNotes,
      status: formStatus,
      type: formType,
      serviceCode: formServiceCode,
      clientAddress: formAddress,
      clientNumber: formAddressNumber,
      clientDistrict: formDistrict,
      clientCity: formCity,
      clientState: formState,
      clientPostalCode: formPostalCode,
    };

    if (editingInvoice) {
      await updateInvoice(editingInvoice.id, data);
    } else {
      await addInvoice({ ...data, id: 'nf-' + Date.now(), createdAt: new Date().toISOString() } as Invoice);
    }
    resetForm();
    setShowForm(false);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setFormItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const removeItem = (index: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmEmit = async () => {
    if (!confirmEmitId) return;
    setEmitError(null);
    try {
      await emitInvoice(confirmEmitId);
    } catch (err) {
      setEmitError(err instanceof Error ? err.message : 'Erro ao emitir nota fiscal');
    }
    setConfirmEmitId(null);
  };

  const confirmEmitInvoice = confirmEmitId ? invoices.find((inv) => inv.id === confirmEmitId) : null;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Notas Fiscais</h1>
          <p className={styles.subtitle}>Emissao e controle de notas fiscais de servico</p>
        </div>
        <div className={styles.headerActions}>
          <Button onClick={() => setShowForm(true)}>+ Nova Nota Fiscal</Button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          {(['all', 'rascunho', 'emitida', 'cancelada'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              className={`${styles.filterBtn} ${filterStatus === status ? styles.filterBtnActive : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'Todas' : statusLabels[status]}
            </button>
          ))}
        </div>

        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar por cliente, evento, numero..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Error toast */}
      {emitError && (
        <div className={styles.errorToast}>
          {emitError}
          <button className={styles.errorToastClose} onClick={() => setEmitError(null)}>X</button>
        </div>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>Nenhuma nota fiscal encontrada.</div>
      ) : (
        <div className={styles.cardsGrid}>
          {filtered.map((invoice) => {
            const event = events.find((e) => e.id === invoice.eventId);
            return (
              <div
                key={invoice.id}
                className={styles.card}
                onClick={() => setPreviewInvoice(invoice)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardId}>{invoice.id.toUpperCase()}</span>
                  <Badge variant={statusColors[invoice.status]}>
                    {statusLabels[invoice.status]}
                  </Badge>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Cliente</span>
                    <span className={styles.cardValue}>{invoice.clientName}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Evento</span>
                    <span className={styles.cardValue}>{event?.name || '-'}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Data Emissao</span>
                    <span className={styles.cardValue}>
                      {format(parseISO(invoice.issueDate), 'dd/MM/yyyy')}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Tipo</span>
                    <span className={styles.cardValue}>{(invoice.type ?? 'nfse').toUpperCase()}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>ISS ({invoice.taxRate}%)</span>
                    <span className={styles.cardValue}>
                      R$ {invoice.taxAmount.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Total</span>
                    <span className={styles.cardValueLg}>
                      R$ {invoice.totalValue.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* nfe.io status section */}
                <div className={styles.nfeioSection} onClick={(e) => e.stopPropagation()}>
                  {!invoice.nfeioStatus && invoice.status !== 'cancelada' && (
                    <button
                      className={styles.emitBtn}
                      onClick={(e) => { e.stopPropagation(); setConfirmEmitId(invoice.id); }}
                    >
                      Emitir via nfe.io
                    </button>
                  )}
                  {invoice.nfeioStatus === 'processing' && (
                    <div className={styles.nfeioProcessing}>
                      <span className={styles.spinner} />
                      <Badge variant="amber">Processando...</Badge>
                    </div>
                  )}
                  {invoice.nfeioStatus === 'issued' && (
                    <div className={styles.nfeioIssued}>
                      <Badge variant="green">Emitida via nfe.io</Badge>
                      {invoice.nfeioNumber && (
                        <span className={styles.nfeioNumber}>NF {invoice.nfeioNumber}</span>
                      )}
                      <div className={styles.nfeioLinks}>
                        {invoice.nfeioPdfUrl && (
                          <a className={styles.nfeioLink} href={invoice.nfeioPdfUrl} target="_blank" rel="noreferrer">
                            PDF
                          </a>
                        )}
                        {invoice.nfeioXmlUrl && (
                          <a className={styles.nfeioLink} href={invoice.nfeioXmlUrl} target="_blank" rel="noreferrer">
                            XML
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {invoice.nfeioStatus === 'error' && (
                    <div className={styles.nfeioError}>
                      <Badge variant="red">Erro nfe.io</Badge>
                      <button
                        className={styles.retryBtn}
                        onClick={() => setConfirmEmitId(invoice.id)}
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
                  <span className={styles.cardLabel}>{invoice.clientDocument}</span>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => { e.stopPropagation(); openEditForm(invoice); }}
                      title="Editar"
                    >
                      ✏
                    </button>
                    {invoice.status === 'rascunho' && (
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnWarning}`}
                        onClick={(e) => { e.stopPropagation(); updateInvoice(invoice.id, { status: 'cancelada' }); }}
                        title="Cancelar nota"
                      >
                        🚫
                      </button>
                    )}
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(invoice.id); }}
                      title="Excluir"
                    >
                      X
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm emit modal */}
      {confirmEmitInvoice && (
        <Modal title="Confirmar Emissao via nfe.io" onClose={() => setConfirmEmitId(null)}>
          <div className={styles.confirmModal}>
            <p className={styles.confirmText}>
              Confirma a emissao da nota fiscal via nfe.io?
            </p>
            <div className={styles.confirmDetails}>
              <div className={styles.confirmRow}>
                <span>Tipo:</span>
                <strong>{(confirmEmitInvoice.type ?? 'nfse').toUpperCase()}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Cliente:</span>
                <strong>{confirmEmitInvoice.clientName}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Total:</span>
                <strong>R$ {confirmEmitInvoice.totalValue.toLocaleString('pt-BR')}</strong>
              </div>
            </div>
            <div className={styles.formActions}>
              <Button variant="secondary" type="button" onClick={() => setConfirmEmitId(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirmEmit}>
                Emitir
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <Modal title="Excluir Nota Fiscal" onClose={() => setConfirmDeleteId(null)}>
          <div className={styles.confirmModal}>
            <p className={styles.confirmText}>Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita.</p>
            <div className={styles.formActions}>
              <Button variant="secondary" type="button" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
              <Button type="button" onClick={() => { deleteInvoice(confirmDeleteId); setConfirmDeleteId(null); }}>Excluir</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal title={editingInvoice ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'} size="lg" onClose={() => { resetForm(); setShowForm(false); }}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Tipo de Nota</label>
                <select
                  className={styles.formSelect}
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as 'nfse' | 'nfe')}
                >
                  <option value="nfse">NFS-e (Servico)</option>
                  <option value="nfe">NF-e (Produto)</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Data de Emissao</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={formIssueDate}
                  onChange={(e) => setFormIssueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {formType === 'nfse' && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>Codigo de Servico Municipal</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formServiceCode}
                  onChange={(e) => setFormServiceCode(e.target.value)}
                  placeholder="Ex: 1.01"
                />
              </div>
            )}

            <div className={styles.formRow}>
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
              <div className={styles.formField}>
                <label className={styles.formLabel}>Taxa ISS (%)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={formTaxRate}
                  onChange={(e) => setFormTaxRate(e.target.value)}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Nome do Cliente</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Documento (CPF/CNPJ)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formClientDoc}
                  onChange={(e) => setFormClientDoc(maskCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={18}
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Email do Cliente</label>
              <input
                type="email"
                className={styles.formInput}
                value={formClientEmail}
                onChange={(e) => setFormClientEmail(e.target.value)}
              />
            </div>

            {/* Client address */}
            <div className={styles.addressSection}>
              <p className={styles.itemsSectionTitle}>Endereco do Cliente (obrigatorio para emissao)</p>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Logradouro</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Rua, Avenida..."
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Numero</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formAddressNumber}
                    onChange={(e) => setFormAddressNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Bairro</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>CEP</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formPostalCode}
                    onChange={(e) => setFormPostalCode(e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Cidade</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Estado (UF)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    maxLength={2}
                    placeholder="SP"
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className={styles.itemsSection}>
              <p className={styles.itemsSectionTitle}>Itens da Nota</p>
              {formItems.map((item, index) => (
                <div key={index} className={formType === 'nfe' ? styles.itemRowNfe : styles.itemRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Descricao</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Descricao do item"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Qtd</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Valor Unit.</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {formType === 'nfe' && (
                    <>
                      <div className={styles.formField}>
                        <label className={styles.formLabel}>NCM</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={item.ncm ?? ''}
                          onChange={(e) => updateItem(index, 'ncm', e.target.value)}
                          placeholder="00000000"
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.formLabel}>CFOP</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={item.cfop ?? ''}
                          onChange={(e) => updateItem(index, 'cfop', e.target.value)}
                          placeholder="5102"
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.formLabel}>Unidade</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={item.unit ?? 'UN'}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          placeholder="UN"
                        />
                      </div>
                    </>
                  )}
                  {formItems.length > 1 && (
                    <button type="button" className={styles.removeItemBtn} onClick={() => removeItem(index)}>
                      X
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className={styles.addItemBtn} onClick={() => setFormItems([...formItems, emptyItem()])}>
                + Adicionar Item
              </button>
            </div>

            <div className={styles.formTotal}>
              Subtotal: R$ {formSubtotal.toLocaleString('pt-BR')} | ISS: R$ {formTaxAmount.toLocaleString('pt-BR')} | Total: R$ {formSubtotal.toLocaleString('pt-BR')}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Observacoes</label>
              <textarea
                className={styles.formTextarea}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Status</label>
                <select
                  className={styles.formSelect}
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as InvoiceStatus)}
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="emitida">Emitida</option>
                </select>
              </div>
              <div />
            </div>

            <div className={styles.formActions}>
              <Button variant="secondary" type="button" onClick={() => { resetForm(); setShowForm(false); }}>
                Cancelar
              </Button>
              <Button type="submit">{editingInvoice ? 'Salvar Alterações' : 'Salvar Nota Fiscal'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Preview Modal */}
      {previewInvoice && (
        <Modal title="Visualizar Nota Fiscal" size="lg" onClose={() => setPreviewInvoice(null)}>
          <div className={styles.preview}>
            <div className={styles.previewHeader}>
              <div className={styles.previewLogo}>Soul540</div>
              <div className={styles.previewTitle}>Nota Fiscal de Servicos</div>
            </div>

            <div className={styles.previewSection}>
              <p className={styles.previewSectionTitle}>Tomador de Servico</p>
              <div className={styles.previewInfo}>
                <p><strong>{previewInvoice.clientName}</strong></p>
                <p>{previewInvoice.clientDocument}</p>
                <p>{previewInvoice.clientEmail}</p>
              </div>
            </div>

            <div className={styles.previewSection}>
              <p className={styles.previewSectionTitle}>Detalhes</p>
              <div className={styles.previewInfo}>
                <p>Numero: {previewInvoice.id.toUpperCase()}</p>
                <p>Tipo: {(previewInvoice.type ?? 'nfse').toUpperCase()}</p>
                <p>Evento: {events.find((e) => e.id === previewInvoice.eventId)?.name || '-'}</p>
                <p>Data de Emissao: {format(parseISO(previewInvoice.issueDate), 'dd/MM/yyyy')}</p>
                {previewInvoice.nfeioNumber && <p>Numero NF: {previewInvoice.nfeioNumber}</p>}
              </div>
            </div>

            <table className={styles.previewTable}>
              <thead>
                <tr>
                  <th>Descricao</th>
                  <th>Qtd</th>
                  <th>Valor Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {previewInvoice.items.map((item: InvoiceItem, i: number) => (
                  <tr key={i}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>R$ {item.unitPrice.toLocaleString('pt-BR')}</td>
                    <td>R$ {(item.quantity * item.unitPrice).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.previewTotals}>
              <div className={styles.previewTotalRow}>
                <span>Subtotal:</span>
                <span>R$ {previewInvoice.subtotal.toLocaleString('pt-BR')}</span>
              </div>
              <div className={styles.previewTotalRow}>
                <span>ISS ({previewInvoice.taxRate}%):</span>
                <span>R$ {previewInvoice.taxAmount.toLocaleString('pt-BR')}</span>
              </div>
              <div className={`${styles.previewTotalRow} ${styles.previewTotalFinal}`}>
                <span>Total:</span>
                <span>R$ {previewInvoice.totalValue.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {previewInvoice.notes && (
              <div className={styles.previewNotes}>
                <strong>Observacoes:</strong> {previewInvoice.notes}
              </div>
            )}

            <div className={styles.previewFooter}>
              Documento gerado em {format(new Date(), "dd/MM/yyyy 'as' HH:mm")}
            </div>
          </div>

          <div className={styles.previewActions}>
            <Button variant="secondary" onClick={() => setPreviewInvoice(null)}>Fechar</Button>
            <Button onClick={() => window.print()}>Imprimir</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
