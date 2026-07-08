import { useQuery } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenant';
import type { AnalyticsPeriod } from '@/types/api';
import * as analyticsApi from './api';

/**
 * Todos los endpoints de analytics son owner/admin only. Igual que en el
 * dashboard, usamos `enabled` para no disparar la request (y comernos un 403)
 * cuando el rol no corresponde. La queryKey incluye tenant + período para
 * aislar cache entre estudios y refetch al cambiar el toggle.
 */
function useStaff() {
  const role = useTenantStore((s) => s.activeTenant?.role);
  return role === 'owner' || role === 'admin';
}

export function useOverview(period: AnalyticsPeriod) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  const isStaff = useStaff();
  return useQuery({
    queryKey: ['analytics', 'overview', period, tenantId],
    queryFn: () => analyticsApi.getOverview(period),
    enabled: isStaff,
  });
}

export function useByArtist(period: AnalyticsPeriod) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  const isStaff = useStaff();
  return useQuery({
    queryKey: ['analytics', 'by-artist', period, tenantId],
    queryFn: () => analyticsApi.getByArtist(period),
    enabled: isStaff,
  });
}

export function useByDayOfWeek(period: AnalyticsPeriod) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  const isStaff = useStaff();
  return useQuery({
    queryKey: ['analytics', 'by-day', period, tenantId],
    queryFn: () => analyticsApi.getByDayOfWeek(period),
    enabled: isStaff,
  });
}

export function useFunnel(period: AnalyticsPeriod) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  const isStaff = useStaff();
  return useQuery({
    queryKey: ['analytics', 'funnel', period, tenantId],
    queryFn: () => analyticsApi.getFunnel(period),
    enabled: isStaff,
  });
}
