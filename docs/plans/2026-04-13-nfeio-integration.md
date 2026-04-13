# nfe.io Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adicionar emissão eletrônica de NFS-e e NF-e via nfe.io nas páginas de Notas Fiscais do app principal e da fábrica, com polling de status e armazenamento da resposta completa.

**Architecture:** Proxy server-side — o frontend chama `/api/invoices/:id/emit`, o Express chama a nfe.io com a API key guardada em `.env`, salva a resposta no MongoDB e devolve a invoice atualizada. O frontend faz polling de `GET /api/invoices/:id/nfeio-status` a cada 3s até status final.

**Tech Stack:** Express + Mongoose (backend), React + TypeScript (frontend, 2 apps), nfe.io REST API, `fetch` nativo para chamadas à nfe.io no servidor.

---

## Task 1: Atualizar shared/types.ts — novos campos em Invoice e InvoiceItem

**Files:**
- Modify: `shared/types.ts`

**Step 1: Adicionar campos a InvoiceItem**

Em `shared/types.ts`, localizar `export interface InvoiceItem` e substituir por:

```typescript
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  // NF-e only
  ncm?: string;
  cfop?: string;
  unit?: string;
}
```

**Step 2: Adicionar campos a Invoice**

Localizar `export interface Invoice` e adicionar após `status: InvoiceStatus;`:

```typescript
  // Tipo de documento
  type?: 'nfse' | 'nfe';
  serviceCode?: string;          // código de serviço municipal (NFS-e)

  // Endereço do tomador/destinatário
  clientAddress?: string;
  clientNumber?: string;
  clientDistrict?: string;
  clientCity?: string;
  clientState?: string;
  clientPostalCode?: string;

  // Resposta nfe.io (preenchida após emissão)
  nfeioId?: string;
  nfeioStatus?: 'processing' | 'issued' | 'error';
  nfeioNumber?: string;
  nfeioPdfUrl?: string;
  nfeioXmlUrl?: string;
  nfeioAccessKey?: string;
  nfeioProtocol?: string;
  nfeioRawResponse?: Record<string, unknown>;
```

**Step 3: Verificar compilação**

```bash
cd Soul540
npx tsx shared/types.ts
```
Esperado: sem output (sem erros).

**Step 4: Commit**

```bash
git add shared/types.ts
git commit -m "feat(types): add nfe.io fields to Invoice and InvoiceItem"
```

---

## Task 2: Atualizar schema Mongoose e adicionar rotas de emissão

**Files:**
- Modify: `server/routes/invoices.ts`

**Step 1: Atualizar InvoiceItemSchema**

Localizar `const InvoiceItemSchema` e substituir por:

```typescript
const InvoiceItemSchema = new Schema({
  description: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  ncm: { type: String, default: '' },
  cfop: { type: String, default: '' },
  unit: { type: String, default: 'UN' },
}, { _id: false });
```

**Step 2: Adicionar campos nfe.io ao createTenantModels**

Localizar `const models = createTenantModels('Invoice', {` e adicionar os campos novos após `createdAt`:

```typescript
  // Tipo e configuração fiscal
  type: { type: String, default: 'nfse' },
  serviceCode: { type: String, default: '' },

  // Endereço do tomador/destinatário
  clientAddress: { type: String, default: '' },
  clientNumber: { type: String, default: '' },
  clientDistrict: { type: String, default: '' },
  clientCity: { type: String, default: '' },
  clientState: { type: String, default: '' },
  clientPostalCode: { type: String, default: '' },

  // Resposta nfe.io
  nfeioId: { type: String, default: null },
  nfeioStatus: { type: String, default: null },
  nfeioNumber: { type: String, default: null },
  nfeioPdfUrl: { type: String, default: null },
  nfeioXmlUrl: { type: String, default: null },
  nfeioAccessKey: { type: String, default: null },
  nfeioProtocol: { type: String, default: null },
  nfeioRawResponse: { type: Object, default: null },
```

**Step 3: Adicionar helper buildNfeioHeaders no topo do arquivo (após imports)**

