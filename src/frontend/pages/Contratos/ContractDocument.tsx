import { useState, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PizzaEvent } from '@backend/domain/entities/Event';
import styles from './ContractDocument.module.scss';

export type Contract = {
  id: string;
  clientName: string;
  clientDocument?: string;
  clientRg?: string;
  clientAddress?: string;
  clientEmail?: string;
  clientPhone?: string;
  eventId?: string;
  value: number;
  startDate: string;
  endDate?: string;
  description: string;
  paymentConditions?: string;
  terms?: string;
  status: string;
  createdAt: string;
  pricePerAdult?: number;
  adultsCount?: number;
  pricePerChild?: number;
  childrenCount?: number;
  additionalServices?: string;
  minGuests?: number;
  serviceType?: string;
  drinksDescription?: string;
  cancellationDays?: number;
  pizzaTeam?: string;
  drinksTeam?: string;
};

interface Props {
  contract: Contract;
  event: PizzaEvent | undefined;
  eventName: string;
  onClose: () => void;
}

function EF({
  value, onChange, editing, multiline, bold, placeholder = '_______________',
}: {
  value: string; onChange: (v: string) => void; editing: boolean;
  multiline?: boolean; bold?: boolean; placeholder?: string;
}) {
  if (!editing) {
    return <span className={styles.fieldView} style={{ fontWeight: bold ? 600 : undefined }}>{value || placeholder}</span>;
  }
  if (multiline) {
    return <textarea value={value} onChange={(e) => onChange(e.target.value)} className={styles.fieldTextarea} rows={3} />;
  }
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={styles.fieldInput} style={{ fontWeight: bold ? 600 : undefined }} />;
}

