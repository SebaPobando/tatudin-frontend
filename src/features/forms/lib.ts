import type { FormFieldType, FormTemplateType, SubmissionStatus } from '@/types/api';

export const TEMPLATE_TYPE_LABEL: Record<FormTemplateType, string> = {
  consent: 'Consentimiento',
  quote: 'Cotización',
  booking: 'Reserva',
  onboarding: 'Onboarding',
  custom: 'Personalizado',
};

export const FIELD_TYPE_LABEL: Record<FormFieldType, string> = {
  text: 'Texto corto',
  textarea: 'Texto largo',
  email: 'Email',
  phone: 'Teléfono',
  number: 'Número',
  date: 'Fecha',
  datetime: 'Fecha y hora',
  select: 'Selección única',
  multiselect: 'Selección múltiple',
  checkbox: 'Sí/No',
  signature: 'Firma',
  file_url: 'Archivo (URL)',
};

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  converted: 'Convertido a cita',
  archived: 'Archivado',
};

/** Tipos que usan la lista `options`. */
export const TYPES_WITH_OPTIONS: FormFieldType[] = ['select', 'multiselect'];

/** Tipos que aceptan min/max length. */
export const TYPES_WITH_LENGTH: FormFieldType[] = ['text', 'textarea'];

/** "Consentimiento Piercing 2026" → "consentimiento-piercing-2026" (slug URL-safe). */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