```typescript
function nfeioHeaders() {
  return {
    'Authorization': process.env.NFEIO_API_KEY ?? '',
    'Content-Type': 'application/json',
  };
}

function nfeioBase() {
  return `https://api.nfe.io/v1/companies/${process.env.NFEIO_COMPANY_ID}`;
}
```

**Step 4: Adicionar rota POST /api/invoices/:id/emit**

Adicionar antes de `export default router;`:

```typescript
router.post('/:id/emit', async (req, res) => {
  const found = await models.findInAll(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const inv = found.doc as any;

  if (!process.env.NFEIO_API_KEY || !process.env.NFEIO_COMPANY_ID) {
    return res.status(503).json({ error: 'NFEIO_API_KEY e NFEIO_COMPANY_ID não configurados no servidor.' });
  }

  // Monta payload conforme tipo
  let endpoint: string;
  let payload: Record<string, unknown>;

  const borrowerDoc = (inv.clientDocument ?? '').replace(/\D/g, '');

  if (inv.type === 'nfe') {
    endpoint = `${nfeioBase()}/nfe`;
    payload = {
      nature: 'Sale',
      buyer: {
        name: inv.clientName,
        email: inv.clientEmail || undefined,
        federalTaxNumber: borrowerDoc ? Number(borrowerDoc) : undefined,
        address: {
          country: 'BRA',
          postalCode: inv.clientPostalCode,
          street: inv.clientAddress,
          number: inv.clientNumber,
          district: inv.clientDistrict,
          city: { name: inv.clientCity },
          state: inv.clientState,
        },
      },
      items: (inv.items ?? []).map((item: any, i: number) => ({
        code: String(i + 1),
        description: item.description,
        quantity: item.quantity,
        unitOfMeasure: item.unit || 'UN',
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        ncm: item.ncm,
        cfop: item.cfop,
      })),
    };
  } else {
    // NFS-e
    endpoint = `${nfeioBase()}/serviceinvoices`;
    const desc = (inv.items ?? []).map((i: any) => i.description).filter(Boolean).join('; ') || inv.notes || 'Serviços prestados';
    payload = {
      cityServiceCode: inv.serviceCode,
      description: desc,
      servicesAmount: inv.totalValue,
      borrower: {
        name: inv.clientName,
        email: inv.clientEmail || undefined,
        federalTaxNumber: borrowerDoc ? Number(borrowerDoc) : undefined,
        address: {
          country: 'BRA',
          postalCode: inv.clientPostalCode,
          street: inv.clientAddress,
          number: inv.clientNumber,
          district: inv.clientDistrict,
          city: { name: inv.clientCity },
          state: inv.clientState,
        },
      },
    };
  }

  const nfeRes = await fetch(endpoint, {
    method: 'POST',
    headers: nfeioHeaders(),
    body: JSON.stringify(payload),
  });

  const nfeData: any = await nfeRes.json();

  if (!nfeRes.ok) {
    return res.status(nfeRes.status).json({ error: nfeData?.message ?? 'Erro ao chamar nfe.io', nfeioRaw: nfeData });
  }

  const updated = await found.model.findByIdAndUpdate(
    req.params.id,
    {
      nfeioId: nfeData.id,
      nfeioStatus: 'processing',
      nfeioRawResponse: nfeData,
    },
    { new: true },
  );

  await logAudit({ req, action: 'update', resource: 'invoices', resourceId: req.params.id, description: `Emitiu nota fiscal via nfe.io: ${inv.clientName}` });
  res.json(updated);
});
```

**Step 5: Adicionar rota GET /api/invoices/:id/nfeio-status**

Adicionar após a rota de emit:

```typescript
router.get('/:id/nfeio-status', async (req, res) => {
  const found = await models.findInAll(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const inv = found.doc as any;

  if (!inv.nfeioId) return res.status(400).json({ error: 'Nota ainda não emitida via nfe.io.' });

  const isNfe = inv.type === 'nfe';
  const endpoint = isNfe
    ? `${nfeioBase()}/nfe/${inv.nfeioId}`
    : `${nfeioBase()}/serviceinvoices/${inv.nfeioId}`;

  const nfeRes = await fetch(endpoint, { headers: nfeioHeaders() });
  if (!nfeRes.ok) return res.status(nfeRes.status).json({ error: 'Erro ao consultar nfe.io' });

  const nfeData: any = await nfeRes.json();

  // Mapeia flowStatus da nfe.io para nosso status interno
  const flowStatus: string = (nfeData.flowStatus ?? nfeData.status ?? '').toLowerCase();
  let nfeioStatus: 'processing' | 'issued' | 'error';
  if (flowStatus.includes('issued') || flowStatus === 'normal') {
    nfeioStatus = 'issued';
  } else if (flowStatus.includes('error') || flowStatus.includes('cancel')) {
    nfeioStatus = 'error';
  } else {
    nfeioStatus = 'processing';
  }

  const updateFields: Record<string, unknown> = {
    nfeioStatus,
    nfeioRawResponse: nfeData,
  };

  if (nfeioStatus === 'issued') {
    updateFields.status = 'emitida';
    updateFields.nfeioNumber = String(nfeData.number ?? nfeData.invoiceNumber ?? '');
    updateFields.nfeioPdfUrl = nfeData.pdfUrl ?? nfeData.links?.find((l: any) => l.rel === 'pdf')?.href ?? '';
    updateFields.nfeioXmlUrl = nfeData.xmlUrl ?? nfeData.links?.find((l: any) => l.rel === 'xml')?.href ?? '';
    updateFields.nfeioAccessKey = nfeData.accessKey ?? nfeData.invoiceAccessKey ?? '';
    updateFields.nfeioProtocol = nfeData.protocol ?? nfeData.authorizationProtocol ?? '';
  }

  const updated = await found.model.findByIdAndUpdate(req.params.id, updateFields, { new: true });
  res.json(updated);
});
```

**Step 6: Verificar compilação**

```bash
npx tsx server/routes/invoices.ts
```
Esperado: sem output.

**Step 7: Commit**

```bash
git add server/routes/invoices.ts
git commit -m "feat(server): add nfe.io emit and status-polling routes"
```

---

## Task 3: Adicionar updateInvoice ao AppContext da fábrica

O app principal já tem `updateInvoice`. A fábrica não tem. Precisamos adicioná-la.

**Files:**
- Modify: `factory/src/contexts/AppContext.tsx`

**Step 1: Adicionar updateInvoice à interface AppContextData**

Localizar `addInvoice: (invoice: Invoice) => Promise<void>;` e adicionar após:

```typescript
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
```

**Step 2: Implementar updateInvoice (após deleteInvoice)**

```typescript
const updateInvoiceLocal = useCallback((id: string, data: Partial<Invoice>) => {
  setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)));
}, []);
```

**Step 3: Adicionar ao Provider value**

Localizar a linha do `<AppContext.Provider value={{` e adicionar `updateInvoice: updateInvoiceLocal` junto aos outros valores.

**Step 4: Commit**

```bash
git add factory/src/contexts/AppContext.tsx
git commit -m "feat(factory): add updateInvoice to AppContext"
```

---

## Task 4: Atualizar NotasFiscais.tsx do app principal

**Files:**
- Modify: `src/frontend/pages/NotasFiscais/NotasFiscais.tsx`
- Modify: `src/frontend/pages/NotasFiscais/NotasFiscais.module.scss`

**Step 1: Atualizar imports e adicionar tipos**

No topo do arquivo, garantir que `updateInvoice` está no destructuring do `useApp()`:

```typescript
const { events, invoices, addInvoice, updateInvoice, deleteInvoice } = useApp();
```

Adicionar estado de emissão:
```typescript
const [emittingId, setEmittingId] = useState<string | null>(null);
const [confirmEmit, setConfirmEmit] = useState<Invoice | null>(null);
const [emitError, setEmitError] = useState<string>('');
```

**Step 2: Adicionar campos de estado ao formulário**

Adicionar estados para os novos campos (após `formStatus`):
```typescript
const [formType, setFormType] = useState<'nfse' | 'nfe'>('nfse');
const [formServiceCode, setFormServiceCode] = useState('');
const [formClientAddress, setFormClientAddress] = useState('');
const [formClientNumber, setFormClientNumber] = useState('');
const [formClientDistrict, setFormClientDistrict] = useState('');
const [formClientCity, setFormClientCity] = useState('');
const [formClientState, setFormClientState] = useState('');
const [formClientPostalCode, setFormClientPostalCode] = useState('');
```

**Step 3: Atualizar resetForm para incluir novos campos**

```typescript
const resetForm = () => {
  // ... campos existentes ...
  setFormType('nfse');
  setFormServiceCode('');
  setFormClientAddress('');
  setFormClientNumber('');
  setFormClientDistrict('');
  setFormClientCity('');
  setFormClientState('');
  setFormClientPostalCode('');
};
```

**Step 4: Atualizar handleSubmit**

No objeto `invoice` dentro de `handleSubmit`, adicionar:
```typescript
type: formType,
serviceCode: formServiceCode,
clientAddress: formClientAddress,
clientNumber: formClientNumber,
clientDistrict: formClientDistrict,
clientCity: formClientCity,
clientState: formClientState,
clientPostalCode: formClientPostalCode,
```

**Step 5: Adicionar função handleEmit com polling**

```typescript
const handleEmit = async (invoice: Invoice) => {
  setConfirmEmit(null);
  setEmittingId(invoice.id);
  setEmitError('');
  try {
    const res = await fetch(`/api/invoices/${invoice.id}/emit`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-System': 'main' },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Erro ao emitir');
    }
    const updated: Invoice = await res.json();
    updateInvoice(invoice.id, updated);
    pollStatus(invoice.id);
  } catch (e: any) {
    setEmitError(e.message);
    setEmittingId(null);
  }
};

const pollStatus = (id: string) => {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`/api/invoices/${id}/nfeio-status`, {
        credentials: 'include',
        headers: { 'X-System': 'main' },
      });
      if (!res.ok) return;
      const updated: Invoice = await res.json();
      updateInvoice(id, updated);
      if (updated.nfeioStatus === 'issued' || updated.nfeioStatus === 'error') {
        clearInterval(interval);
        setEmittingId(null);
      }
    } catch { /* ignora */ }
  }, 3000);
};
```

**Step 6: Atualizar formulário JSX — novos campos**

Dentro do `<form>`, após o campo de Email do Cliente, adicionar:

```tsx
{/* Tipo de documento */}
<div className={styles.formRow}>
  <div className={styles.formField}>
    <label className={styles.formLabel}>Tipo de Documento</label>
    <select className={styles.formSelect} value={formType} onChange={(e) => setFormType(e.target.value as 'nfse' | 'nfe')}>
      <option value="nfse">NFS-e (Serviço)</option>
      <option value="nfe">NF-e (Produto)</option>
    </select>
  </div>
  {formType === 'nfse' && (
    <div className={styles.formField}>
      <label className={styles.formLabel}>Código de Serviço</label>
      <input type="text" className={styles.formInput} value={formServiceCode}
        onChange={(e) => setFormServiceCode(e.target.value)} placeholder="ex: 0107" />
    </div>
  )}
