import { z } from 'zod';

export const clientSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido.'),
  last_name: z.string(),
  email: z.union([z.literal(''), z.email('Email inválido.')]),
  phone: z.string(),
  birthdate: z.string(),
  source: z.string(),
  tags: z.string(), // "flash, cover up" → se separa por comas al enviar
  notes: z.string(),
});

export type ClientValues = z.infer<typeof clientSchema>;
