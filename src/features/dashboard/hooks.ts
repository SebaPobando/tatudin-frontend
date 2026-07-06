import { useQuery } from '@tanstack/react-query';
import { isSameDay, parseISO } from 'date-fns';
import { useTenantStore } from '@/stores/tenant';
import * as dashboardApi from './api';

/**
 * queryKey incluye el tenant id: si cambias de estudio, TanStack Query
 * NO debe reusar el cache del anterior (aislamiento también en el cliente).
 */
export function useTodayAppointments() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['appointments', 'today', tenantId],
    queryFn: dashboardApi.getAppointmentsFirstPage,
    select: (data) =>
      data.results
        .filter((a) => isSameDay(parseISO(a.start_at), new Date()))
        .filter((a) => a.status !== 'canceled' && a.status !== 'no_show')
        .sort((a, b) => a.start_at.localeCompare(b.start_at)),
  });
}

export function useClientsCount() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['clients', 'count', tenantId],
    queryFn: dashboardApi.getClientsCount,
  });
}

/**
 * /api/analytics/overview/ exige rol owner/admin (403 para el resto).
 * En vez de disparar la request y comernos el 403, no la habilitamos:
 * `enabled` es la forma idiomática de TanStack Query para esto.
 */
export function useAnalyticsOverview(period: 'week' | 'month' | 'year' = 'month') {
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const isStaff = activeTenant?.role === 'owner' || activeTenant?.role === 'admin';
  return useQuery({
    queryKey: ['analytics', 'overview', period, activeTenant?.id],
    queryFn: () => dashboardApi.getAnalyticsOverview(period),
    enabled: isStaff,
  });
}

/** P&L es owner/admin only — misma técnica de `enabled` que analytics. */
export function usePnl(period: 'week' | 'month' | 'year' = 'month') {
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const isStaff = activeTenant?.role === 'owner' || activeTenant?.role === 'admin';
  return useQuery({
    queryKey: ['pnl', period, activeTenant?.id],
    queryFn: () => dashboardApi.getPnl(period),
    enabled: isStaff,
  });
}
