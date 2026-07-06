import { isAxiosError } from 'axios';
import { format, parseISO } from 'date-fns';
import type { UseFormSetError } from 'react-hook-form';
import { getApiErrorMessage } from '@/api/errors';
import type { Appointment, AppointmentStatus, CreateAppointmentPayload } from '@/types/api';
import type { AppointmentValues } from './schemas';

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  in_progress: 'En sesión',
  completed: 'Completada',
  canceled: 'Cancelada',
  no_show: 'No asistió',
};

/**
 * Convierte los valores del form (fecha + horas locales) al payload del API
 * (ISO 8601 con timezone — el backend guarda tstzrange). `new Date(...)`
 * interpreta el string como hora local y toISOString() lo lleva a UTC.
 */
export function valuesToPayload(
  values: AppointmentValues,
  artistId: string,
): CreateAppointmentPayload {
  return {
    artist_id: artistId,
    booth_id: values.booth_id || null,
    client_id: values.client_id || undefined,
    reason_id: values.reason_id || undefined,
    service_id: values.service_id || undefined,
    project_id: values.project_id || undefined,
    client_name: values.client_name,
    client_phone: values.client_phone || undefined,
    start_at: new Date(`${values.date}T${values.start_time}`).toISOString(),
    end_at: new Date(`${values.date}T${values.end_time}`).toISOString(),
    estimated_price: values.estimated_price || undefined,
    notes: values.notes || undefined,
  };
}

/**
 * Mapea errores 400 del backend a campos del form. Clave para el error de
 * solapamiento: {"artist_id": "Este artista ya tiene una cita en ese horario."}
 * debe aparecer JUNTO al horario, no como error genérico.
 */
const SERVER_FIELD_MAP: Record<string, keyof AppointmentValues> = {
  client_name: 'client_name',
  client_phone: 'client_phone',
  booth_id: 'booth_id',
  start_at: 'start_time',
  end_at: 'end_time',
  estimated_price: 'estimated_price',
  notes: 'notes',
  artist_id: 'start_time', // solapamiento del artista → mostrar en el horario
};

export function applyServerErrors(
  error: unknown,
  setError: UseFormSetError<AppointmentValues>,
): void {
  if (isAxiosError(error) && error.response?.status === 400 && error.response.data) {
    for (const [key, value] of Object.entries(error.response.data as Record<string, unknown>)) {
      const message = Array.isArray(value) ? value[0] : value;
      const field = SERVER_FIELD_MAP[key];
      if (typeof message === 'string' && field) {
        setError(field, { type: 'server', message });
        return;
      }
    }
  }
  setError('root', { type: 'server', message: getApiErrorMessage(error) });
}

export function appointmentToValues(appointment: Appointment): AppointmentValues {
  return {
    artist_id: appointment.artist_id,
    client_id: appointment.client_id ?? '',
    reason_id: appointment.reason_id ?? '',
    service_id: appointment.service_id ?? '',
    project_id: appointment.project_id ?? '',
    client_name: appointment.client_name,
    client_phone: appointment.client_phone ?? '',
    date: format(parseISO(appointment.start_at), 'yyyy-MM-dd'),
    start_time: format(parseISO(appointment.start_at), 'HH:mm'),
    end_time: format(parseISO(appointment.end_at), 'HH:mm'),
    booth_id: appointment.booth_id ?? '',
    estimated_price: appointment.estimated_price ?? '',
    notes: appointment.notes ?? '',
  };
}

/** 0=Lunes … 6=Domingo — convención weekday() de Python, confirmada en OPTIONS. */
export const DAY_LABEL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** "Sesión de proyecto" → "sesion_de_proyecto" (code único por tenant). */
export function toCode(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export const PROJECT_STATUS_LABEL: Record<
  'planning' | 'in_progress' | 'on_hold' | 'completed' | 'canceled',
  string
> = {
  planning: 'En planificación',
  in_progress: 'En curso',
  on_hold: 'En pausa',
  completed: 'Completado',
  canceled: 'Cancelado',
};

/**
 * Progreso calculado client-side desde los conteos (ints, sin ambigüedad).
 * No usamos progress_percentage del backend hasta confirmar su escala.
 */
export function projectProgress(completed: number, estimated: number | null): number {
  if (!estimated || estimated <= 0) return 0;
  return Math.min(100, Math.round((completed / estimated) * 100));
}
