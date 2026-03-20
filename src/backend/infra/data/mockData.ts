import type { PizzaEvent } from '@backend/domain/entities/Event';
import type { FinanceEntry } from '@backend/domain/entities/Finance';
import type { Invoice } from '@backend/domain/entities/Invoice';
import type { Task } from '@backend/domain/entities/Task';

export interface Employee {
  id: string;
  name: string;
  role: 'pizzaiolo' | 'auxiliar' | 'garcom' | 'gerente' | 'entregador' | 'administrativo';
  phone: string;
  status: 'ativo' | 'ferias' | 'afastado' | 'desligado';
  createdAt: string;
  email?: string;
  city?: string;
  state?: string;
  hireDate?: string;
  salary?: number;
  cpf?: string;
  rg?: string;
  address?: string;
  notes?: string;
  pixKey?: string;
  availableDays?: string[];
}

export interface Contractor {
  id: string;
  name: string;
  type: 'pessoa_fisica' | 'pessoa_juridica';
  document: string;
  documentType?: 'CPF' | 'RG' | 'CNPJ';
  email: string;
  phone: string;
  city?: string;
  address?: string;
  maritalStatus?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel';
  profession?: string;
  category?: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  totalRevenue: number;
  createdAt: string;
}

export interface Contract {
  id: string;
  clientName: string;
  clientDocument?: string;
  clientEmail?: string;
  clientPhone?: string;
  eventId?: string;
  value: number;
  status: 'rascunho' | 'enviado' | 'assinado' | 'cancelado';
  startDate: string;
  endDate?: string;
  description: string;
  paymentConditions?: string;
  terms?: string;
  createdAt: string;
}

export interface Franchise {
  id: string;
  name: string;
  owner: string;
  city: string;
  state: string;
  monthlyFee: number;
  status: 'ativa' | 'em_implantacao' | 'suspensa' | 'encerrada';
  openDate: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  eventId?: string;
  headerText: string;
  footerText: string;
  categories: MenuCategory[];
  createdAt: string;
}

export interface Supply {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  expirationDate?: string;
  status: 'em_estoque' | 'estoque_baixo' | 'sem_estoque' | 'vencido';
  createdAt: string;
}

export interface Utensil {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitValue?: number;
  location: string;
  status: 'disponivel' | 'em_uso' | 'manutencao' | 'descartado';
  createdAt: string;
}

export const mockEvents: PizzaEvent[] = [
  {
    id: 'evt-1',
    name: 'Confraternizacao TechCorp',
    date: '2026-03-15',
    location: 'Salao Premium - Centro SP',
    guestCount: 120,
    status: 'confirmed',
    budget: 8500,
    menu: ['Pizza Margherita', 'Pizza Calabresa', 'Pizza 4 Queijos', 'Pizza Portuguesa'],
    notes: 'Cliente corporativo, precisa de nota fiscal. Evento das 19h as 23h.',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'evt-2',
    name: 'Casamento Silva & Costa',
    date: '2026-04-20',
    location: 'Chacara Bela Vista - Campinas',
    guestCount: 200,
    status: 'planning',
    budget: 15000,
    menu: ['Pizza Margherita', 'Pizza Frango com Catupiry', 'Pizza Calabresa', 'Pizza Doce'],
    notes: 'Casamento ao ar livre. Montar estacao de pizza ao vivo.',
    createdAt: '2026-01-25T14:00:00Z',
  },
  {
    id: 'evt-3',
    name: 'Aniversario 50 anos - Sr. Roberto',
    date: '2026-03-08',
    location: 'Residencia do cliente - Moema SP',
    guestCount: 80,
    status: 'in_progress',
    budget: 5500,
    menu: ['Pizza Margherita', 'Pizza Calabresa', 'Pizza Quatro Queijos'],
    notes: 'Festa surpresa. Chegar as 18h para montar antes dos convidados.',
    createdAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'evt-4',
    name: 'Festival Gastonomico Municipal',
    date: '2026-05-10',
    location: 'Parque Municipal - Guarulhos',
    guestCount: 500,
    status: 'planning',
    budget: 25000,
    menu: ['Pizza Margherita', 'Pizza Napolitana', 'Pizza Pepperoni', 'Pizza Vegana'],
    notes: 'Evento publico. Precisa de alvara e estrutura para 3 fornos.',
    createdAt: '2026-02-05T11:00:00Z',
  },
  {
    id: 'evt-5',
    name: 'Happy Hour StartupHub',
    date: '2026-02-28',
    location: 'StartupHub Coworking - Pinheiros',
    guestCount: 60,
    status: 'completed',
    budget: 4000,
    menu: ['Pizza Margherita', 'Pizza Calabresa'],
    notes: 'Evento mensal. Cliente recorrente.',
    createdAt: '2026-02-10T16:00:00Z',
  },
];