export default function ContractDocument({ contract, event, eventName, onClose }: Props) {
  const docRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Company (real Soul540 data — editable for adjustments)
  const [companyName, setCompanyName] = useState('Soul Negócios Eventos e Consultoria Ltda');
  const [companyCnpj, setCompanyCnpj] = useState('37.763.790/0001-77');
  const [companyIe, setCompanyIe] = useState('798.871.206.119');
  const [companyAddress, setCompanyAddress] = useState('Rua Alameda dos Lírios 515 / Jardim Simus / Sorocaba – SP / CEP 18055141');
  const [companyFantasy, setCompanyFantasy] = useState('Soul 540 Pizzas');
  const [signerName, setSignerName] = useState('Rogério Narciso Gomes');
  const [signerCpf, setSignerCpf] = useState('148.778.078-88');

  // Client
  const [clientName, setClientName] = useState(contract.clientName);
  const [clientDocument, setClientDocument] = useState(contract.clientDocument || '');
  const [clientRg, setClientRg] = useState(contract.clientRg || '');
  const [clientAddress, setClientAddress] = useState(contract.clientAddress || '');

  // Event
  const [eventDate, setEventDate] = useState(
    event?.date ? format(parseISO(event.date), "dd/MM/yyyy", { locale: ptBR }) : '',
  );
  const [eventLocation, setEventLocation] = useState(event?.location || '');
  const [eventDesc, setEventDesc] = useState(contract.description || '');

  // Pricing
  const [pricePerAdult, setPricePerAdult] = useState(contract.pricePerAdult?.toFixed(2) || '');
  const [adultsCount, setAdultsCount] = useState(contract.adultsCount?.toString() || '');
  const [pricePerChild, setPricePerChild] = useState(contract.pricePerChild?.toFixed(2) || '');
  const [childrenCount, setChildrenCount] = useState(contract.childrenCount?.toString() || '');
  const [additionalServices, setAdditionalServices] = useState(contract.additionalServices || '');
  const [totalValue, setTotalValue] = useState(
    contract.value > 0
      ? contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      : '',
  );

  const adultTotal = (parseFloat(pricePerAdult.replace(',', '.')) || 0) * (parseInt(adultsCount) || 0);
  const childTotal = (parseFloat(pricePerChild.replace(',', '.')) || 0) * (parseInt(childrenCount) || 0);

  // Guests
  const [minGuests, setMinGuests] = useState(
    contract.minGuests?.toString() || contract.adultsCount?.toString() || '',
  );

  // Service
  const [serviceType, setServiceType] = useState(contract.serviceType || 'self service e coquetel');
  const [drinksDescription, setDrinksDescription] = useState(contract.drinksDescription || '');

  // Cancellation
  const [cancellationDays, setCancellationDays] = useState(
    contract.cancellationDays?.toString() || '30',
  );

  // Team
  const [pizzaTeam, setPizzaTeam] = useState(contract.pizzaTeam || '');
  const [drinksTeam, setDrinksTeam] = useState(contract.drinksTeam || '');

  // Signature location
  const [contractCity, setContractCity] = useState('Sorocaba/SP');
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const createdDate = format(parseISO(contract.createdAt), 'dd/MM/yyyy', { locale: ptBR });

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
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.contractRef}>#{contract.id.split('-').pop()?.toUpperCase()}</span>
          <span className={styles.contractClient}>{clientName}</span>
        </div>
        <div className={styles.topBarActions}>
          <button className={`${styles.btnBar} ${editing ? styles.btnBarActive : ''}`} onClick={() => setEditing((v) => !v)}>
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

      {/* Document */}
      <div className={styles.scrollArea}>
        <div className={styles.paper}>
          <div className={styles.paperInner} ref={docRef}>

            {/* ——— CABEÇALHO ——— */}
            <div className={styles.docHeader}>
              <div className={styles.docCompanyName}>
                <EF value={companyName} onChange={setCompanyName} editing={editing} bold />
              </div>
              <div className={styles.docCompanyMeta}>
                CNPJ <EF value={companyCnpj} onChange={setCompanyCnpj} editing={editing} /> &nbsp;/&nbsp; IE&nbsp;
                <EF value={companyIe} onChange={setCompanyIe} editing={editing} />
              </div>
              <div className={styles.docCompanyMeta}>
                <EF value={companyAddress} onChange={setCompanyAddress} editing={editing} />
              </div>
              <div className={styles.docCompanyMeta}>
                Marca fantasia: <strong><EF value={companyFantasy} onChange={setCompanyFantasy} editing={editing} /></strong>
              </div>
            </div>

            <div className={styles.docRef}>
              Contrato Nº {contract.id.toUpperCase()} | Emitido em {createdDate}
            </div>

            <div className={styles.docTitle}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>

            {/* ——— CONTRATANTES ——— */}
            <div className={styles.partiesBlock}>
              <p className={styles.partiesLabel}>CONTRATANTES:</p>
              <div className={styles.clauseBox}>
                <div className={styles.clauseGrid}>
                  <div className={styles.clauseField} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.clauseFieldLabel}>Nome: </span>
                    <EF value={clientName} onChange={setClientName} editing={editing} bold />
                  </div>
                  <div className={styles.clauseField}>
                    <span className={styles.clauseFieldLabel}>CPF: </span>
                    <EF value={clientDocument} onChange={setClientDocument} editing={editing} placeholder="000.000.000-00" />
                  </div>
                  <div className={styles.clauseField}>
                    <span className={styles.clauseFieldLabel}>RG: </span>
                    <EF value={clientRg} onChange={setClientRg} editing={editing} placeholder="00.000.000-0" />
                  </div>
                  <div className={styles.clauseField} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.clauseFieldLabel}>Endereço: </span>
                    <EF value={clientAddress} onChange={setClientAddress} editing={editing} placeholder="Rua, nº – Bairro – Cidade, Estado" />
                  </div>
                </div>
              </div>
            </div>

            {/* ——— CLÁUSULA 1 – OBJETO ——— */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 1 – OBJETO</div>
              <p className={styles.clauseText}>
                A CONTRATADA prestará serviços de evento de pizzas para{' '}
                <EF value={eventDesc} onChange={setEventDesc} editing={editing} placeholder="descrição do evento" />{' '}
                da CONTRATANTE, no dia{' '}
                <EF value={eventDate} onChange={setEventDate} editing={editing} placeholder="dd/mm/aaaa" />,
                no{' '}
                <EF value={eventLocation} onChange={setEventLocation} editing={editing} placeholder="Local do evento – Cidade/UF" />.{' '}
                O espaço será de responsabilidade dos CONTRATANTES, devendo estar disponível 3 horas antes para montagem.
              </p>
            </div>

            {/* ——— CLÁUSULA 2 – DETALHES DO SERVIÇO ——— */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 2 – DETALHES DO SERVIÇO</div>

              <p className={styles.clauseSubTitle}>2.1 Valor e Pagamento</p>
              <div className={styles.clauseBox}>
                <div className={styles.priceRow}>
                  <span className={styles.clauseFieldLabel}>Valor por adulto:</span>
                  <span>
                    R$&nbsp;<EF value={pricePerAdult} onChange={setPricePerAdult} editing={editing} placeholder="0,00" />&nbsp;
                    (<EF value={adultsCount} onChange={setAdultsCount} editing={editing} placeholder="0" /> convidados)
                    &nbsp;→ Total R$&nbsp;
                    {adultTotal > 0
                      ? adultTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                      : '___'}
                  </span>
                </div>
                <div className={styles.priceRow}>
                  <span className={styles.clauseFieldLabel}>Valor por criança (7 a 11 anos):</span>
                  <span>
                    R$&nbsp;<EF value={pricePerChild} onChange={setPricePerChild} editing={editing} placeholder="0,00" />&nbsp;
                    (<EF value={childrenCount} onChange={setChildrenCount} editing={editing} placeholder="0" /> convidados)
                    &nbsp;→ Total R$&nbsp;
                    {childTotal > 0
                      ? childTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                      : '___'}
                  </span>
                </div>
                <div className={styles.priceRow}>
                  <span className={styles.clauseFieldLabel}>Serviços adicionais:</span>
                  <EF value={additionalServices} onChange={setAdditionalServices} editing={editing} placeholder="—" />
                </div>
                <div className={styles.priceTotalRow}>
                  <span className={styles.clauseFieldLabel}>Valor total:</span>
                  <span className={styles.priceTotalValue}>
                    R$&nbsp;<EF value={totalValue} onChange={setTotalValue} editing={editing} bold placeholder="0,00" />
                  </span>
                </div>
                <p className={styles.paymentOptions}>
                  <strong>Formas de Pagamento:</strong><br />
                  Opção 1: 30% na assinatura via Pix + saldo no dia do evento via Pix.<br />
                  Opção 2: Parcelamento em até 2x no cartão (link enviado pela CONTRATADA).
                </p>
              </div>

              <p className={styles.clauseSubTitle}>2.2 Convidados</p>
              <p className={styles.clauseText}>
                Valor mínimo referente a{' '}
                <EF value={minGuests} onChange={setMinGuests} editing={editing} placeholder="0" />{' '}
                convidados, mesmo em caso de ausência. A lista final será conferida pela CONTRATADA no evento.
                Aumento acima de 20% deve ser informado com 48h de antecedência.
                Convidados excedentes serão cobrados no valor unitário acordado.
              </p>

              <p className={styles.clauseSubTitle}>2.3 Cardápio</p>
              <p className={styles.clauseText}>
                Entradas e pizzas salgadas e doces conforme <strong>Cardápio – Anexo I</strong>.
              </p>

              <p className={styles.clauseSubTitle}>2.4 Sistema de Serviço</p>
              <p className={styles.clauseText}>
                <strong>Pizzas:</strong> Serviço em formato{' '}
                <EF value={serviceType} onChange={setServiceType} editing={editing} />.<br />
                <strong>Bebidas:</strong>{' '}
                <EF value={drinksDescription} onChange={setDrinksDescription} editing={editing} placeholder="Descreva o serviço de bebidas" />
              </p>
            </div>

            {/* ——— CLÁUSULA 3 – PRORROGAÇÃO ——— */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 3 – PRORROGAÇÃO DE HORÁRIO</div>
              <p className={styles.clauseText}>
                Horas adicionais serão cobradas em 20% do valor total por hora, conforme disponibilidade de insumos e equipe.
              </p>
            </div>

            {/* ——— CLÁUSULA 4 – CANCELAMENTO ——— */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 4 – CANCELAMENTO</div>
              <p className={styles.clauseText}>
                Em até <EF value={cancellationDays} onChange={setCancellationDays} editing={editing} placeholder="30" /> dias não haverá multa.<br />
                Até 10 dias antes: multa de 20% do valor total.<br />
                Até 7 dias antes: multa de 50%.<br />
                Menos de 24h antes: cobrança integral.<br /><br />
                A Contratada ficará isenta de responsabilidade por eventual não realização do evento em virtude
                de queda/falta de energia, caso fortuito ou de força maior (chuva, tempestades etc.),
                entretanto será reagendado uma nova data nas mesmas condições, ou o valor da entrada será
                devolvido em até 3 dias úteis para a conta bancária.
              </p>
            </div>

            {/* ——— CLÁUSULA 5 – CONDIÇÕES GERAIS ——— */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 5 – CONDIÇÕES GERAIS</div>
              <p className={styles.clauseText}>
                A CONTRATADA fornecerá guardanapos, tábuas, bandejas e utensílios necessários.<br />
                <strong>Equipe das pizzas:</strong>{' '}
                <EF value={pizzaTeam} onChange={setPizzaTeam} editing={editing} placeholder="Descreva a equipe" /><br />
                <strong>Equipe da bebida:</strong>{' '}
                <EF value={drinksTeam} onChange={setDrinksTeam} editing={editing} placeholder="Descreva a equipe" /><br /><br />
                Até 5 colaboradores de outros serviços poderão se alimentar antes do início sem custo
                adicional, limitando-se aos sabores disponíveis. Demais serviços não listados são
                responsabilidade dos CONTRATANTES.
              </p>
            </div>

            {/* ——— CLÁUSULA 6 – COMUNICAÇÃO ——— */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 6 – COMUNICAÇÃO</div>
              <p className={styles.clauseText}>
                Dúvidas ou solicitações devem ser feitas via WhatsApp: <strong>(19) 98160-5481</strong>.
              </p>
            </div>

            {/* ——— CLÁUSULA 7 – VALIDADE ——— */}
            <div className={styles.clause}>
              <div className={styles.clauseTitle}>CLÁUSULA 7 – VALIDADE</div>
              <p className={styles.clauseText}>
                Este contrato é válido exclusivamente para o evento descrito e a proposta tem validade
                de 5 dias a partir da data de assinatura.
              </p>
            </div>

            {/* ——— CLÁUSULA 8 – ALTERAÇÕES ——— */}
            <div className={styles.clause} style={{ marginBottom: 28 }}>
              <div className={styles.clauseTitle}>CLÁUSULA 8 – ALTERAÇÕES</div>
              <p className={styles.clauseText}>
                Qualquer modificação só terá validade se feita por escrito e assinada por ambas as partes.
              </p>
            </div>

            {/* ——— DATA E LOCAL ——— */}
            <p className={styles.docDate}>
              <EF value={contractCity} onChange={setContractCity} editing={editing} />, {today}
            </p>

            {/* ——— ASSINATURAS ——— */}
            <div className={styles.sigGrid}>
              <div className={styles.sigBlock}>
                <div className={styles.sigLine}>
                  <div className={styles.sigName}>
                    <EF value={companyName} onChange={setCompanyName} editing={editing} />
                  </div>
                  <div className={styles.sigRole}>CONTRATADA</div>
                  <div className={styles.sigDoc}>
                    <EF value={signerName} onChange={setSignerName} editing={editing} /> – CPF{' '}
                    <EF value={signerCpf} onChange={setSignerCpf} editing={editing} />
                  </div>
                </div>
              </div>
              <div className={styles.sigBlock}>
                <div className={styles.sigLine}>
                  <div className={styles.sigName}>{clientName}</div>
                  <div className={styles.sigRole}>CONTRATANTE</div>
                  <div className={styles.sigDoc}>
                    CPF: {clientDocument || '___________'} &nbsp;|&nbsp; RG: {clientRg || '___________'}
                  </div>
                </div>
              </div>
            </div>

            {/* ——— TESTEMUNHAS ——— */}
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

            <div className={styles.docFooter}>
              Documento gerado pelo sistema Soul540 | {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>

            {/* ——— ANEXO I – CARDÁPIO ——— */}
            <div className={styles.annex}>
              <div className={styles.annexTitle}>📋 Anexo I – Cardápio do Evento</div>

              <p className={styles.annexSection}>🥖 Entradas</p>
              <table className={styles.menuTable}>
                <thead>
                  <tr><th>Item</th><th>Descrição</th></tr>
                </thead>
                <tbody>
                  <tr><td>Crostinis</td><td>Torradinhas artesanais com azeite</td></tr>
                  <tr><td>Pãozinho de Calabresa</td><td>Massa leve com calabresa</td></tr>
                  <tr><td>Maravilha de Queijo</td><td>Massa recheada com queijo derretido</td></tr>
                </tbody>
              </table>

              <p className={styles.annexSection}>🍕 Pizzas Salgadas</p>
              <table className={styles.menuTable}>
                <thead>
                  <tr><th>Nome</th><th>Ingredientes</th></tr>
                </thead>
                <tbody>
                  <tr><td>ZUCCHINI SPECIALI</td><td>Massa, molho de tomate, abobrinha, alho frito, parmesão, azeite e orégano</td></tr>
                  <tr><td>BLU AGRIDOCE</td><td>Massa, molho de tomate, geleia de pimenta, mussarela, gorgonzola, bacon e orégano</td></tr>
                  <tr><td>MARGHERITA BÚFALA</td><td>Massa, molho de tomate, mussarela de búfala, parmesão, manjericão, azeite e orégano</td></tr>
                  <tr><td>CALABRESA TRADIZIONALE</td><td>Massa, molho de tomate, mussarela, calabresa, cebola, azeitona e orégano</td></tr>
                  <tr><td>MOZZARELLA SPECIALI</td><td>Massa, molho de tomate, mussarela, tomate em pedaços, azeitona, parmesão, manjericão, azeite e orégano</td></tr>
                  <tr><td>QUATTRO FORAGGIO</td><td>Massa, molho, mussarela, parmesão, gorgonzola, catupiry e orégano</td></tr>
                  <tr><td>DUO FRANGO E BACON</td><td>Massa, molho de tomate, mussarela, frango desfiado, Catupiry, bacon e orégano</td></tr>
                  <tr><td>SEM GLUTEN</td><td>Massa especial sem glúten com recheios disponíveis no mise en place</td></tr>
                </tbody>
              </table>

              <p className={styles.annexSection}>🍫 Pizzas Doces</p>
              <table className={styles.menuTable}>
                <thead>
                  <tr><th>Nome</th><th>Ingredientes</th></tr>
                </thead>
                <tbody>
                  <tr><td>Chocolate</td><td>Massa, Chocolate ao leite, confeitos</td></tr>
                </tbody>
              </table>

              <p className={styles.annexObs}>
                <strong>Observação:</strong> O serviço será realizado em formato coquetel e rodízio, com garçons
                servindo fatias aos convidados e mesa de apoio disponível para autoatendimento.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
