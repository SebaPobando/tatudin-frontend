import { api } from '@/api/client';
import type { Paginated, TeamMember } from '@/types/api';

/** Solo owner/admin — el backend responde 403 al resto. */
export async function getTeam(): Promise<TeamMember[]> {
  const { data } = await api.get<Paginated<TeamMember>>('/api/tenants/team/', {
    params: { page_size: 100 },
  });
  return data.results;
}

/**
 * Invita a un usuario EXISTENTE (el flujo con email+token es post-MVP del
 * backend). Vigencia opcional: la esencia de los guests por temporada.
 * Body documentado en docs/FRONTEND_INTEGRATION.md.
 */
export async function inviteMember(payload: {
  email: string;
  role: string;
  valid_from?: string;
  valid_until?: string;
}): Promise<TeamMember> {
  const { data } = await api.post<TeamMember>('/api/tenants/team/', payload);
  return data;
}

/** Revoca la membership (soft — preserva auditoría). El backend impide auto-revocarse. */
export async function revokeMember(membershipId: string): Promise<void> {
  await api.delete(`/api/tenants/team/${membershipId}/`);
}