export const FIXED_CATEGORIES = ['salario', 'pro-labore', 'aluguel', 'emprestimos', 'contador', 'agua-luz', 'tarifa-bancos', 'investimento'] as const;
export const VARIABLE_CATEGORIES = ['insumos', 'impostos', 'embalagens', 'marketing', 'tarifa-cartao', 'carro-manut', 'combustivel', 'maquinas-manut', 'outros', 'pedagio', 'gas', 'premio', 'batatas', 'alimentacao', 'bebidas', 'prod-limpeza'] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  'salario': 'Salario', 'pro-labore': 'Pro Labore', 'aluguel': 'Aluguel', 'emprestimos': 'Emprestimos',
  'contador': 'Contador', 'agua-luz': 'Agua e Luz', 'tarifa-bancos': 'Tarifa Bancos', 'investimento': 'Investimento',
  'insumos': 'Insumos', 'impostos': 'Impostos', 'embalagens': 'Embalagens', 'marketing': 'Marketing',
  'tarifa-cartao': 'Tarifa Cartao', 'carro-manut': 'Carro Manut.', 'combustivel': 'Combustivel',
  'maquinas-manut': 'Maquinas Manut.', 'outros': 'Outros', 'pedagio': 'Pedagio', 'gas': 'Gas',
  'premio': 'Premio', 'batatas': 'Batatas', 'alimentacao': 'Alimentacao', 'bebidas': 'Bebidas',
  'prod-limpeza': 'Prod. Limpeza', 'contrato': 'Contrato', 'adicional': 'Adicional', 'equipe': 'Equipe',
  'ingredientes': 'Ingredientes', 'logistica': 'Logistica',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'insumos': '#ef4444', 'impostos': '#f97316', 'embalagens': '#eab308', 'marketing': '#84cc16',
  'tarifa-cartao': '#22c55e', 'carro-manut': '#06b6d4', 'combustivel': '#3b82f6', 'gas': '#8b5cf6',
  'maquinas-manut': '#d946ef', 'outros': '#64748b', 'pedagio': '#14b8a6', 'premio': '#f43f5e',
  'batatas': '#a3e635', 'alimentacao': '#fb923c', 'bebidas': '#38bdf8', 'prod-limpeza': '#a78bfa',
  'salario': '#dc2626', 'pro-labore': '#b91c1c', 'aluguel': '#0ea5e9', 'emprestimos': '#7c3aed',
  'contador': '#059669', 'agua-luz': '#0891b2', 'tarifa-bancos': '#6366f1', 'investimento': '#ca8a04',
};