</div>

{/* Endereço do cliente */}
<p className={styles.sectionTitle}>Endereço do Cliente</p>
<div className={styles.formRow}>
  <div className={styles.formField} style={{ flex: 3 }}>
    <label className={styles.formLabel}>Rua</label>
    <input type="text" className={styles.formInput} value={formClientAddress}
      onChange={(e) => setFormClientAddress(e.target.value)} />
  </div>
  <div className={styles.formField} style={{ flex: 1 }}>
    <label className={styles.formLabel}>Número</label>
    <input type="text" className={styles.formInput} value={formClientNumber}
      onChange={(e) => setFormClientNumber(e.target.value)} />
  </div>
</div>
<div className={styles.formRow}>
  <div className={styles.formField}>
    <label className={styles.formLabel}>Bairro</label>
    <input type="text" className={styles.formInput} value={formClientDistrict}
      onChange={(e) => setFormClientDistrict(e.target.value)} />
  </div>
  <div className={styles.formField}>
    <label className={styles.formLabel}>CEP</label>
    <input type="text" className={styles.formInput} value={formClientPostalCode}
      onChange={(e) => setFormClientPostalCode(e.target.value)} placeholder="00000-000" />
  </div>
</div>
<div className={styles.formRow}>
  <div className={styles.formField}>
    <label className={styles.formLabel}>Cidade</label>
    <input type="text" className={styles.formInput} value={formClientCity}
      onChange={(e) => setFormClientCity(e.target.value)} />
  </div>
  <div className={styles.formField}>
    <label className={styles.formLabel}>Estado (UF)</label>
    <input type="text" className={styles.formInput} value={formClientState}
      onChange={(e) => setFormClientState(e.target.value)} maxLength={2} placeholder="SP" />
  </div>
