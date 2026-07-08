import type { AnalyticsPeriod } from '@/types/api';

export const PERIOD_LABEL: Record<AnalyticsPeriod, string> = {
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
};

export const PERIOD_OPTIONS: AnalyticsPeriod[] = ['week', 'month', 'year'];

/**
 * Formatea una tasa. El backend las manda como fracción (0..1); por robustez,
 * si llegara un valor > 1 lo tratamos como porcentaje ya escalado.
 */
export function formatRate(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct)}%`;
}
