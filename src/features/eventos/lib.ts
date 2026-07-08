import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EventStatus } from '@/types/api';

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  in_progress: 'En curso',
  completed: 'Finalizado',
  canceled: 'Cancelado',
};

/** Clases Tailwind por estado — mismo lenguaje visual que proyectos/citas. */
export const EVENT_STATUS_STYLE: Record<EventStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-accent text-accent-foreground',
  in_progress: 'bg-primary text-primary-foreground',
  completed: 'bg-secondary text-secondary-foreground',
  canceled: 'bg-destructive/10 text-destructive',
};

/** Orden en el que se ofrecen los estados al crear (flujo natural). */
export const EVENT_STATUS_OPTIONS: EventStatus[] = [
  'draft',
  'published',
  'in_progress',
  'completed',
  'canceled',
];

/**
 * Rango de fechas legible. Si empieza y termina el mismo día, muestra el día
 * una vez con las dos horas: "3 jun 2026, 08:00–22:00". Si abarca varios
 * días: "1 jun 08:00 → 3 jun 22:00".
 */
export function formatEventRange(startISO: string, endISO: string): string {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const sameDay = format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');
  if (sameDay) {
    return `${format(start, "d MMM yyyy, HH:mm", { locale: es })}–${format(end, 'HH:mm', {
      locale: es,
    })}`;
  }
  return `${format(start, "d MMM HH:mm", { locale: es })} → ${format(end, "d MMM yyyy HH:mm", {
    locale: es,
  })}`;
}

/**
 * Convierte el valor de un <input type="datetime-local"> (hora local, sin
 * zona) al ISO/UTC que espera el backend. Mismo patrón que agenda/equipo.
 */
export function localToISO(value: string): string {
  return new Date(value).toISOString();
}