</div>
```

Para itens NF-e, dentro do loop de `formItems.map`, adicionar campos condicionais:
```tsx
{formType === 'nfe' && (
  <>
    <div className={styles.formField}>
      <label className={styles.formLabel}>NCM</label>
      <input type="text" className={styles.formInput} value={item.ncm ?? ''}
        onChange={(e) => updateItem(index, 'ncm', e.target.value)} placeholder="00000000" />
    </div>
    <div className={styles.formField}>
      <label className={styles.formLabel}>CFOP</label>
      <input type="text" className={styles.formInput} value={item.cfop ?? ''}
        onChange={(e) => updateItem(index, 'cfop', e.target.value)} placeholder="5102" />
    </div>
    <div className={styles.formField}>
      <label className={styles.formLabel}>Unid.</label>
      <input type="text" className={styles.formInput} value={item.unit ?? 'UN'}
        onChange={(e) => updateItem(index, 'unit', e.target.value)} placeholder="UN" />
    </div>
  </>
)}
```

**Step 7: Atualizar cards JSX — botão de emissão e estados nfe.io**

Dentro do `<div className={styles.cardFooter}>`, substituir a linha dos action buttons por:

```tsx
<div className={styles.cardActions}>
  {/* Emitir / Status nfe.io */}
  {!invoice.nfeioId && invoice.status === 'rascunho' && (
    <button className={styles.emitBtn} onClick={() => setConfirmEmit(invoice)}
      disabled={emittingId === invoice.id} title="Emitir via nfe.io">
      Emitir NF
    </button>
  )}
  {emittingId === invoice.id && (
    <span className={styles.nfeioProcessing}>Processando…</span>
  )}
  {invoice.nfeioStatus === 'issued' && (
    <>
      <span className={styles.nfeioNumber}>NF {invoice.nfeioNumber}</span>
      {invoice.nfeioPdfUrl && (
        <a href={invoice.nfeioPdfUrl} target="_blank" rel="noreferrer" className={styles.nfeioLink}>PDF</a>
      )}
      {invoice.nfeioXmlUrl && (
        <a href={invoice.nfeioXmlUrl} target="_blank" rel="noreferrer" className={styles.nfeioLink}>XML</a>
      )}
    </>
  )}
  {invoice.nfeioStatus === 'error' && emittingId !== invoice.id && (
    <button className={styles.emitBtnRetry} onClick={() => setConfirmEmit(invoice)}>
      Tentar novamente
    </button>
  )}
  <button className={styles.actionBtn} onClick={() => setPreviewInvoice(invoice)} title="Visualizar">[=]</button>
  <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
    onClick={() => deleteInvoice(invoice.id)} title="Excluir">X</button>