function generateMonthlyData(): FinanceEntry[] {
  const entries: FinanceEntry[] = [];
  let id = 100;
  const months = [
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04',
  ];

  for (const month of months) {
    const baseRevenue = 30000 + Math.floor(Math.random() * 50000);
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'revenue', category: 'contrato', description: `Receita eventos ${month}`, amount: baseRevenue, date: `${month}-05`, status: 'received' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'revenue', category: 'adicional', description: `Receita feira ${month}`, amount: Math.floor(baseRevenue * 0.3), date: `${month}-15`, status: 'received' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'salario', description: `Salarios ${month}`, amount: 8500, date: `${month}-05`, status: 'paid' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'pro-labore', description: `Pro labore ${month}`, amount: 3500, date: `${month}-05`, status: 'paid' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'aluguel', description: `Aluguel ${month}`, amount: 2200, date: `${month}-01`, status: 'paid' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'emprestimos', description: `Emprestimo ${month}`, amount: 1800, date: `${month}-10`, status: 'paid' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'contador', description: `Contador ${month}`, amount: 450, date: `${month}-10`, status: 'paid' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'agua-luz', description: `Agua e Luz ${month}`, amount: 380 + Math.floor(Math.random() * 200), date: `${month}-15`, status: 'paid' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'insumos', description: `Insumos ${month}`, amount: 4000 + Math.floor(Math.random() * 6000), date: `${month}-08`, status: 'paid' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'embalagens', description: `Embalagens ${month}`, amount: 800 + Math.floor(Math.random() * 1500), date: `${month}-08`, status: 'paid' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'combustivel', description: `Combustivel ${month}`, amount: 600 + Math.floor(Math.random() * 800), date: `${month}-12`, status: 'paid' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'marketing', description: `Marketing ${month}`, amount: 500 + Math.floor(Math.random() * 1500), date: `${month}-10`, status: 'paid' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'impostos', description: `Impostos ${month}`, amount: Math.floor(baseRevenue * 0.06), date: `${month}-20`, status: 'paid' });
    entries.push({ id: `fin-${id++}`, eventId: 'evt-1', type: 'cost', category: 'gas', description: `Gas ${month}`, amount: 300 + Math.floor(Math.random() * 400), date: `${month}-15`, status: 'paid' });
  }
  return entries;
}

export const mockFinances: FinanceEntry[] = [
  ...generateMonthlyData(),
  { id: 'fin-1', eventId: 'evt-1', type: 'revenue', category: 'contrato', description: 'Contrato evento corporativo', amount: 8500, date: '2026-02-01', status: 'received' },
  { id: 'fin-5', eventId: 'evt-2', type: 'revenue', category: 'contrato', description: 'Sinal casamento 50%', amount: 7500, date: '2026-02-15', status: 'received' },
  { id: 'fin-9', eventId: 'evt-3', type: 'revenue', category: 'contrato', description: 'Pagamento aniversario', amount: 5500, date: '2026-02-20', status: 'received' },
  { id: 'fin-12', eventId: 'evt-5', type: 'revenue', category: 'contrato', description: 'Happy hour StartupHub', amount: 4000, date: '2026-02-20', status: 'received' },
  { id: 'fin-15', eventId: 'evt-4', type: 'revenue', category: 'contrato', description: 'Contrato festival gastronomico', amount: 25000, date: '2026-03-01', status: 'pending' },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'nf-1',
    eventId: 'evt-5',
    clientName: 'StartupHub Coworking',
    clientDocument: '11.222.333/0001-44',
    clientEmail: 'financeiro@startuphub.com',
    items: [
      { description: 'Servico de buffet de pizza - Happy Hour', quantity: 1, unitPrice: 4000 },
      { description: 'Taxa de deslocamento', quantity: 1, unitPrice: 200 },
      { description: 'Bebidas (agua e refrigerante)', quantity: 60, unitPrice: 5 },
    ],
    subtotal: 4500,
    taxRate: 5.0,
    taxAmount: 225,
    totalValue: 4500,
    issueDate: '2026-03-06',
    notes: 'Referente ao happy hour de marco/2026.',
    status: 'emitida',
    createdAt: '2026-03-06T10:00:00Z',
  },
  {
    id: 'nf-2',
    eventId: 'evt-1',
    clientName: 'TechCorp Ltda',
    clientDocument: '12.345.678/0001-90',
    clientEmail: 'rh@techcorp.com.br',
    items: [
      { description: 'Servico de buffet de pizza artesanal', quantity: 1, unitPrice: 7500 },
      { description: 'Montagem e desmontagem de estrutura', quantity: 1, unitPrice: 500 },
      { description: 'Bebidas diversas', quantity: 120, unitPrice: 4.17 },
    ],
    subtotal: 8500,
    taxRate: 5.0,
    taxAmount: 425,
    totalValue: 8500,
    issueDate: '2026-03-16',
    notes: 'Referente a confraternizacao corporativa.',
    status: 'rascunho',
    createdAt: '2026-03-10T14:00:00Z',
  },
];

