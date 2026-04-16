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

function nfeioBase() {
  return `https://api.nfe.io/v1/companies/${process.env.NFEIO_COMPANY_ID}`;
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

  if (!process.env.NFEIO_API_KEY || !process.env.NFEIO_COMPANY_ID) {
    return res.status(503).json({ error: 'NFEIO_API_KEY e NFEIO_COMPANY_ID não configurados no servidor.' });
  }

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

  let nfeRes: Response;
  let nfeData: any;
  try {
    nfeRes = await fetch(endpoint, {
      method: 'POST',
      headers: nfeioHeaders(),
      body: JSON.stringify(payload),
    });
    nfeData = await nfeRes.json();
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
    ? `${nfeioBase()}/nfe/${inv.nfeioId}`
    : `${nfeioBase()}/serviceinvoices/${inv.nfeioId}`;

  let nfeRes: Response;
  let nfeData: any;
  try {
    nfeRes = await fetch(endpoint, { headers: nfeioHeaders() });
    nfeData = await nfeRes.json();
  } catch (err) {
    return res.status(502).json({ error: 'Falha de comunicação com nfe.io', detail: String(err) });
  }
  if (!nfeRes.ok) return res.status(nfeRes.status).json({ error: 'Erro ao consultar nfe.io' });

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
