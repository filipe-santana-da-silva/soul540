import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').trim(),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha mínimo 6 caracteres'),
  isAdmin: z.boolean().optional().default(false),
  unit: z.enum(['main', 'franchise', 'factory']).optional().default('main'),
  permissions: z.array(z.string()).optional().default([]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).trim().optional(),
  isAdmin: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  password: z.string().min(6, 'Senha mínimo 6 caracteres').optional(),
});
