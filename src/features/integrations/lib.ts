import type { ConnectionStatus, IntegrationProvider } from '@/types/api';

export const PROVIDER_LABEL: Record<IntegrationProvider, string> = {
  google_calendar: 'Google Calendar',
  whatsapp_twilio: 'WhatsApp (Twilio)',
  whatsapp_meta: 'WhatsApp (Meta)',
  google_reviews: 'Google Reviews',
};

/** Orden de aparición en el selector de proveedor. */
export const PROVIDER_OPTIONS: IntegrationProvider[] = [
  'google_calendar',
  'whatsapp_twilio',
  'whatsapp_meta',
  'google_reviews',
];

export const CONNECTION_STATUS_LABEL: Record<ConnectionStatus, string> = {
  inactive: 'Inactiva',
  active: 'Activa',
  error: 'Con error',
};

export const CONNECTION_STATUS_STYLE: Record<ConnectionStatus, string> = {
  inactive: 'bg-muted text-muted-foreground',
  active: 'bg-primary text-primary-foreground',
  error: 'bg-destructive/10 text-destructive',
};

/** Serializa el textarea de config JSON; lanza si no es válido. */
export function parseConfig(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('La config debe ser un objeto JSON.');
  }
  return parsed as Record<string, unknown>;
}
