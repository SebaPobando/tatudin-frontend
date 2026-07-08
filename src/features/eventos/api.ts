import { api } from '@/api/client';
import type { Event, EventArtist, EventStatus, Paginated } from '@/types/api';

// ── Eventos ──────────────────────────────────────────────────────
// GET/list/detail: cualquier miembro. POST/DELETE evento y asignaciones:
// owner o admin (el backend responde 403 al resto).

export interface EventPayload {
  name: string;
  description?: string;
  location?: string;
  start_at: string;
  end_at: string;
  status?: EventStatus;
}

export async function getEvents(): Promise<Event[]> {
  const { data } = await api.get<Paginated<Event>>('/api/eventos/events/', {
    params: { page_size: 100 },
  });
  return data.results;
}

export async function getEvent(id: string): Promise<Event> {
  const { data } = await api.get<Event>(`/api/eventos/events/${id}/`);
  return data;
}

export async function createEvent(payload: EventPayload): Promise<Event> {
  const { data } = await api.post<Event>('/api/eventos/events/', payload);
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/api/eventos/events/${id}/`);
}

// ── Artistas asignados ───────────────────────────────────────────

/** Tolera lista plana o paginada — el shape de este sub-recurso no está confirmado. */
export async function getEventArtists(eventId: string): Promise<EventArtist[]> {
  const { data } = await api.get<Paginated<EventArtist> | EventArtist[]>(
    `/api/eventos/events/${eventId}/artists/`,
  );
  return Array.isArray(data) ? data : data.results;
}

export interface AssignArtistPayload {
  user_id: string;
  /** Opcional: null/omitido = usa el default del estudio. */
  commission_percentage?: string;
  notes?: string;
}

export async function assignArtist(
  eventId: string,
  payload: AssignArtistPayload,
): Promise<EventArtist> {
  const { data } = await api.post<EventArtist>(
    `/api/eventos/events/${eventId}/assign-artist/`,
    payload,
  );
  return data;
}

/** `artistId` = PK de la asignación (EventArtist.id), no el user_id. */
export async function removeArtist(eventId: string, artistId: string): Promise<void> {
  await api.delete(`/api/eventos/events/${eventId}/artists/${artistId}/`);
}