export const mockTasks: Task[] = [
  { id: 'task-1', title: 'Confirmar cardapio com cliente', description: 'Enviar opcoes e confirmar', status: 'todo', priority: 'high', assignee: 'Ana', eventId: 'evt-1', createdAt: '2026-02-01T10:00:00Z' },
  { id: 'task-2', title: 'Reservar forno extra', description: 'Alugar forno adicional', status: 'in_progress', priority: 'urgent', assignee: 'Carlos', eventId: 'evt-2', createdAt: '2026-02-05T10:00:00Z' },
  { id: 'task-3', title: 'Comprar ingredientes', description: 'Lista de compras aprovada', status: 'todo', priority: 'high', assignee: 'Maria', eventId: 'evt-3', createdAt: '2026-02-10T10:00:00Z' },
  { id: 'task-4', title: 'Contratar garcom extra', description: 'Precisa de 2 garcons', status: 'backlog', priority: 'medium', assignee: 'Ana', eventId: 'evt-2', createdAt: '2026-02-12T10:00:00Z' },
  { id: 'task-5', title: 'Solicitar alvara temporario', description: 'Evento publico precisa de alvara', status: 'todo', priority: 'urgent', assignee: 'Carlos', eventId: 'evt-4', createdAt: '2026-02-15T10:00:00Z' },
  { id: 'task-6', title: 'Montar cronograma do festival', description: 'Definir horarios e rotacao', status: 'backlog', priority: 'medium', assignee: 'Ana', eventId: 'evt-4', createdAt: '2026-02-15T10:00:00Z' },
  { id: 'task-7', title: 'Emitir nota fiscal TechCorp', description: 'Emitir NF apos evento', status: 'todo', priority: 'high', assignee: 'Maria', eventId: 'evt-1', dueDate: '2026-03-20', createdAt: '2026-02-20T10:00:00Z' },
];

export const mockEmployees: Employee[] = [
  { id: 'emp-1', name: 'Carlos Mendes', role: 'pizzaiolo', email: 'carlos@soul540.com', phone: '(11) 99999-2222', city: 'Sao Paulo', state: 'SP', hireDate: '2023-03-15', salary: 3500, status: 'ativo', createdAt: '2023-03-15T10:00:00Z' },
  { id: 'emp-2', name: 'Ana Silva', role: 'gerente', email: 'ana@soul540.com', phone: '(11) 99999-1111', city: 'Sao Paulo', state: 'SP', hireDate: '2022-06-01', salary: 5000, status: 'ativo', createdAt: '2022-06-01T10:00:00Z' },
  { id: 'emp-3', name: 'Pedro Santos', role: 'auxiliar', email: 'pedro@soul540.com', phone: '(11) 99999-4444', city: 'Guarulhos', state: 'SP', hireDate: '2024-01-10', salary: 2000, status: 'ativo', createdAt: '2024-01-10T10:00:00Z' },
  { id: 'emp-4', name: 'Maria Oliveira', role: 'administrativo', email: 'maria@soul540.com', phone: '(11) 99999-3333', city: 'Sao Paulo', state: 'SP', hireDate: '2023-08-20', salary: 3000, status: 'ativo', createdAt: '2023-08-20T10:00:00Z' },
  { id: 'emp-5', name: 'Julia Costa', role: 'garcom', email: 'julia@soul540.com', phone: '(11) 99999-5555', city: 'Osasco', state: 'SP', hireDate: '2024-02-01', salary: 1800, status: 'ferias', createdAt: '2024-02-01T10:00:00Z' },
  { id: 'emp-6', name: 'Rafael Lima', role: 'entregador', email: 'rafael@soul540.com', phone: '(11) 99999-6666', city: 'Sao Paulo', state: 'SP', hireDate: '2023-11-15', salary: 1600, status: 'ativo', createdAt: '2023-11-15T10:00:00Z' },
];