</div>
```

**Step 8: Adicionar modal de confirmação de emissão**

Antes do fechamento do `return`, adicionar:

```tsx
{/* Modal confirmação de emissão */}
{confirmEmit && (
  <Modal title="Emitir Nota Fiscal via nfe.io" onClose={() => setConfirmEmit(null)}>
    <div className={styles.confirmBody}>
      <p>Tipo: <strong>{confirmEmit.type === 'nfe' ? 'NF-e (Produto)' : 'NFS-e (Serviço)'}</strong></p>
      <p>Cliente: <strong>{confirmEmit.clientName}</strong></p>
      <p>Valor: <strong>R$ {confirmEmit.totalValue.toLocaleString('pt-BR')}</strong></p>
      {emitError && <p className={styles.emitError}>{emitError}</p>}
    </div>
    <div className={styles.formActions}>
      <Button variant="secondary" onClick={() => setConfirmEmit(null)}>Cancelar</Button>
      <Button onClick={() => handleEmit(confirmEmit)}>Confirmar Emissão</Button>
    </div>
  </Modal>
)}
```

**Step 9: Adicionar classes CSS em NotasFiscais.module.scss**

```scss
.sectionTitle {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 1rem 0 0.5rem;
}

.emitBtn {
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  border-radius: 6px;
  border: 1px solid #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  cursor: pointer;
  font-weight: 600;
  &:hover { background: rgba(245, 158, 11, 0.2); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.emitBtnRetry {
  @extend .emitBtn;
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  &:hover { background: rgba(239, 68, 68, 0.2); }
}

.nfeioProcessing {
  font-size: 0.75rem;
  color: #f59e0b;
  font-style: italic;
}

.nfeioNumber {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.nfeioLink {
  padding: 0.2rem 0.4rem;
  font-size: 0.7rem;
  border-radius: 4px;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  text-decoration: none;
  font-weight: 600;
  &:hover { background: rgba(34, 197, 94, 0.2); }
}

.confirmBody {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 0;
  p { margin: 0; color: var(--text-secondary); }
}

.emitError {
  color: #ef4444;
  font-size: 0.85rem;
}
```

**Step 10: Verificar compilação do app principal**

```bash
cd Soul540
npx tsx src/frontend/pages/NotasFiscais/NotasFiscais.tsx 2>&1 | head -20
```
Ou checar via TypeScript:
```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep NotasFiscais
```

**Step 11: Commit**

```bash
git add src/frontend/pages/NotasFiscais/
git commit -m "feat(main): nfe.io emit flow in NotasFiscais — form, cards, polling"
```

---

## Task 5: Espelhar mudanças na fábrica (factory app)

**Files:**
- Modify: `factory/src/pages/NotasFiscais/NotasFiscais.tsx`
- Modify: `factory/src/pages/NotasFiscais/NotasFiscais.module.scss`

**Step 1: Aplicar as mesmas mudanças do Task 4**

A página da fábrica tem estrutura idêntica à do app principal. Aplicar todas as mudanças dos Steps 1–9 do Task 4, com as seguintes diferenças:

- O `useApp()` vem de `@/contexts/AppContext` (não de `@frontend/contexts/AppContext`)
- O header nas chamadas `fetch` usa `'X-System': 'factory'` em vez de `'main'`
- Não usar `credentials: 'include'` pois a fábrica usa cookie automaticamente via `apiFetch`

Substituir as chamadas `fetch` diretas por `apiFetch` do `@/lib/api` para consistência:

```typescript
import { apiFetch } from '@/lib/api';

// Em handleEmit:
const res = await apiFetch(`/api/invoices/${invoice.id}/emit`, { method: 'POST' });

// Em pollStatus:
const res = await apiFetch(`/api/invoices/${id}/nfeio-status`);
```

**Step 2: Verificar compilação da fábrica**

```bash
cd Soul540/factory
npx tsc --noEmit 2>&1 | head -30
```
Esperado: sem erros.

**Step 3: Commit**

```bash
git add factory/src/pages/NotasFiscais/
git commit -m "feat(factory): nfe.io emit flow in NotasFiscais — mirror main app"
```

---

## Task 6: Configurar variáveis de ambiente

**Files:**
- Modify: `.env.example` (ou criar se não existir)
- Modify: `.env` (local, não comitar)

**Step 1: Adicionar ao .env.example**

```bash
# nfe.io — Emissão de NFS-e e NF-e
NFEIO_API_KEY=sua_api_key_aqui
NFEIO_COMPANY_ID=id_da_empresa_na_nfeio
```

**Step 2: Adicionar ao .env local com as chaves reais**

```
NFEIO_API_KEY=<sua chave>
NFEIO_COMPANY_ID=<seu company id>
```

**Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: add NFEIO_API_KEY and NFEIO_COMPANY_ID to .env.example"
```

---

## Task 7: Build Docker final e verificação

**Step 1: Build completo**

```bash
cd Soul540
docker compose build --no-cache 2>&1 | tail -20
```
Esperado: `naming to docker.io/library/soul540-web done` sem erros.

**Step 2: Subir containers**

```bash
docker compose up -d
```

**Step 3: Teste manual — criar nota e emitir**

1. Abrir `http://localhost/` → Notas Fiscais → Nova Nota Fiscal
2. Preencher todos os campos incluindo endereço, tipo NFS-e, código de serviço
3. Salvar → card aparece com botão "Emitir NF"
4. Clicar "Emitir NF" → modal de confirmação → confirmar
5. Verificar que card entra em "Processando…"
6. Aguardar polling → status atualiza para "Emitida" com número e links PDF/XML

**Step 4: Commit final (se houver ajustes pós-teste)**

```bash
git add -A
git commit -m "fix: adjustments after nfe.io integration smoke test"
git push
```
