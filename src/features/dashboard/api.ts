import { api } from '@/api/client';
import type { AnalyticsOverview, Appointment, Paginated, Pnl } from '@/types/api';

/**
 * TODO(Fase 4): el integration guide no documenta filtros por fecha para
 * /api/agenda/appointments/ — validarlos en /api/docs/ antes de usarlos.
 * Mientras tanto traemos la primera página y filtramos client-side (con
 * >25 citas futuras esto puede omitir citas de hoy; aceptable de placeholder).
 */
export async function getAppointmentsFirstPage(): Promise<Paginated<Appointment>> {
  const { data } = await api.get<Paginated<Appointment>>('/api/agenda/appointments/');
  return data;
}

/** El `count` de la paginación DRF nos da el total sin traer los registros. */
export async function getClientsCount(): Promise<number> {
  const { data } = await api.get<Paginated<unknown>>('/api/clients/', {
    params: { page_size: 1 },
  });
  return data.count;
}

export async function getAnalyticsOverview(
  period: 'week' | 'month' | 'year' = 'month',
): Promise<AnalyticsOverview> {
  const { data } = await api.get<AnalyticsOverview>('/api/analytics/overview/', {
    params: { period },
  });
  return data;
}

export async function getPnl(period: 'week' | 'month' | 'year' = 'month'): Promise<Pnl> {
  const { data } = await api.get<Pnl>('/api/finanzas/pnl/', { params: { period } });
  return data;
}