export const mockContractors: Contractor[] = [
  { id: 'ctr-1', name: 'TechCorp Ltda', type: 'pessoa_juridica', document: '12.345.678/0001-90', email: 'rh@techcorp.com.br', phone: '(11) 3333-4444', status: 'ativo', totalRevenue: 28500, createdAt: '2025-06-01T10:00:00Z' },
  { id: 'ctr-2', name: 'StartupHub Coworking', type: 'pessoa_juridica', document: '11.222.333/0001-44', email: 'financeiro@startuphub.com', phone: '(11) 3222-1111', status: 'ativo', totalRevenue: 12000, createdAt: '2025-08-15T10:00:00Z' },
  { id: 'ctr-3', name: 'Roberto Almeida', type: 'pessoa_fisica', document: '123.456.789-00', email: 'roberto@email.com', phone: '(11) 98888-7777', status: 'ativo', totalRevenue: 5500, createdAt: '2025-12-01T10:00:00Z' },
  { id: 'ctr-4', name: 'Prefeitura de Guarulhos', type: 'pessoa_juridica', document: '45.678.901/0001-23', email: 'eventos@guarulhos.sp.gov.br', phone: '(11) 2400-1000', status: 'ativo', totalRevenue: 25000, createdAt: '2026-01-10T10:00:00Z' },
  { id: 'ctr-5', name: 'Diego Fernandez', type: 'pessoa_fisica', document: '987.654.321-00', email: 'diego@email.com', phone: '(11) 97777-8888', status: 'inativo', totalRevenue: 3200, createdAt: '2025-05-20T10:00:00Z' },
];

