import { api } from '@/api/client';
import type { Client, ClientSource, Paginated } from '@/types/api';

export interface ClientPayload {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  birthdate?: string | null;
  source?: ClientSource;
  tags?: string[];
  notes?: string;
}

/** Búsqueda por nombre/email/teléfono (?search=) y filtro por fuente (?source=). */
export async function getClients(params: {
  search?: string;
  source?: string;
  page?: number;
}): Promise<Paginated<Client>> {
  const { data } = await api.get<Paginated<Client>>('/api/clients/', {
    params: {
      search: params.search || undefined,
      source: params.source || undefined,
      page: params.page ?? 1,
    },
  });
  return data;
}

export async function getClient(id: string): Promise<Client> {
  const { data } = await api.get<Client>(`/api/clients/${id}/`);
  return data;
}

export async function createClient(payload: ClientPayload): Promise<Client> {
  const { data } = await api.post<Client>('/api/clients/', payload);
  return data;
}

export async function updateClient(id: string, payload: Partial<ClientPayload>): Promise<Client> {
  const { data } = await api.patch<Client>(`/api/clients/${id}/`, payload);
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/api/clients/${id}/`);
}
