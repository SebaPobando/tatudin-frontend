import { api } from '@/api/client';
import type { Paginated, Service } from '@/types/api';

export interface ServicePayload {
  name: string;
  description?: string;
  default_duration: string; // "HH:MM:SS" (DurationField de Django)
  base_price?: string;
  requires_deposit?: boolean;
  default_deposit_amount?: string | null;
  color?: string;
  default_artist?: string | null;
}

export async function getServices(): Promise<Service[]> {
  const { data } = await api.get<Paginated<Service>>('/api/catalog/services/', {
    params: { page_size: 100 },
  });
  return data.results;
}

export async function createService(payload: ServicePayload): Promise<Service> {
  const { data } = await api.post<Service>('/api/catalog/services/', payload);
  return data;
}

export async function updateService(
  id: string,
  payload: Partial<ServicePayload> & { is_active?: boolean },
): Promise<Service> {
  const { data } = await api.patch<Service>(`/api/catalog/services/${id}/`, payload);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/api/catalog/services/${id}/`);
}