export const mockContracts: Contract[] = [
  { id: 'cont-1', clientName: 'TechCorp Ltda', clientDocument: '12.345.678/0001-90', clientEmail: 'rh@techcorp.com.br', clientPhone: '(11) 3333-4444', eventId: 'evt-1', value: 8500, status: 'assinado', startDate: '2026-01-15', endDate: '2026-03-15', description: 'Servico de buffet de pizza artesanal para confraternizacao corporativa com 120 convidados. Inclui montagem, desmontagem e bebidas.', paymentConditions: '50% adiantado, 50% no dia do evento', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'cont-2', clientName: 'Roberto Almeida', clientDocument: '123.456.789-00', clientEmail: 'roberto@email.com', clientPhone: '(11) 98888-7777', eventId: 'evt-3', value: 5500, status: 'assinado', startDate: '2026-02-01', endDate: '2026-03-08', description: 'Buffet de pizza artesanal para festa de aniversario com 80 convidados. Pizzas variadas, incluindo opcoes doces.', paymentConditions: 'Pagamento integral adiantado', createdAt: '2026-02-01T10:00:00Z' },
  { id: 'cont-3', clientName: 'Prefeitura de Guarulhos', clientDocument: '45.678.901/0001-23', clientEmail: 'eventos@guarulhos.sp.gov.br', clientPhone: '(11) 2400-1000', eventId: 'evt-4', value: 25000, status: 'enviado', startDate: '2026-03-01', endDate: '2026-05-10', description: 'Participacao no Festival Gastronomico Municipal com 3 fornos e equipe completa de pizzaiolos e auxiliares.', paymentConditions: '30% adiantado, 70% apos o evento mediante NF', terms: 'O CONTRATANTE fornecera o espaco, energia eletrica e agua para a realizacao do servico.', createdAt: '2026-03-01T10:00:00Z' },
  { id: 'cont-4', clientName: 'StartupHub Coworking', clientDocument: '11.222.333/0001-44', clientEmail: 'financeiro@startuphub.com', clientPhone: '(11) 3222-1111', value: 4000, status: 'assinado', startDate: '2026-02-10', endDate: '2026-02-28', description: 'Happy hour mensal com pizza para 60 pessoas. Servico recorrente mensal.', paymentConditions: 'Boleto mensal em ate 5 dias uteis apos o evento', createdAt: '2026-02-10T10:00:00Z' },
  { id: 'cont-5', clientName: 'Carlos e Ana Silva', clientDocument: '987.654.321-00', clientEmail: 'casamento@email.com', clientPhone: '(11) 97777-8888', eventId: 'evt-2', value: 15000, status: 'rascunho', startDate: '2026-03-01', description: 'Casamento com estacao de pizza ao vivo para 200 convidados. Inclui decoracao tematica e 4 sabores personalizados.', paymentConditions: '40% adiantado, 30% 15 dias antes, 30% no dia', terms: 'Degustacao de cardapio inclusa no contrato, a ser realizada em data a combinar.', createdAt: '2026-03-01T10:00:00Z' },
];

export const mockFranchises: Franchise[] = [
  { id: 'fra-1', name: 'Soul540 Campinas', owner: 'Fernando Rodrigues', city: 'Campinas', state: 'SP', monthlyFee: 3500, status: 'ativa', openDate: '2024-06-01', createdAt: '2024-04-01T10:00:00Z' },
  { id: 'fra-2', name: 'Soul540 Ribeirao Preto', owner: 'Patricia Nunes', city: 'Ribeirao Preto', state: 'SP', monthlyFee: 3000, status: 'ativa', openDate: '2024-09-15', createdAt: '2024-07-15T10:00:00Z' },
  { id: 'fra-3', name: 'Soul540 Santos', owner: 'Marco Aurélio Costa', city: 'Santos', state: 'SP', monthlyFee: 2800, status: 'em_implantacao', openDate: '2026-04-01', createdAt: '2026-01-01T10:00:00Z' },
  { id: 'fra-4', name: 'Soul540 Belo Horizonte', owner: 'Lucia Ferreira', city: 'Belo Horizonte', state: 'MG', monthlyFee: 3200, status: 'ativa', openDate: '2025-02-01', createdAt: '2024-12-01T10:00:00Z' },
];

export const mockMenus: Menu[] = [
  {
    id: 'men-1',
    name: 'Cardapio Eventos Corporativos',
    eventId: 'evt-1',
    headerText: 'Soul540 - Pizzas Artesanais',
    footerText: 'Todos os ingredientes sao frescos e selecionados.',
    categories: [
      {
        id: 'cat-1',
        name: 'Pizzas Classicas',
        items: [
          { id: 'item-1', name: 'Margherita', description: 'Molho de tomate, mussarela, manjericao', price: 45 },
          { id: 'item-2', name: 'Calabresa', description: 'Molho de tomate, mussarela, calabresa', price: 45 },
          { id: 'item-3', name: 'Quatro Queijos', description: 'Mussarela, gorgonzola, parmesao, provolone', price: 55 },
        ],
      },
      {
        id: 'cat-2',
        name: 'Pizzas Especiais',
        items: [
          { id: 'item-4', name: 'Portuguesa', description: 'Presunto, ovo, azeitona, cebola, pimentao', price: 52 },
          { id: 'item-5', name: 'Frango com Catupiry', description: 'Frango desfiado, catupiry original', price: 55 },
        ],
      },
    ],
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'men-2',
    name: 'Cardapio Casamentos',
    eventId: 'evt-2',
    headerText: 'Soul540 - Festa e Sabor',
    footerText: 'Personalize seu cardapio conosco!',
    categories: [
      {
        id: 'cat-3',
        name: 'Pizzas Doces',
        items: [
          { id: 'item-6', name: 'Nutella com Morango', description: 'Nutella, morango fresco', price: 60 },
          { id: 'item-7', name: 'Banana com Canela', description: 'Banana, canela, acucar', price: 48 },
        ],
      },
    ],
    createdAt: '2026-01-25T10:00:00Z',
  },
];

