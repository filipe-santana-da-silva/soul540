import { useState, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Contract } from '@backend/infra/data/mockData';
import type { PizzaEvent } from '@backend/domain/entities/Event';
import styles from './ContractDocument.module.scss';

interface Props {
  contract: Contract;
  event: PizzaEvent | undefined;
  eventName: string;
  onClose: () => void;
}

// Inline editable field
function EF({
  value,
  onChange,
  editing,
  multiline,
  bold,
  placeholder = '_______________',
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  multiline?: boolean;
  bold?: boolean;
  placeholder?: string;
}) {
  if (!editing) {
    return (
      <span className={styles.fieldView} style={{ fontWeight: bold ? 600 : undefined }}>
        {value || placeholder}
      </span>
    );
  }
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.fieldTextarea}
        rows={3}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={styles.fieldInput}
      style={{ fontWeight: bold ? 600 : undefined }}
    />
  );
}

export default function ContractDocument({ contract, event, eventName, onClose }: Props) {
  const docRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Editable state — company info
  const [companyName, setCompanyName] = useState('Soul540 - Pizzas Artesanais');
  const [companyCnpj, setCompanyCnpj] = useState('00.000.000/0001-00');
  const [companyAddress, setCompanyAddress] = useState('Sao Paulo, SP');

  // Client info
  const [clientName, setClientName] = useState(contract.clientName);
  const [clientDocument, setClientDocument] = useState(contract.clientDocument || '');
  const [clientEmail, setClientEmail] = useState(contract.clientEmail || '');
  const [clientPhone, setClientPhone] = useState(contract.clientPhone || '');

  // Event info
  const [eventDate, setEventDate] = useState(
    event?.date ? format(parseISO(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''
  );
  const [eventLocation, setEventLocation] = useState(event?.location || '');
  const [eventGuests, setEventGuests] = useState(event?.guestCount?.toString() || '');

  // Service + payment
  const [serviceDescription, setServiceDescription] = useState(contract.description);
  const [totalValue, setTotalValue] = useState(
    contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  );
  const [paymentConditions, setPaymentConditions] = useState(contract.paymentConditions || '50% adiantado, 50% no dia do evento');

  // Clauses
  const [clause5, setClause5] = useState(
    'A CONTRATADA compromete-se a entregar os servicos descritos neste contrato com pontualidade, qualidade e higiene, utilizando ingredientes frescos e de primeira linha.'
  );
  const [clause6, setClause6] = useState(
    'Em caso de cancelamento pelo CONTRATANTE com mais de 7 (sete) dias de antecedencia, sera realizado reembolso integral. Cancelamentos com menos de 7 dias: retencao de 30% do valor total como taxa administrativa.'
  );
  const [terms, setTerms] = useState(contract.terms || '');
  const [forumClause, setForumClause] = useState(
    'As partes elegem o foro da comarca de Sao Paulo/SP para dirimir eventuais controversias oriundas deste contrato.'
  );
  const [contractCity, setContractCity] = useState('Sao Paulo');

  const hasTerms = terms.trim().length > 0;
  const forumClauseNum = hasTerms ? '8' : '7';

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const createdDate = format(parseISO(contract.createdAt), "dd/MM/yyyy", { locale: ptBR });

  const handleGeneratePdf = useCallback(async () => {
    if (!docRef.current) return;
    setGenerating(true);
    setEditing(false);
    await new Promise((r) => setTimeout(r, 150));
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `contrato-${contract.id}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(docRef.current)
        .save();
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setGenerating(false);
    }
  }, [contract.id]);

  return (
    <div className={styles.overlay}>
      {/* ——— Top bar ——— */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.contractRef}>#{contract.id.split('-').pop()?.toUpperCase()}</span>
          <span className={styles.contractClient}>{clientName}</span>
        </div>
        <div className={styles.topBarActions}>
          <button
            className={`${styles.btnBar} ${editing ? styles.btnBarActive : ''}`}
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            )}
            <span>{editing ? 'Visualizar' : 'Editar'}</span>
          </button>
          <button className={styles.btnBar} onClick={() => window.print()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            <span>Imprimir</span>
          </button>
          <button className={`${styles.btnBar} ${styles.btnBarPrimary}`} onClick={handleGeneratePdf} disabled={generating}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>{generating ? 'Gerando...' : 'Gerar PDF'}</span>
          </button>
          <button className={styles.btnBarClose} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* ——— Document ——— */}
      <div className={styles.scrollArea}>
        <div className={styles.paper}>
          <div className={styles.paperInner} ref={docRef}>

            {/* HEADER */}
            <div className={styles.docHeader}>
              <div className={styles.docCompanyName}>
                <EF value={companyName} onChange={setCompanyName} editing={editing} bold />
              </div>
              <div className={styles.docCompanyMeta}>
                <span>CNPJ: <EF value={companyCnpj} onChange={setCompanyCnpj} editing={editing} /></span>
                <span>|</span>
                <span><EF value={companyAddress} onChange={setCompanyAddress} editing={editing} /></span>
              </div>
            </div>

            <div className={styles.docRef}>
              Contrato Nº {contract.id.toUpperCase()} | Emitido em {createdDate}
            </div>

            <div className={styles.docTitle}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>

            {/* PREÂMBULO */}
            <p className={styles.docPreamble}>
              Pelo presente instrumento particular, de um lado{' '}
              <EF value={companyName} onChange={setCompanyName} editing={editing} bold />,
              inscrita no CNPJ sob o nº{' '}
              <EF value={companyCnpj} onChange={setCompanyCnpj} editing={editing} bold />,
              com sede em <EF value={companyAddress} onChange={setCompanyAddress} editing={editing} />,
              doravante denominada <strong>CONTRATADA</strong>, e de outro lado:
            </p>

            {/* CLÁUSULA 1 — CONTRATANTE */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 1ª — DO CONTRATANTE</div>
              <div className={styles.clauseBox}>
                <div className={styles.clauseGrid}>
                  <div className={styles.clauseField}>
                    <span className={styles.clauseFieldLabel}>Nome / Razão Social: </span>
                    <EF value={clientName} onChange={setClientName} editing={editing} bold />
                  </div>
                  <div className={styles.clauseField}>
                    <span className={styles.clauseFieldLabel}>CPF / CNPJ: </span>
                    <EF value={clientDocument} onChange={setClientDocument} editing={editing} placeholder="000.000.000-00" />
                  </div>
                  <div className={styles.clauseField}>
                    <span className={styles.clauseFieldLabel}>E-mail: </span>
                    <EF value={clientEmail} onChange={setClientEmail} editing={editing} placeholder="email@exemplo.com" />
                  </div>
                  <div className={styles.clauseField}>
                    <span className={styles.clauseFieldLabel}>Telefone: </span>
                    <EF value={clientPhone} onChange={setClientPhone} editing={editing} placeholder="(00) 00000-0000" />
                  </div>
                </div>
              </div>
              <p className={styles.clausePostScript}>
                Doravante denominado(a) <strong>CONTRATANTE</strong>, têm entre si justo e acertado o presente
                contrato de prestação de serviços, que se regerá pelas cláusulas seguintes:
              </p>
            </div>

            {/* CLÁUSULA 2 — EVENTO */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 2ª — DO EVENTO</div>
              <div className={styles.clauseBox}>
                <div className={styles.clauseField} style={{ marginBottom: 6 }}>
                  <span className={styles.clauseFieldLabel}>Evento: </span>
                  <strong>{eventName || '—'}</strong>
                </div>
                <div className={styles.clauseGrid}>
                  <div className={styles.clauseField}>
                    <span className={styles.clauseFieldLabel}>Data: </span>
                    <EF value={eventDate} onChange={setEventDate} editing={editing} placeholder="dd/mm/aaaa" />
                  </div>
                  <div className={styles.clauseField}>
                    <span className={styles.clauseFieldLabel}>Nº de Convidados: </span>
                    <EF value={eventGuests} onChange={setEventGuests} editing={editing} placeholder="0" />
                  </div>
                  <div className={styles.clauseField} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.clauseFieldLabel}>Local: </span>
                    <EF value={eventLocation} onChange={setEventLocation} editing={editing} placeholder="Endereco do evento" />
                  </div>
                </div>
              </div>
            </div>

            {/* CLÁUSULA 3 — OBJETO */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 3ª — DO OBJETO</div>
              <p className={styles.clauseText} style={{ marginBottom: 8 }}>
                O presente contrato tem por objeto a prestação dos seguintes serviços pela CONTRATADA:
              </p>
              <div className={styles.clauseBox}>
                <EF value={serviceDescription} onChange={setServiceDescription} editing={editing} multiline />
              </div>
            </div>

            {/* CLÁUSULA 4 — PAGAMENTO */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 4ª — DO PAGAMENTO</div>
              <p className={styles.clauseText} style={{ marginBottom: 12 }}>
                Pela prestação dos serviços descritos na Cláusula 3ª, o CONTRATANTE pagará à CONTRATADA o valor total de:
              </p>
              <div className={styles.paymentBox}>
                <div className={styles.paymentValue}>
                  R$ <EF value={totalValue} onChange={setTotalValue} editing={editing} bold />
                </div>
              </div>
              <p className={styles.clauseText}>
                <span className={styles.clauseFieldLabel}>Condições: </span>
                <EF value={paymentConditions} onChange={setPaymentConditions} editing={editing} />
              </p>
            </div>

            {/* CLÁUSULA 5 — OBRIGAÇÕES */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 5ª — DAS OBRIGAÇÕES DA CONTRATADA</div>
              <div className={styles.clauseText}>
                <EF value={clause5} onChange={setClause5} editing={editing} multiline />
              </div>
            </div>

            {/* CLÁUSULA 6 — CANCELAMENTO */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 6ª — DO CANCELAMENTO</div>
              <div className={styles.clauseText}>
                <EF value={clause6} onChange={setClause6} editing={editing} multiline />
              </div>
            </div>

            {/* CLÁUSULA 7 — DISPOSIÇÕES ADICIONAIS (opcional) */}
            {hasTerms && (
              <div className={styles.clause}>
                <div className={styles.clauseTitle}>CLÁUSULA 7ª — DISPOSIÇÕES ADICIONAIS</div>
                <div className={styles.clauseText}>
                  <EF value={terms} onChange={setTerms} editing={editing} multiline />
                </div>
              </div>
            )}

            {/* CLÁUSULA 7/8 — DO FORO */}
            <div className={styles.clause} style={{ marginBottom: 28 }}>
              <div className={styles.clauseTitle}>CLÁUSULA {forumClauseNum}ª — DO FORO</div>
              <div className={styles.clauseText}>
                <EF value={forumClause} onChange={setForumClause} editing={editing} multiline />
              </div>
            </div>

            {/* DATA E LOCAL */}
            <p className={styles.docDate}>
              <EF value={contractCity} onChange={setContractCity} editing={editing} />, {today}.
            </p>

            {/* ASSINATURAS */}
            <div className={styles.sigGrid}>
              <div className={styles.sigBlock}>
                <div className={styles.sigLine}>
                  <div className={styles.sigName}>{companyName.split(' - ')[0]}</div>
                  <div className={styles.sigRole}>CONTRATADA</div>
                  <div className={styles.sigDoc}>CNPJ: {companyCnpj}</div>
                </div>
              </div>
              <div className={styles.sigBlock}>
                <div className={styles.sigLine}>
                  <div className={styles.sigName}>{clientName}</div>
                  <div className={styles.sigRole}>CONTRATANTE</div>
                  <div className={styles.sigDoc}>{clientDocument || 'CPF/CNPJ: ___________'}</div>
                </div>
              </div>
            </div>

            {/* TESTEMUNHAS */}
            <div className={styles.witnessGrid}>
              <div className={styles.witnessBlock}>
                <div className={styles.witnessLine}>
                  <div className={styles.witnessRole}>Testemunha 1</div>
                  <div className={styles.witnessBlank}>
                    Nome: ___________________________<br />
                    CPF: ____________________________
                  </div>
                </div>
              </div>
              <div className={styles.witnessBlock}>
                <div className={styles.witnessLine}>
                  <div className={styles.witnessRole}>Testemunha 2</div>
                  <div className={styles.witnessBlank}>
                    Nome: ___________________________<br />
                    CPF: ____________________________
                  </div>
                </div>
              </div>
            </div>

            {/* RODAPÉ */}
            <div className={styles.docFooter}>
              Documento gerado pelo sistema Soul540 | {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
