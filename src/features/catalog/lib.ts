import { z } from 'zod';
import type { Service } from '@/types/api';
import type { ServicePayload } from './api';

/** "02:30:00" → 150; soporta "1 02:30:00" (con días) por si acaso. */
export function durationToMinutes(duration: string): number {
  const [dayPart, timePart] = duration.includes(' ') ? duration.split(' ') : ['0', duration];
  const [h = '0', m = '0'] = timePart.split(':');
  return Number(dayPart) * 24 * 60 + Number(h) * 60 + Number(m);
}

/** 150 → "02:30:00" (formato que acepta DurationField de Django). */
export function minutesToDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

export const serviceSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido.'),
    description: z.string(),
    duration_minutes: z
      .string()
      .regex(/^\d+$/, 'Minutos inválidos.')
      .refine((v) => Number(v) > 0, 'La duración debe ser mayor a 0.'),
    base_price: z
      .string()
      .refine((v) => v === '' || /^\d+(\.\d{1,2})?$/.test(v), 'Precio inválido.'),
    requires_deposit: z.boolean(),
    default_deposit_amount: z
      .string()
      .refine((v) => v === '' || /^\d+(\.\d{1,2})?$/.test(v), 'Monto inválido.'),
    color: z.string(),
    default_artist: z.string(),
  })
  // Espejo del CheckConstraint service_deposit_set_when_required del backend
  .refine((v) => !v.requires_deposit || v.default_deposit_amount !== '', {
    message: 'Si requiere depósito, indica el monto sugerido.',
    path: ['default_deposit_amount'],
  });

export type ServiceValues = z.infer<typeof serviceSchema>;

export function valuesToServicePayload(values: ServiceValues): ServicePayload {
  return {
    name: values.name,
    description: values.description || undefined,
    default_duration: minutesToDuration(Number(values.duration_minutes)),
    base_price: values.base_price || undefined,
    requires_deposit: values.requires_deposit,
    default_deposit_amount: values.requires_deposit ? values.default_deposit_amount : null,
    color: values.color || undefined,
    default_artist: values.default_artist || null,
  };
}

export function serviceToValues(service: Service): ServiceValues {
  return {
    name: service.name,
    description: service.description ?? '',
    duration_minutes: String(durationToMinutes(service.default_duration)),
    base_price: service.base_price ?? '',
    requires_deposit: service.requires_deposit,
    default_deposit_amount: service.default_deposit_amount ?? '',
    color: service.color || '#2563eb',
    default_artist: service.default_artist_id ?? '',
  };
}
