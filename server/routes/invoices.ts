import { Schema } from 'mongoose';
import { Router } from 'express';
import { createTenantModels } from '../utils/tenantModel';
import { logAudit } from '../utils/audit';

const InvoiceItemSchema = new Schema({
  description: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  ncm: { type: String, default: '' },
  cfop: { type: String, default: '' },
  unit: { type: String, default: 'UN' },
}, { _id: false });

function nfeioHeaders() {
  return {
    'Authorization': process.env.NFEIO_API_KEY ?? '',
    'Content-Type': 'application/json',
  };
}

// Lookup IBGE city code by name (SP state — expand as needed)
const IBGE_CITIES: Record<string, number> = {
  'sorocaba': 3552205,
  'sao paulo': 3550308,
  'campinas': 3509502,
  'santos': 3548100,
  'ribeirao preto': 3543402,
  'sao bernardo do campo': 3548708,
  'santo andre': 3547809,
  'osasco': 3534401,
  'guarulhos': 3518800,
  'indaiatuba': 3520509,
  'jundiai': 3525904,
  'piracicaba': 3538709,
  'limeira': 3526902,
  'bauru': 3506003,
  'marilia': 3529005,
  'presidente prudente': 3541406,
  'sao jose dos campos': 3549904,
  'sao jose do rio preto': 3549805,
};

function ibgeCity(cityName: string): { code?: number; name: string } {
  const key = cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const code = IBGE_CITIES[key];
  return code ? { code, name: cityName } : { name: cityName };
}

function nfeioBase() {
  return `https://api.nfe.io/v1/companies/${process.env.NFEIO_COMPANY_ID_NFSE}`;
}

function nfeioBaseNfe() {
  return `https://api.nfse.io/v2/companies/${process.env.NFEIO_COMPANY_ID_NFE}`;
}

const models = createTenantModels('Invoice', {
  eventId: { type: String, default: '' },
  clientName: { type: String, default: '' },
  clientDocument: { type: String, default: '' },
  clientEmail: { type: String, default: '' },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  issueDate: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, default: 'rascunho' },
  createdAt: { type: String, default: () => new Date().toISOString() },
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
}, { main: 'invoices', franchise: 'franchiseinvoices', factory: 'factoryinvoices' });

const router = Router();

router.get('/', async (req, res) => res.json(await models.getModel(req).find({})));

router.post('/', async (req, res) => {
  const invoice = await models.getModel(req).create({ ...req.body, source: models.getSource(req) });
  await logAudit({ req, action: 'create', resource: 'invoices', resourceId: invoice.id, description: `Criou nota fiscal: ${invoice.clientName} (R$ ${invoice.totalValue})` });
  res.status(201).json(invoice);
});

