import { api } from '@/api/client';
import type {
  Appointment,
  AppointmentParticipant,
  AppointmentReason,
  Project,
  Booth,
  CreateAppointmentPayload,
  Paginated,
  WorkingHours,
} from '@/types/api';

/**
 * TODO(backend): GET /appointments/ solo acepta `page` (confirmado en Swagger
 * el 2026-07-06). Hasta que existan filtros de fecha, traemos todo paginando
 * con un tope de seguridad y filtramos client-side. Con >250 citas activas
 * esto deja de escalar — el fix correcto es server-side.
 */
export async function getAllAppointments(maxPages = 10): Promise<Appointment[]> {
  const all: Appointment[] = [];
  let page = 1;
  for (;;) {
    const { data } = await api.get<Paginated<Appointment>>('/api/agenda/appointments/', {
      params: { page },
    });
    all.push(...data.results);
    if (!data.next || page >= maxPages) return all;
    page += 1;
  }
}

export async function getAppointment(id: string): Promise<Appointment> {
  const { data } = await api.get<Appointment>(`/api/agenda/appointments/${id}/`);
  return data;
}

export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const { data } = await api.post<Appointment>('/api/agenda/appointments/', payload);
  return data;
}

export async function updateAppointment(
  id: string,
  payload: Partial<CreateAppointmentPayload> & { status?: Appointment['status'] },
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/api/agenda/appointments/${id}/`, payload);
  return data;
}

export async function getBooths(): Promise<Booth[]> {
  const { data } = await api.get<Paginated<Booth>>('/api/agenda/booths/', {
    params: { page_size: 100 },
  });
  return data.results;
}

/** Body documentado: {name, description, is_active}. */
export async function createBooth(payload: {
  name: string;
  description?: string;
  is_active?: boolean;
}): Promise<Booth> {
  const { data } = await api.post<Booth>('/api/agenda/booths/', payload);
  return data;
}

export async function updateBooth(
  id: string,
  payload: Partial<{ name: string; description: string; is_active: boolean }>,
): Promise<Booth> {
  const { data } = await api.patch<Booth>(`/api/agenda/booths/${id}/`, payload);
  return data;
}

/** DELETE es soft delete en el backend (BaseModel) — reversible vía admin. */
export async function deleteBooth(id: string): Promise<void> {
  await api.delete(`/api/agenda/booths/${id}/`);
}

// ── Motivos de cita ──────────────────────────────────────────────

export async function getReasons(): Promise<AppointmentReason[]> {
  const { data } = await api.get<Paginated<AppointmentReason>>('/api/agenda/reasons/', {
    params: { page_size: 100 },
  });
  return data.results;
}

export async function createReason(payload: {
  name: string;
  code: string;
  color: string;
}): Promise<AppointmentReason> {
  const { data } = await api.post<AppointmentReason>('/api/agenda/reasons/', payload);
  return data;
}

export async function updateReason(
  id: string,
  payload: Partial<{ name: string; color: string; is_active: boolean; sort_order: number }>,
): Promise<AppointmentReason> {
  const { data } = await api.patch<AppointmentReason>(`/api/agenda/reasons/${id}/`, payload);
  return data;
}

export async function deleteReason(id: string): Promise<void> {
  await api.delete(`/api/agenda/reasons/${id}/`);
}

// ── Horarios de trabajo (solo owner/admin) ───────────────────────

export async function getWorkingHours(): Promise<WorkingHours[]> {
  const { data } = await api.get<Paginated<WorkingHours>>('/api/agenda/working-hours/', {
    params: { page_size: 100 },
  });
  return data.results;
}

/** `artist` (uuid del user) es el campo writable; null = default del estudio. */
export async function createWorkingHours(payload: {
  artist?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
}): Promise<WorkingHours> {
  const { data } = await api.post<WorkingHours>('/api/agenda/working-hours/', payload);
  return data;
}

export async function updateWorkingHours(
  id: string,
  payload: Partial<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>,
): Promise<WorkingHours> {
  const { data } = await api.patch<WorkingHours>(`/api/agenda/working-hours/${id}/`, payload);
  return data;
}

export async function deleteWorkingHours(id: string): Promise<void> {
  await api.delete(`/api/agenda/working-hours/${id}/`);
}

// ── Proyectos multi-sesión ───────────────────────────────────────

/** ⚠ Los campos writable son `client` y `lead_artist` (sin _id) — OPTIONS 2026-07-06. */
export interface ProjectPayload {
  title: string;
  description?: string;
  client: string;
  lead_artist: string;
  estimated_sessions?: number | null;
  estimated_total_price?: string;
  reference_notes?: string;
}

export async function getProjects(): Promise<Project[]> {
  const { data } = await api.get<Paginated<Project>>('/api/agenda/projects/', {
    params: { page_size: 100 },
  });
  return data.results;
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get<Project>(`/api/agenda/projects/${id}/`);
  return data;
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const { data } = await api.post<Project>('/api/agenda/projects/', payload);
  return data;
}

export async function updateProject(
  id: string,
  payload: Partial<ProjectPayload> & { status?: Project['status'] },
): Promise<Project> {
  const { data } = await api.patch<Project>(`/api/agenda/projects/${id}/`, payload);
  return data;
}

/** Citas vinculadas al proyecto (tolerante a lista plana o paginada). */
export async function getProjectSessions(id: string): Promise<Appointment[]> {
  const { data } = await api.get<Appointment[] | Paginated<Appointment>>(
    `/api/agenda/projects/${id}/sessions/`,
  );
  return Array.isArray(data) ? data : data.results;
}

/** El backend valida que TODAS las sesiones estén completed/canceled → 400 si no. */
export async function completeProject(id: string): Promise<Project> {
  const { data } = await api.post<Project>(`/api/agenda/projects/${id}/complete/`);
  return data;
}

// ── Participantes (citas grupales) ───────────────────────────────

export async function getParticipants(appointmentId: string): Promise<AppointmentParticipant[]> {
  const { data } = await api.get<Paginated<AppointmentParticipant>>(
    `/api/agenda/appointments/${appointmentId}/participants/`,
  );
  return data.results;
}

/** El backend impide repetir el mismo client como participante (UniqueConstraint). */
export async function addParticipant(
  appointmentId: string,
  payload: { client: string; individual_price?: string; notes?: string },
): Promise<AppointmentParticipant> {
  const { data } = await api.post<AppointmentParticipant>(
    `/api/agenda/appointments/${appointmentId}/participants/`,
    payload,
  );
  return data;
}