export const mockSupplies: Supply[] = [
  { id: 'sup-1', name: 'Farinha de Trigo', category: 'Massas', unit: 'kg', quantity: 150, minStock: 50, costPerUnit: 4.5, supplier: 'Moinho Sul', expirationDate: '2026-08-01', status: 'em_estoque', createdAt: '2026-01-01T10:00:00Z' },
  { id: 'sup-2', name: 'Mussarela', category: 'Queijos', unit: 'kg', quantity: 30, minStock: 20, costPerUnit: 28, supplier: 'Laticinios ABC', expirationDate: '2026-03-15', status: 'estoque_baixo', createdAt: '2026-01-01T10:00:00Z' },
  { id: 'sup-3', name: 'Molho de Tomate', category: 'Molhos', unit: 'L', quantity: 80, minStock: 30, costPerUnit: 6, supplier: 'Distribuidor X', status: 'em_estoque', createdAt: '2026-01-01T10:00:00Z' },
  { id: 'sup-4', name: 'Gas GLP', category: 'Combustivel', unit: 'kg', quantity: 5, minStock: 15, costPerUnit: 18, supplier: 'Distribuidora Gas', status: 'estoque_baixo', createdAt: '2026-01-01T10:00:00Z' },
  { id: 'sup-5', name: 'Calabresa', category: 'Carnes', unit: 'kg', quantity: 0, minStock: 10, costPerUnit: 22, supplier: 'Frigorifico Top', expirationDate: '2026-03-10', status: 'sem_estoque', createdAt: '2026-01-01T10:00:00Z' },
  { id: 'sup-6', name: 'Oregano', category: 'Temperos', unit: 'kg', quantity: 8, minStock: 3, costPerUnit: 35, supplier: 'Especiarias Sul', status: 'em_estoque', createdAt: '2026-01-01T10:00:00Z' },
];

export const mockUtensils: Utensil[] = [
  { id: 'ute-1', name: 'Forno a Lenha 120cm', category: 'Fornos', quantity: 2, location: 'Deposito Principal', status: 'disponivel', createdAt: '2022-01-01T10:00:00Z' },
  { id: 'ute-2', name: 'Paleta de Pizza', category: 'Utensilios', quantity: 8, location: 'Cozinha', status: 'disponivel', createdAt: '2022-01-01T10:00:00Z' },
  { id: 'ute-3', name: 'Bancada de Inox 2m', category: 'Mobiliario', quantity: 3, location: 'Cozinha', status: 'disponivel', createdAt: '2022-01-01T10:00:00Z' },
  { id: 'ute-4', name: 'Cortador de Pizza', category: 'Utensilios', quantity: 12, location: 'Cozinha', status: 'disponivel', createdAt: '2022-01-01T10:00:00Z' },
  { id: 'ute-5', name: 'Forno Eletrico', category: 'Fornos', quantity: 1, location: 'Evento TechCorp', status: 'em_uso', createdAt: '2022-01-01T10:00:00Z' },
  { id: 'ute-6', name: 'Carrinho de Transporte', category: 'Logistica', quantity: 2, location: 'Oficina', status: 'manutencao', createdAt: '2022-01-01T10:00:00Z' },
];
