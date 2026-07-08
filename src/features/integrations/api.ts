import { api } from '@/api/client';
import type {
  ConnectionStatus,
  IntegrationConnection,
  IntegrationProvider,
  NotificationOutbox,
  Paginated,
} from '@/types/api';

// CRUD de conexiones (owner/admin) + outbox de notificaciones (read-only).

export interface ConnectionPayload {
  provider: IntegrationProvider;
  status?: ConnectionStatus;
  config?: Record<string, unknown>;
  /** Se cifra en el backend. Manda '' para limpiar el secret guardado. */
  secret?: string;
}

export async function getConnections(): Promise<IntegrationConnection[]> {
  const { data } = await api.get<Paginated<IntegrationConnection> | IntegrationConnection[]>(
    '/api/integrations/connections/',
    { params: { page_size: 100 } },
  );
  return Array.isArray(data) ? data : data.results;
}

export async function createConnection(
  payload: ConnectionPayload,
): Promise<IntegrationConnection> {
  const { data } = await api.post<IntegrationConnection>(
    '/api/integrations/connections/',
    payload,
  );
  return data;
}

export async function updateConnection(
  id: string,
  payload: Partial<ConnectionPayload>,
): Promise<IntegrationConnection> {
  const { data } = await api.patch<IntegrationConnection>(
    `/api/integrations/connections/${id}/`,
    payload,
  );
  return data;
}

export async function deleteConnection(id: string): Promise<void> {
  await api.delete(`/api/integrations/connections/${id}/`);
}

export async function getNotifications(page = 1): Promise<Paginated<NotificationOutbox>> {
  const { data } = await api.get<Paginated<NotificationOutbox>>(
    '/api/integrations/notifications/',
    { params: { page } },
  );
  return data;
}
