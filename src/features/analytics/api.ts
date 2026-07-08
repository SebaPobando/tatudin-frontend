import { api } from '@/api/client';
import type {
  AnalyticsByArtist,
  AnalyticsByDayOfWeek,
  AnalyticsFunnel,
  AnalyticsOverview,
  AnalyticsPeriod,
} from '@/types/api';

// Todos los endpoints de analytics exigen owner/admin (403 al resto) y
// aceptan ?period=week|month|year. El overview tiene shape CONFIRMADO; los
// tres breakdowns son tolerantes (ver lib.ts) hasta confirmar por probe.

export async function getOverview(period: AnalyticsPeriod): Promise<AnalyticsOverview> {
  const { data } = await api.get<AnalyticsOverview>('/api/analytics/overview/', {
    params: { period },
  });
  return data;
}

export async function getByArtist(period: AnalyticsPeriod): Promise<AnalyticsByArtist> {
  const { data } = await api.get<AnalyticsByArtist>('/api/analytics/by-artist/', {
    params: { period },
  });
  return data;
}

export async function getByDayOfWeek(period: AnalyticsPeriod): Promise<AnalyticsByDayOfWeek> {
  const { data } = await api.get<AnalyticsByDayOfWeek>('/api/analytics/by-day-of-week/', {
    params: { period },
  });
  return data;
}

export async function getFunnel(period: AnalyticsPeriod): Promise<AnalyticsFunnel> {
  const { data } = await api.get<AnalyticsFunnel>('/api/analytics/funnel/', {
    params: { period },
  });
  return data;
}
