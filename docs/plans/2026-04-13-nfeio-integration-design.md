# Design: Integração nfe.io — Emissão de NFS-e e NF-e

**Data:** 2026-04-13  
**Escopo:** `src/frontend/` (app principal) + `factory/src/` (app fábrica)  
**Abordagem escolhida:** Proxy no servidor + polling de status

---

## Contexto

A página de Notas Fiscais (`NotasFiscais.tsx`) atualmente é um sistema interno de registro — cria, lista e visualiza notas localmente, sem emissão real junto à prefeitura/SEFAZ. Esta integração adiciona emissão eletrônica via nfe.io, suportando NFS-e (serviços) e NF-e (produtos).

- Mesma empresa prestadora (mesmo CNPJ) para app principal e fábrica
- Sem cancelamento eletrônico no escopo
- API key guardada no servidor, nunca exposta ao browser

---

## 1. Modelo de Dados

### Novos campos na Invoice (MongoDB + shared/types.ts)

**Tipo e configuração fiscal:**
```
type: 'nfse' | 'nfe'          // padrão: 'nfse'
serviceCode: string            // código de serviço municipal (NFS-e)
```

**Endereço do tomador/destinatário** (exigido pela nfe.io):
```
clientAddress: string
clientNumber: string
clientDistrict: string
clientCity: string
clientState: string
clientPostalCode: string
```

**Por item (NF-e apenas):**
```
ncm: string      // código NCM
cfop: string     // ex: '5102'
unit: string     // ex: 'UN', 'KG'
```
Esses campos ficam no `InvoiceItem`.

**Resposta nfe.io (preenchida após emissão):**
```
nfeioId: string              // ID do documento na nfe.io
nfeioStatus: string          // 'processing' | 'issued' | 'error'
nfeioNumber: string          // número da nota emitida
nfeioPdfUrl: string
nfeioXmlUrl: string
nfeioAccessKey: string       // chave de acesso 44 dígitos
nfeioProtocol: string
nfeioRawResponse: object     // resposta completa JSON
```

---

## 2. Backend

### Variáveis de ambiente
```
NFEIO_API_KEY=<chave_da_api>
NFEIO_COMPANY_ID=<id_da_empresa_na_nfeio>
```

### Novas rotas em `server/routes/invoices.ts`

#### `POST /api/invoices/:id/emit`
1. Busca invoice no MongoDB (multi-tenant via `findInAll`)
2. Valida campos obrigatórios conforme tipo (`serviceCode` para NFS-e, `ncm`/`cfop` para NF-e)
3. Monta payload nfe.io:
   - **NFS-e** → `POST https://api.nfe.io/v1/companies/{companyId}/serviceinvoices`
   - **NF-e** → `POST https://api.nfe.io/v1/companies/{companyId}/nfe`
4. Chama nfe.io com header `Authorization: {NFEIO_API_KEY}`
5. Salva `nfeioId`, `nfeioStatus`, `nfeioRawResponse` na invoice
6. Registra audit log
7. Retorna invoice atualizada

#### `GET /api/invoices/:id/nfeio-status`
1. Busca invoice, lê `nfeioId` e `type`
2. Chama nfe.io: `GET /v1/companies/{companyId}/serviceinvoices/{nfeioId}` ou equivalente NF-e
3. Se status mudou, atualiza MongoDB: `nfeioStatus`, `nfeioNumber`, `nfeioPdfUrl`, `nfeioXmlUrl`, `nfeioAccessKey`, `nfeioProtocol`, `nfeioRawResponse`
4. Se `nfeioStatus === 'issued'` atualiza `status = 'emitida'` na invoice
5. Retorna invoice atualizada

### Payloads nfe.io

**NFS-e:**
```json
{
  "cityServiceCode": "<serviceCode>",
  "description": "<itens concatenados>",
  "servicesAmount": <totalValue>,
  "borrower": {
    "name": "<clientName>",
    "email": "<clientEmail>",
    "federalTaxNumber": <clientDocument sem formatação>,
    "address": {
      "country": "BRA",
      "postalCode": "<clientPostalCode>",
      "street": "<clientAddress>",
      "number": "<clientNumber>",
      "district": "<clientDistrict>",
      "city": { "name": "<clientCity>" },
      "state": "<clientState>"
    }
  }
}
```

**NF-e:**
```json
{
  "nature": "Sale",
  "buyer": { ... mesmos campos de endereço ... },
  "items": [
    {
      "code": "<index>",
      "description": "<item.description>",
      "quantity": <item.quantity>,
      "unitOfMeasure": "<item.unit>",
      "unitPrice": <item.unitPrice>,
      "totalPrice": <item.quantity * item.unitPrice>,
      "ncm": "<item.ncm>",
      "cfop": "<item.cfop>"
    }
  ]
}
```

---

## 3. UI

### Formulário de criação — campos novos

- **Tipo:** seletor NFS-e / NF-e (padrão NFS-e)
- **Código de Serviço** (visível apenas se NFS-e)
- **Endereço do cliente:** rua, número, bairro, CEP, cidade, estado
- **Por item (visível apenas se NF-e):** NCM, CFOP, Unidade

### Cards — estados de emissão

| `nfeioStatus` | Visual |
|---|---|
| `undefined` (rascunho) | Botão **"Emitir via nfe.io"** |
| `processing` | Badge amarelo "Processando…" + spinner; polling a cada 3s |
| `issued` | Badge verde "Emitida", número da NF, botões **PDF** e **XML** |
| `error` | Badge vermelho "Erro nfe.io", mensagem de erro, botão **"Tentar novamente"** |

### Fluxo de emissão

1. Clique em **"Emitir via nfe.io"**
2. Modal de confirmação: tipo, cliente, valor total
3. Confirma → `POST /api/invoices/:id/emit`
4. Card entra em "Processando…"
5. Frontend faz polling `GET /api/invoices/:id/nfeio-status` a cada 3s
6. Para quando `nfeioStatus` é `issued` ou `error`
7. Card atualiza automaticamente sem reload

### Arquivos modificados

**Backend:**
- `server/routes/invoices.ts` — novas rotas `emit` e `nfeio-status`
- `.env` / `.env.example` — `NFEIO_API_KEY`, `NFEIO_COMPANY_ID`

**Shared:**
- `shared/types.ts` — campos novos em `Invoice` e `InvoiceItem`

**Frontend (principal + fábrica):**
- `src/frontend/pages/NotasFiscais/NotasFiscais.tsx`
- `factory/src/pages/NotasFiscais/NotasFiscais.tsx`
- Módulos SCSS correspondentes

---

## Fora do escopo

- Cancelamento eletrônico
- App franquia
- Webhook assíncrono da nfe.io
- Consulta de NF por chave de acesso externa