router.put('/:id', async (req, res) => {
  const found = await models.findInAll(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const invoice = await found.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await logAudit({ req, action: 'update', resource: 'invoices', resourceId: req.params.id, description: `Atualizou nota fiscal: ${invoice?.clientName}` });
  res.json(invoice);
});

router.delete('/:id', async (req, res) => {
  const found = await models.findInAll(req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const clientName = found.doc?.clientName || req.params.id;
  await found.model.findByIdAndDelete(req.params.id);
  await logAudit({ req, action: 'delete', resource: 'invoices', resourceId: req.params.id, description: `Excluiu nota fiscal: ${clientName}` });
  res.status(204).end();
});

router.post('/:id/emit', async (req, res) => {
  const model = models.getModel(req);
  console.log(`[emit] id=${req.params.id} collection=${(model as any).collection?.name} xsystem=${req.headers['x-system']}`);
  const inv = await model.findById(req.params.id) as any;
  console.log(`[emit] found=${!!inv}`);
  if (!inv) return res.status(404).json({ error: 'Not found' });
  const found = { doc: inv, model };

  const companyId = inv.type === 'nfe' ? process.env.NFEIO_COMPANY_ID_NFE : process.env.NFEIO_COMPANY_ID_NFSE;
  if (!process.env.NFEIO_API_KEY || !companyId) {
    return res.status(503).json({ error: `NFEIO_API_KEY e NFEIO_COMPANY_ID_${(inv.type ?? 'nfse').toUpperCase()} não configurados no servidor.` });
  }

  // Validações antes de enviar à nfe.io
  if (inv.type === 'nfe') {
    const items = inv.items ?? [];
    if (items.length === 0) {
      return res.status(400).json({ error: 'NF-e requer pelo menos um item com descrição, NCM e CFOP.' });
    }
    const missingNcmCfop = items.find((i: any) => !i.ncm || !i.cfop);
    if (missingNcmCfop) {
      return res.status(400).json({ error: `Item "${missingNcmCfop.description || 'sem descrição'}" está sem NCM ou CFOP. Preencha antes de emitir.` });
    }
  }
  if (!inv.clientDocument?.replace(/\D/g, '')) {
    return res.status(400).json({ error: 'CPF/CNPJ do cliente é obrigatório para emissão.' });
  }

  let endpoint: string;
  let payload: Record<string, unknown>;

  const borrowerDoc = (inv.clientDocument ?? '').replace(/\D/g, '');

  if (inv.type === 'nfe') {
    endpoint = `${nfeioBaseNfe()}/productinvoices`;
    payload = {
      nature: 'Sale',
      buyer: {
        name: inv.clientName,
        email: inv.clientEmail || undefined,
        federalTaxNumber: borrowerDoc ? Number(borrowerDoc) : undefined,
        address: {
          country: 'BRA',
          postalCode: (inv.clientPostalCode ?? '').replace(/\D/g, ''),
          street: inv.clientAddress,
          number: inv.clientNumber,
          district: inv.clientDistrict,
          city: ibgeCity(inv.clientCity ?? ''),
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
          postalCode: (inv.clientPostalCode ?? '').replace(/\D/g, ''),
          street: inv.clientAddress,
          number: inv.clientNumber,
          district: inv.clientDistrict,
          city: ibgeCity(inv.clientCity ?? ''),
          state: inv.clientState,
        },
      },
    };
  }

  let nfeRes: Response;
  let nfeData: any;
  try {
    nfeRes = await fetch(endpoint, {
      method: 'POST',
      headers: nfeioHeaders(),
      body: JSON.stringify(payload),
    });
    const rawText = await nfeRes.text();
    try {
      nfeData = JSON.parse(rawText);
    } catch {
      nfeData = { message: rawText || `HTTP ${nfeRes.status}` };
    }
  } catch (err) {
    return res.status(502).json({ error: 'Falha de comunicação com nfe.io', detail: String(err) });
  }

  console.log(`[emit] nfeio status=${nfeRes.status} endpoint=${endpoint}`);
  if (!nfeRes.ok) {
    console.log(`[emit] nfeio error:`, JSON.stringify(nfeData));
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

router.get('/:id/nfeio-status', async (req, res) => {
  const model = models.getModel(req);
  const inv = await model.findById(req.params.id) as any;
  if (!inv) return res.status(404).json({ error: 'Not found' });
  const found = { doc: inv, model };

  if (!inv.nfeioId) return res.status(400).json({ error: 'Nota ainda não emitida via nfe.io.' });

  const isNfe = inv.type === 'nfe';
  const endpoint = isNfe
    ? `${nfeioBaseNfe()}/productinvoices/${inv.nfeioId}`
    : `${nfeioBase()}/serviceinvoices/${inv.nfeioId}`;

  let nfeRes: Response;
  let nfeData: any;
  try {
    nfeRes = await fetch(endpoint, { headers: nfeioHeaders() });
    const rawText = await nfeRes.text();
    try {
      nfeData = JSON.parse(rawText);
    } catch {
      nfeData = { message: rawText || `HTTP ${nfeRes.status}` };
    }
  } catch (err) {
    return res.status(502).json({ error: 'Falha de comunicação com nfe.io', detail: String(err) });
  }
  if (!nfeRes.ok) return res.status(nfeRes.status).json({ error: nfeData?.message ?? 'Erro ao consultar nfe.io', nfeioRaw: nfeData });

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

export default router;
