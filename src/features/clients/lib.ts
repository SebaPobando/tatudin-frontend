import type { Client, ClientSource } from '@/types/api';
import type { ClientPayload } from './api';
import type { ClientValues } from './schemas';

/** Labels de display confirmados vía OPTIONS (los values son del backend). */
export const SOURCE_LABEL: Record<ClientSource, string> = {
  walk_in: 'Walk-in',
  instagram: 'Instagram',
  referral: 'Referido',
  website: 'Sitio web',
  form: 'Formulario público',
  google: 'Google',
  other: 'Otro',
};

export function valuesToClientPayload(values: ClientValues): ClientPayload {
  return {
    first_name: values.first_name,
    last_name: values.last_name || undefined,
    email: values.email || undefined,
    phone: values.phone || undefined,
    birthdate: values.birthdate || undefined,
    source: (values.source || undefined) as ClientPayload['source'],
    tags: values.tags
      ? values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined,
    notes: values.notes || undefined,
  };
}

export function clientToValues(client: Client): ClientValues {
  return {
    first_name: client.first_name,
    last_name: client.last_name ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    birthdate: client.birthdate ?? '',
    source: client.source ?? '',
    tags: (client.tags ?? []).join(', '),
    notes: client.notes ?? '',
  };
}
