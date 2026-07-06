import { z } from 'zod';

/**
 * Validación de UX previa al submit — el backend sigue siendo la fuente de
 * verdad (regla del integration guide: no duplicar reglas de negocio, solo
 * evitar round-trips obvios).
 */
export const appointmentSchema = z
  .object({
    artist_id: z.string(), // '' = el user actual
    client_id: z.string(), // '' = sin vincular (queda solo el snapshot de nombre)
    reason_id: z.string(),
    service_id: z.string(),
    project_id: z.string(),
    client_name: z.string().min(1, 'El nombre del cliente es requerido.'),
    client_phone: z.string(),
    date: z.string().min(1, 'La fecha es requerida.'),
    start_time: z.string().min(1, 'La hora de inicio es requerida.'),
    end_time: z.string().min(1, 'La hora de fin es requerida.'),
    booth_id: z.string(),
    estimated_price: z.string().refine((v) => v === '' || /^\d+(\.\d{1,2})?$/.test(v), {
      message: 'Precio inválido — usa formato 350000 o 350000.00.',
    }),
    notes: z.string(),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: 'La hora de fin debe ser posterior a la de inicio.',
    path: ['end_time'],
  });

export type AppointmentValues = z.infer<typeof appointmentSchema>;

export const boothSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  description: z.string(),
});

export type BoothValues = z.infer<typeof boothSchema>;
