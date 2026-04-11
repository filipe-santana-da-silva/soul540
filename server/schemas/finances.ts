import { z } from 'zod';

export const createFinanceSchema = z.object({
  eventId: z.string().optional().default(''),
  type: z.enum(['revenue', 'cost']),
  category: z.string().min(1, 'Categoria obrigatória').trim(),
  description: z.string().min(1, 'Descrição obrigatória').trim(),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
  status: z.enum(['pending', 'paid', 'received']).optional().default('pending'),
  autoEventBudget: z.boolean().optional().default(false),
});

export const updateFinanceSchema = createFinanceSchema.partial();
