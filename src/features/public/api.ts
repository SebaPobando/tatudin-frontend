import { publicApi } from '@/api/publicClient';
import type { PublicCalendar, PublicFormTemplate, PublicStats } from '@/types/api';

export async function getPublicForm(
  tenantSlug: string,
  formSlug: string,
): Promise<PublicFormTemplate> {
  const { data } = await publicApi.get<PublicFormTemplate>(
    `/api/public/forms/${tenantSlug}/${formSlug}/`,
  );
  return data;
}

/**
 * Body: `answers` es el único campo confirmado como requerido (probe 2026-07-06).
 * visitor_* van como extras razonables — DRF ignora keys desconocidas, y el
 * master doc dice que visitor_email auto-vincula con Client si matchea.
 */
export interface PublicSubmitPayload {
  answers: { field_id: string; value: string }[];
  visitor_name?: string;
  visitor_email?: string;
  visitor_phone?: string;
}

export async function submitPublicForm(
  tenantSlug: string,
  formSlug: string,
  payload: PublicSubmitPayload,
): Promise<unknown> {
  const { data } = await publicApi.post(
    `/api/public/forms/${tenantSlug}/${formSlug}/submit/`,
    payload,
  );
  return data;
}

export async function getPublicCalendar(
  tenantSlug: string,
  month: string,
): Promise<PublicCalendar> {
  const { data } = await publicApi.get<PublicCalendar>(`/api/public/calendar/${tenantSlug}/`, {
    params: { month },
  });
  return data;
}

export async function getPublicStats(tenantSlug: string): Promise<PublicStats> {
  const { data } = await publicApi.get<PublicStats>(`/api/public/stats/${tenantSlug}/`);
  return data;
}
